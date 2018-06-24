/**
 * streams/writable-stream - WritableStream implementation
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

import * as ws from "./writable-internals";
import { WritableStreamDefaultController } from "./writable-stream-controller";
import { WritableStreamDefaultWriter } from "./writable-stream-writer";

export class WritableStream {
	[ws.state_]: ws.WritableStreamState;
	[ws.backpressure_]: boolean;
	[ws.closeRequest_]: object | undefined;
	[ws.inFlightWriteRequest_]: object | undefined;
	[ws.inFlightCloseRequest_]: object | undefined;
	[ws.pendingAbortRequest_]: ws.AbortRequest | undefined;
	[ws.storedError_]: any;
	[ws.writableStreamController_]: ws.WritableStreamDefaultController | undefined;
	[ws.writer_]: ws.WritableStreamWriter | undefined;
	[ws.writeRequests_]: ws.ControlledPromise<any>[];

	constructor(sink: ws.WritableStreamSink = {}, strategy: ws.StreamStrategy = {}) {
		this[ws.state_] = "writable";
		this[ws.storedError_] = undefined;
		this[ws.writableStreamController_] = undefined;
		this[ws.closeRequest_] = undefined;
		this[ws.inFlightCloseRequest_] = undefined;
		this[ws.inFlightWriteRequest_] = undefined;
		this[ws.pendingAbortRequest_] = undefined;

		this[ws.writeRequests_] = [];
		this[ws.backpressure_] = false;

		if (sink.type !== undefined) {
			throw new RangeError("The type of an underlying sink must be undefined");
		}

		const sizeAlgorithm = ws.makeSizeAlgorithmFromSizeFunction(strategy.size);
		const highWaterMark = ws.validateAndNormalizeHighWaterMark(strategy.highWaterMark === undefined ? 1 : strategy.highWaterMark);

		const startFunction = sink.start && sink.start.bind(sink);
		const writeFunction = sink.write && sink.write.bind(sink);
		const closeAlgorithm = ws.createAlgorithmFromUnderlyingMethod(sink, "close", []);
		const abortAlgorithm = ws.createAlgorithmFromUnderlyingMethod(sink, "abort", []);

		new WritableStreamDefaultController(this, startFunction, writeFunction, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
	}

	get locked(): boolean {
		return ws.isWritableStreamLocked(this);
	}

	abort(reason?: any): Promise<void> {
		if (ws.isWritableStreamLocked(this)) {
			return Promise.reject(new TypeError("Cannot abort a locked stream"));
		}
		return ws.writableStreamAbort(this, reason);
	}

	getWriter(): ws.WritableStreamWriter {
		return new WritableStreamDefaultWriter(this);
	}
}
