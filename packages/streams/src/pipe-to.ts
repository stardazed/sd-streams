/**
 * streams/pipe-to - pipeTo algorithm implementation
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

import * as rs from "./readable-internals";
import * as ws from "./writable-internals";
import * as shared from "./shared-internals";

import { ReadableStreamDefaultReader } from "./readable-stream-default-reader";
import { WritableStreamDefaultWriter } from "./writable-stream-default-writer";

// add a wrapper to handle falsy rejections
interface ErrorWrapper {
	actualError: any;
}

export function pipeTo<OutputType, InputType>(source: rs.ReadableStream<OutputType>, dest: ws.WritableStream<InputType>, options: rs.PipeToOptions) {
	const preventClose = !!options.preventClose;
	const preventAbort = !!options.preventAbort;
	const preventCancel = !!options.preventCancel;

	let shuttingDown = false;
	let latestWrite = Promise.resolve();
	const promise = shared.createControlledPromise<void>();

	// If IsReadableByteStreamController(this.[[readableStreamController]]) is true, let reader be either ! AcquireReadableStreamBYOBReader(this) or ! AcquireReadableStreamDefaultReader(this), at the user agent’s discretion.
	// Otherwise, let reader be ! AcquireReadableStreamDefaultReader(this).
	const reader = new ReadableStreamDefaultReader(source);
	const writer = new WritableStreamDefaultWriter(dest);

	function onStreamErrored(stream: rs.ReadableStream<OutputType> | ws.WritableStream<InputType>, promise: Promise<void>, action: (error: shared.ErrorResult) => void) {
		if (stream[shared.state_] === "errored") {
			action(stream[shared.storedError_]);
		} else {
			promise.catch(action);
		}
	}

	function onStreamClosed(stream: rs.ReadableStream<OutputType> | ws.WritableStream<InputType>, promise: Promise<void>, action: () => void) {
		if (stream[shared.state_] === "closed") {
			action();
		} else {
			promise.then(action);
		}
	}

	onStreamErrored(source, reader[rs.closedPromise_].promise, error => {
		if (! preventAbort) {
			shutDown(() => ws.writableStreamAbort(dest, error), { actualError: error });
		}
		else {
			shutDown(undefined, { actualError: error });
		}
	});

	onStreamErrored(dest, writer[ws.closedPromise_].promise, error => {
		if (! preventCancel) {
			shutDown(() => rs.readableStreamCancel(source, error), { actualError: error });
		}
		else {
			shutDown(undefined, { actualError: error });
		}
	});

	onStreamClosed(source, reader[rs.closedPromise_].promise, () => {
		if (! preventClose) {
			shutDown(() => ws.writableStreamDefaultWriterCloseWithErrorPropagation(writer));
		}
		else {
			shutDown();
		}
	});

	if (ws.writableStreamCloseQueuedOrInFlight(dest) || dest[shared.state_] === "closed") {
		// Assert: no chunks have been read or written.
		const destClosed = new TypeError();
		if (! preventCancel) {
			shutDown(() => rs.readableStreamCancel(source, destClosed), { actualError: destClosed });
		}
		else {
			shutDown(undefined, { actualError: destClosed });
		}
	}

	function awaitLatestWrite(): Promise<void> {
		const curLatestWrite = latestWrite;
		return latestWrite.then(() => curLatestWrite === latestWrite ? undefined : awaitLatestWrite());
	}

	function flushRemainder() {
		if (dest[shared.state_] === "writable" && (! ws.writableStreamCloseQueuedOrInFlight(dest))) {
			return awaitLatestWrite();
		}
		else {
			return undefined;
		}
	}

	function shutDown(action?: () => Promise<void>, error?: ErrorWrapper) {
		if (shuttingDown) {
			return;
		}
		shuttingDown = true;

		if (action === undefined) {
			action = () => Promise.resolve();
		}

		function finishShutDown() {
			action!().then(
				_ => finalize(error),
				newError => finalize({ actualError: newError })
			);
		}

		const flushWait = flushRemainder();
		if (flushWait) {
			flushWait.then(finishShutDown);
		}
		else {
			finishShutDown();
		}
	}

	function finalize(error?: ErrorWrapper) {
		ws.writableStreamDefaultWriterRelease(writer);
		rs.readableStreamReaderGenericRelease(reader);
		if (error) {
			promise.reject(error.actualError);
		}
		else {
			promise.resolve(undefined);
		}
	}

	function next() {
		if (shuttingDown) {
			return;
		}

		writer[ws.readyPromise_].promise.then(() => {
			rs.readableStreamDefaultReaderRead(reader).then(
				({ value, done }) => {
					if (done) {
						return;
					}
					latestWrite = ws.writableStreamDefaultWriterWrite(writer, value).catch(() => {});
					next();
				},
				_error => {
					latestWrite = Promise.resolve();
				}
			);
		});
	}

	next();

	return promise.promise;
}
