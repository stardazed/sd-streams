/**
 * streams/readable-stream - ReadableStream implementation
 * Part of Stardazed
 * (c) 2015-Present by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/stardazed
 */

import * as rs from "./readable-internals";
import { ReadableStreamDefaultController } from "./readable-stream-default-controller";
import { ReadableStreamDefaultReader } from "./readable-stream-default-reader";

export class ReadableStream implements rs.ReadableStream {
	[rs.state_]: rs.ReadableStreamState;
	[rs.reader_]: rs.ReadableStreamReader | undefined;
	[rs.storedError_]: any;
	[rs.readableStreamController_]: rs.ReadableStreamController;

	constructor(source: rs.ReadableStreamSource = {}, strategy: rs.ReadableStreamStrategy = {}) {
		this[rs.state_] = "readable";
		this[rs.reader_] = undefined;
		this[rs.storedError_] = undefined;

		const sourceType = source.type;
		if (sourceType === undefined) {
			const sizeAlgorithm = rs.makeSizeAlgorithmFromSizeFunction(strategy.size);
			const highWaterMark = rs.validateAndNormalizeHighWaterMark(strategy.highWaterMark === undefined ? 1 : strategy.highWaterMark);
			new ReadableStreamDefaultController(this, source, highWaterMark, sizeAlgorithm);
		}
		else if (sourceType === "bytes") {
			throw new RangeError("Sources of type 'bytes' not implemented yet.");
		}
		else {
			throw new RangeError("The underlying source's `type` field must be undefined or 'bytes'");
		}
	}

	get locked(): boolean {
		return rs.isReadableStreamLocked(this);
	}

	getReader(options: rs.ReadableStreamReaderOptions = {}): rs.ReadableStreamReader {
		const { mode } = options;
		if (mode === undefined) {
			return new ReadableStreamDefaultReader(this);
		}
		else if (mode === "byob") {
			throw RangeError("byob reader mode not implemented yet");
		}
		throw RangeError("mode option must be undefined or `byob`");
	}

	cancel(reason: string): Promise<void> {
		if (rs.isReadableStreamLocked(this)) {
			return Promise.reject(new TypeError("Cannot cancel a locked stream"));
		}
		return rs.readableStreamCancel(this, reason);
	}

/*
	pipeThrough({ writable, readable }, options) {
	}

	pipeTo(dest, { preventClose, preventAbort, preventCancel } = {}) {
	}

	tee() {
	}
*/
}
