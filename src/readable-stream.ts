/**
 * streams/readable-stream - ReadableStream implementation
 * Part of Stardazed
 * (c) 2015-Present by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/stardazed
 */

import * as rs from "./readable-internals";
import { ReadableStreamDefaultController } from "./readable-stream-default-controller";

export class ReadableStream implements rs.ReadableStream {
	[rs.state_]: rs.ReadableStreamState;
	[rs.reader_]: rs.ReadableStreamReader | undefined;
	[rs.storedError_]: any;

	constructor(source: rs.ReadableStreamSource = {}, strategy: rs.ReadableStreamStrategy = {}) {
		this[rs.state_] = "readable";
		this[rs.reader_] = undefined;
		this[rs.storedError_] = undefined;

		const sourceType = source.type;
		if (sourceType === undefined) {
			this.initWithDefaultController(source, strategy);
		}
		else if (sourceType === "bytes") {
			throw new RangeError("Sources of type 'bytes' not implemented yet.");
		}
		else {
			throw new RangeError("The underlying source's `type` field must be undefined or 'bytes'");
		}
	}

	private initWithDefaultController(source: rs.ReadableStreamSource = {}, strategy: rs.ReadableStreamStrategy = {}) {
		/*
			1. Let size be ? GetV(strategy, "size").
			2. Let highWaterMark be ? GetV(strategy, "highWaterMark").
			a. Let sizeAlgorithm be ? MakeSizeAlgorithmFromSizeFunction(size).
			b. If highWaterMark is undefined, let highWaterMark be 1.
			c. Set highWaterMark to ? ValidateAndNormalizeHighWaterMark(highWaterMark).
			d. Perform ? SetUpReadableStreamDefaultControllerFromUnderlyingSource(this, underlyingSource, highWaterMark, sizeAlgorithm).
		*/
		const sizeAlgorithm = rs.makeSizeAlgorithmFromSizeFunction(strategy.size);
		const highWaterMark = rs.validateAndNormalizeHighWaterMark(strategy.highWaterMark === undefined ? 1 : strategy.highWaterMark);
		const controller = new ReadableStreamDefaultController(this, source, highWaterMark, sizeAlgorithm);
	}

	get locked() {
		return rs.isReadableStreamLocked(this);
	}

	cancel(reason: string) {

	}

	getReader() {

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
