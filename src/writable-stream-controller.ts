import * as ws from "./writable-internals";
import * as shared from "./shared-internals";
import * as q from "./queue-mixin";

export class WritableStreamDefaultController implements ws.WritableStreamDefaultController {
	[ws.abortAlgorithm_]: ws.AbortAlgorithm;
	[ws.closeAlgorithm_]: ws.CloseAlgorithm;
	[ws.controlledWritableStream_]: ws.WritableStream;
	[ws.started_]: boolean;
	[ws.strategyHWM_]: number;
	[ws.strategySizeAlgorithm_]: shared.SizeAlgorithm;
	[ws.writeAlgorithm_]: ws.WriteAlgorithm;

	[q.queue_]: q.QueueElement<ws.WriteRecord | "close">[];
	[q.queueTotalSize_]: number;

	constructor(stream: ws.WritableStream, startFunction: ws.StartFunction | undefined, writeFunction: ws.WriteFunction | undefined, closeAlgorithm: ws.CloseAlgorithm, abortAlgorithm: ws.AbortAlgorithm, highWaterMark: number, sizeAlgorithm: shared.SizeAlgorithm) {
		if (! ws.isWritableStream(stream)) {
			throw new TypeError();
		}
		if (stream[ws.writableStreamController_] !== undefined) {
			throw new TypeError("Cannot reuse a stream");
		}

		this[ws.controlledWritableStream_] = stream;
		stream[ws.writableStreamController_] = this;
		q.resetQueue(this);
		this[ws.started_] = false;
		this[ws.strategySizeAlgorithm_] = sizeAlgorithm;
		this[ws.strategyHWM_] = highWaterMark;
		this[ws.writeAlgorithm_] = shared.createAlgorithmFromFunction(writeFunction, [this]);
		this[ws.closeAlgorithm_] = closeAlgorithm;
		this[ws.abortAlgorithm_] = abortAlgorithm;

		const backpressure = ws.writableStreamDefaultControllerGetBackpressure(this);
		ws.writableStreamUpdateBackpressure(stream, backpressure);

		const startResult = startFunction === undefined ? undefined : startFunction(this);
		Promise.resolve(startResult).then(
			_ => {
				// Assert: stream.[[state]] is "writable" or "erroring".
				this[ws.started_] = true;
				ws.writableStreamDefaultControllerAdvanceQueueIfNeeded(this);
			},
			error => {
				// Assert: stream.[[state]] is "writable" or "erroring".
				this[ws.started_] = true;
				ws.writableStreamDealWithRejection(stream, error);
			}
		);
	}

	error(e?: any) {
		if (! ws.isWritableStreamDefaultController(this)) {
			throw new TypeError();
		}
		const state = this[ws.controlledWritableStream_][ws.state_];
		if (state !== "writable") {
			return;
		}
		ws.writableStreamDefaultControllerError(this, e);
	}

	[ws.abortSteps_](reason: any) {
		return this[ws.abortAlgorithm_](reason);
	}

	[ws.errorSteps_]() {
		q.resetQueue(this);
	}
}
