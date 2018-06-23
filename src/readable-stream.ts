/**
 * streams/readable-stream - ReadableStream implementation
 * Part of Stardazed
 * (c) 2015-Present by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/stardazed
 */

import * as rs from "./readable-internals";
import { ReadableStreamDefaultController } from "./readable-stream-default-controller";
import { ReadableStreamDefaultReader } from "./readable-stream-default-reader";

interface RSInternalConstructorOptions {
	startAlgorithm: rs.StartAlgorithm;
	pullAlgorithm: rs.PullAlgorithm;
	cancelAlgorithm: rs.CancelAlgorithm;
	highWaterMark?: number;
	sizeAlgorithm?: rs.SizeAlgorithm;
}

export class ReadableStream implements rs.ReadableStream {
	[rs.state_]: rs.ReadableStreamState;
	[rs.reader_]: rs.ReadableStreamReader | undefined;
	[rs.storedError_]: any;
	[rs.readableStreamController_]: rs.ReadableStreamController;

	constructor(source: rs.ReadableStreamSource = {}, strategy: rs.ReadableStreamStrategy = {}, _1?: never, _2?: never, internalCtor?: RSInternalConstructorOptions) {
		this[rs.state_] = "readable";
		this[rs.reader_] = undefined;
		this[rs.storedError_] = undefined;

		// allow for internal constructor parameters to be passed in 5th parameter
		// ignores other parameters
		if (arguments.length === 5 && typeof internalCtor === "object" && internalCtor !== null) {
			// CreateReadableStream algorithm (§3.3.3)
			if (internalCtor.highWaterMark === undefined) {
				internalCtor.highWaterMark = 1;
			}
			if (internalCtor.sizeAlgorithm === undefined) {
				internalCtor.sizeAlgorithm = function() { return 1; };
			}
			// Assert: IsNonNegativeNumber(highWaterMark) is true
			new ReadableStreamDefaultController(this, internalCtor.startAlgorithm, internalCtor.pullAlgorithm, internalCtor.cancelAlgorithm, internalCtor.highWaterMark, internalCtor.sizeAlgorithm);
			return;
		}

		const sourceType = source.type;
		if (sourceType === undefined) {
			const pullAlgorithm = rs.createAlgorithmFromUnderlyingMethod(source, "pull", [this]);
			const cancelAlgorithm = rs.createAlgorithmFromUnderlyingMethod(source, "cancel", []);
			const sizeAlgorithm = rs.makeSizeAlgorithmFromSizeFunction(strategy.size);
			const highWaterMark = rs.validateAndNormalizeHighWaterMark(strategy.highWaterMark === undefined ? 1 : strategy.highWaterMark);
			new ReadableStreamDefaultController(this, source.start && source.start.bind(source), pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
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

	cancel(reason: any): Promise<void> {
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
