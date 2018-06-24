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
	[ws.closeRequest_]: ws.ControlledPromise<void> | undefined;
	[ws.inFlightWriteRequest_]: ws.ControlledPromise<void> | undefined;
	[ws.inFlightCloseRequest_]: ws.ControlledPromise<void> | undefined;
	[ws.pendingAbortRequest_]: ws.AbortRequest | undefined;
	[ws.storedError_]: any;
	[ws.writableStreamController_]: ws.WritableStreamDefaultController | undefined;
	[ws.writer_]: ws.WritableStreamDefaultWriter | undefined;
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

		const sizeAlgorithm = ws.makeSizeAlgorithmFromSizeFunction(strategy.size);
		const hwm = strategy.highWaterMark;
		const highWaterMark = ws.validateAndNormalizeHighWaterMark(hwm === undefined ? 1 : hwm);

		if (sink.type !== undefined) {
			throw new RangeError("The type of an underlying sink must be undefined");
		}

		const sinkWrite = sink.write; // avoid double access, in case it's a property
		const writeFunction = sinkWrite && sinkWrite.bind(sink);
		const closeAlgorithm = ws.createAlgorithmFromUnderlyingMethod(sink, "close", []);
		const abortAlgorithm = ws.createAlgorithmFromUnderlyingMethod(sink, "abort", []);
		const sinkStart = sink.start; // avoid double access, in case it's a property
		const startFunction = sinkStart && sinkStart.bind(sink);

		new WritableStreamDefaultController(this, startFunction, writeFunction, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
	}

	get locked(): boolean {
		if (! ws.isWritableStream(this)) {
			throw new TypeError();
		}
		return ws.isWritableStreamLocked(this);
	}

	abort(reason?: any): Promise<void> {
		if (! ws.isWritableStream(this)) {
			return Promise.reject(new TypeError());
		}
		if (ws.isWritableStreamLocked(this)) {
			return Promise.reject(new TypeError("Cannot abort a locked stream"));
		}
		return ws.writableStreamAbort(this, reason);
	}

	getWriter(): ws.WritableStreamWriter {
		if (! ws.isWritableStream(this)) {
			throw new TypeError();
		}
		return new WritableStreamDefaultWriter(this);
	}
}
