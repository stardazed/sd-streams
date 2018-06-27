/**
 * streams/readable-stream - ReadableStream class implementation
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

import * as rs from "./readable-internals";
import * as ws from "./writable-internals";
import * as shared from "./shared-internals";
import { pipeTo } from "./pipe-to";

import { ReadableStreamDefaultController, setUpReadableStreamDefaultControllerFromUnderlyingSource } from "./readable-stream-default-controller";
import { ReadableStreamDefaultReader } from "./readable-stream-default-reader";

import { ReadableByteStreamController, setUpReadableByteStreamControllerFromUnderlyingSource } from "./readable-byte-stream-controller";
import { ReadableStreamBYOBReader } from "./readable-stream-byob-reader";

export class ReadableStream implements rs.ReadableStream {
	[rs.state_]: rs.ReadableStreamState;
	[rs.reader_]: rs.ReadableStreamReader | undefined;
	[rs.storedError_]: any;
	[rs.readableStreamController_]: rs.ReadableStreamController;

	constructor(source: rs.ReadableStreamSource = {}, strategy: shared.StreamStrategy = {}) {
		rs.initializeReadableStream(this);

		const sizeFunc = strategy.size;
		const stratHWM = strategy.highWaterMark;
		const sourceType = source.type;

		if (sourceType === undefined) {
			const sizeAlgorithm = shared.makeSizeAlgorithmFromSizeFunction(sizeFunc);
			const highWaterMark = shared.validateAndNormalizeHighWaterMark(stratHWM === undefined ? 1 : stratHWM);
			setUpReadableStreamDefaultControllerFromUnderlyingSource(this, source, highWaterMark, sizeAlgorithm);
		}
		else if (String(sourceType) === "bytes") {
			if (sizeFunc !== undefined) {
				throw new RangeError("bytes streams cannot have a strategy with a `size` field");
			}
			const highWaterMark = shared.validateAndNormalizeHighWaterMark(stratHWM === undefined ? 0 : stratHWM);
			setUpReadableByteStreamControllerFromUnderlyingSource(this, source, highWaterMark);
		}
		else {
			throw new RangeError("The underlying source's `type` field must be undefined or 'bytes'");
		}
	}

	get locked(): boolean {
		return rs.isReadableStreamLocked(this);
	}

	getReader(options: rs.ReadableStreamReaderOptions = {}): rs.ReadableStreamReader {
		if (! rs.isReadableStream(this)) {
			throw new TypeError();
		}
		const { mode } = options;
		if (mode === undefined) {
			return new ReadableStreamDefaultReader(this);
		}
		else if (String(mode) === "byob") {
			return new ReadableStreamBYOBReader(this);
		}
		throw RangeError("mode option must be undefined or `byob`");
	}

	cancel(reason: any): Promise<void> {
		if (! rs.isReadableStream(this)) {
			return Promise.reject(new TypeError());
		}
		if (rs.isReadableStreamLocked(this)) {
			return Promise.reject(new TypeError("Cannot cancel a locked stream"));
		}
		return rs.readableStreamCancel(this, reason);
	}

	tee(): ReadableStream[] {
		if (! rs.isReadableStream(this)) {
			throw new TypeError();
		}
		// Assert: Type(cloneForBranch2) is Boolean.

		const reader = new ReadableStreamDefaultReader(this);
		let closedOrErrored = false;
		let canceled1 = false;
		let canceled2 = false;
		let reason1: string | undefined;
		let reason2: string | undefined;
		let branch1: ReadableStream;
		let branch2: ReadableStream;

		let cancelResolve: (reason: any) => void;
		const cancelPromise = new Promise<void>(resolve => cancelResolve = resolve);

		const pullAlgorithm = () => {
			return rs.readableStreamDefaultReaderRead(reader).then(
				({ value, done }) => {
					if (done && !closedOrErrored) {
						if (! canceled1) {
							rs.readableStreamDefaultControllerClose(branch1![rs.readableStreamController_] as ReadableStreamDefaultController);
						}
						if (! canceled2) {
							rs.readableStreamDefaultControllerClose(branch2![rs.readableStreamController_] as ReadableStreamDefaultController);
						}
						closedOrErrored = true;
					}
					if (closedOrErrored) {
						return;
					}
					const value1 = value, value2 = value;
					if (! canceled1) {
						rs.readableStreamDefaultControllerEnqueue(branch1![rs.readableStreamController_] as ReadableStreamDefaultController, value1);
					}
					if (! canceled2) {
						rs.readableStreamDefaultControllerEnqueue(branch2![rs.readableStreamController_] as ReadableStreamDefaultController, value2);
					}
				});
		};

		const cancel1Algorithm = (reason: any) => {
			canceled1 = true;
			reason1 = reason;
			if (canceled2) {
				const cancelResult = rs.readableStreamCancel(this, [reason1, reason2]);
				cancelResolve(cancelResult);
			}
			return cancelPromise;
		};

		const cancel2Algorithm = (reason: any) => {
			canceled2 = true;
			reason2 = reason;
			if (canceled1) {
				const cancelResult = rs.readableStreamCancel(this, [reason1, reason2]);
				cancelResolve(cancelResult);
			}
			return cancelPromise;
		};

		const startAlgorithm = () => undefined;
		branch1 = createReadableStream(startAlgorithm, pullAlgorithm, cancel1Algorithm);
		branch2 = createReadableStream(startAlgorithm, pullAlgorithm, cancel2Algorithm);

		reader[rs.closedPromise_].promise.catch(error => {
			if (! closedOrErrored) {
				rs.readableStreamDefaultControllerError(branch1![rs.readableStreamController_] as ReadableStreamDefaultController, error);
				rs.readableStreamDefaultControllerError(branch2![rs.readableStreamController_] as ReadableStreamDefaultController, error);
				closedOrErrored = true;
			}
		});

		return [branch1, branch2];
	}

	pipeThrough(transform: rs.StreamTransform, options?: rs.PipeToOptions): ReadableStream {
		const { readable, writable } = transform;
		if (readable === undefined || writable === undefined) {
			throw new TypeError("Both a readable and writable stream must be provided");
		}
		this.pipeTo(writable, options);
		return readable;
	}

	pipeTo(dest: ws.WritableStream, options: rs.PipeToOptions = {}): Promise<void> {
		if (! rs.isReadableStream(this)) {
			return Promise.reject(new TypeError());
		}
		if (! ws.isWritableStream(dest)) {
			return Promise.reject(new TypeError());
		}
		if (rs.isReadableStreamLocked(this)) {
			return Promise.reject(new TypeError("Cannot pipe from a locked stream"));
		}
		if (ws.isWritableStreamLocked(dest)) {
			return Promise.reject(new TypeError("Cannot pipe to a locked stream"));
		}
		
		return pipeTo(this, dest, options);
	}
}


export function createReadableStream(startAlgorithm: rs.StartAlgorithm, pullAlgorithm: rs.PullAlgorithm, cancelAlgorithm: rs.CancelAlgorithm, highWaterMark?: number, sizeAlgorithm?: shared.SizeAlgorithm) {
	if (highWaterMark === undefined) {
		highWaterMark = 1;
	}
	if (sizeAlgorithm === undefined) {
		sizeAlgorithm = () => 1;
	}
	// Assert: ! IsNonNegativeNumber(highWaterMark) is true.

	const stream = Object.create(ReadableStream.prototype) as ReadableStream;
	rs.initializeReadableStream(stream);
	const controller = Object.create(ReadableStreamDefaultController.prototype) as ReadableStreamDefaultController;
	rs.setUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
	return stream;
}


export function createReadableByteStream(startAlgorithm: rs.StartAlgorithm, pullAlgorithm: rs.PullAlgorithm, cancelAlgorithm: rs.CancelAlgorithm, highWaterMark?: number, autoAllocateChunkSize?: number) {
	if (highWaterMark === undefined) {
		highWaterMark = 0;
	}
	// Assert: ! IsNonNegativeNumber(highWaterMark) is true.
	if (autoAllocateChunkSize !== undefined) {
		if (! shared.isInteger(autoAllocateChunkSize) || autoAllocateChunkSize <= 0) {
			throw new RangeError("autoAllocateChunkSize must be a positive, finite integer");
		}
	}

	const stream = Object.create(ReadableStream.prototype) as ReadableStream;
	rs.initializeReadableStream(stream);
	const controller = Object.create(ReadableByteStreamController.prototype) as ReadableByteStreamController;
	rs.setUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize);
	return stream;
}
