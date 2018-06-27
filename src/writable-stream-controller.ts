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

	constructor() {
		throw new TypeError();
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

export function setUpWritableStreamDefaultControllerFromUnderlyingSink(stream: ws.WritableStream, underlyingSink: ws.WritableStreamSink, highWaterMark: number, sizeAlgorithm: shared.SizeAlgorithm) {
	// Assert: underlyingSink is not undefined.
	const controller = Object.create(WritableStreamDefaultController.prototype) as WritableStreamDefaultController;

	const startAlgorithm = function() {
		return shared.invokeOrNoop(underlyingSink, "start", [controller]);
	};
	const writeAlgorithm = shared.createAlgorithmFromUnderlyingMethod(underlyingSink, "write", [controller]);
	const closeAlgorithm = shared.createAlgorithmFromUnderlyingMethod(underlyingSink, "close", []);
	const abortAlgorithm = shared.createAlgorithmFromUnderlyingMethod(underlyingSink, "abort", []);
	ws.setUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
}
