/**
 * streams/writable-stream - WritableStream implementation
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

import * as ws from "./writable-internals";

export class WritableStream {
	[ws.state_]: ws.WritableStreamState;
	[ws.backpressure_]: boolean;
	[ws.closeRequest_]: object | undefined;
	[ws.inFlightWriteRequest_]: object | undefined;
	[ws.inFlightCloseRequest_]: object | undefined;
	[ws.pendingAbortRequest_]: object | undefined;
	[ws.storedError_]: any;
	[ws.writableStreamController_]: ws.WritableStreamController | undefined;
	[ws.writer_]: ws.WritableStreamWriter | undefined;
	[ws.writeRequests_]: any[];

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
		const writeAlgorithm = ws.createAlgorithmFromUnderlyingMethod(sink, "write", [])
	}

	get locked() {
		return false;
	}

	abort(reason?: any) {
		return Promise.resolve(reason);
	}

	getWriter() {

	}
}
