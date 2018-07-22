/**
 * streams/writable-stream-default-controller - WritableStreamDefaultController class implementation
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

import * as ws from "./writable-internals";
import * as shared from "./shared-internals";
import * as q from "./queue-mixin";
import { Queue } from "./queue";

export class WritableStreamDefaultController implements ws.WritableStreamDefaultController {
	[ws.abortAlgorithm_]: ws.AbortAlgorithm;
	[ws.closeAlgorithm_]: ws.CloseAlgorithm;
	[ws.controlledWritableStream_]: ws.WritableStream;
	[ws.started_]: boolean;
	[ws.strategyHWM_]: number;
	[ws.strategySizeAlgorithm_]: shared.SizeAlgorithm;
	[ws.writeAlgorithm_]: ws.WriteAlgorithm;

	[q.queue_]: Queue<q.QueueElement<ws.WriteRecord | "close">>;
	[q.queueTotalSize_]: number;

	constructor() {
		throw new TypeError();
	}

	error(e?: any) {
		if (! ws.isWritableStreamDefaultController(this)) {
			throw new TypeError();
		}
		const state = this[ws.controlledWritableStream_][shared.state_];
		if (state !== "writable") {
			return;
		}
		ws.writableStreamDefaultControllerError(this, e);
	}

	[ws.abortSteps_](reason: any) {
		const result = this[ws.abortAlgorithm_](reason);
		ws.writableStreamDefaultControllerClearAlgorithms(this);
		return result;
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
