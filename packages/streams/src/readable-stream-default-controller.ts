/**
 * streams/readable-stream-default-controller - ReadableStreamDefaultController class implementation
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

import * as rs from "./readable-internals";
import * as shared from "./shared-internals";
import * as q from "./queue-mixin";
import { Queue } from "./queue";

export class ReadableStreamDefaultController<OutputType> implements rs.ReadableStreamDefaultController<OutputType> {
	[rs.cancelAlgorithm_]: rs.CancelAlgorithm;
	[rs.closeRequested_]: boolean;
	[rs.controlledReadableStream_]: rs.ReadableStream<OutputType>;
	[rs.pullAgain_]: boolean;
	[rs.pullAlgorithm_]: rs.PullAlgorithm<OutputType>;
	[rs.pulling_]: boolean;
	[rs.strategyHWM_]: number;
	[rs.strategySizeAlgorithm_]: shared.SizeAlgorithm;
	[rs.started_]: boolean;

	[q.queue_]: Queue<q.QueueElement<any>>;
	[q.queueTotalSize_]: number;

	constructor() {
		throw new TypeError();
	}

	get desiredSize(): number | null {
		return rs.readableStreamDefaultControllerGetDesiredSize(this);
	}

	close() {
		if (! rs.isReadableStreamDefaultController(this)) {
			throw new TypeError();
		}
		if (! rs.readableStreamDefaultControllerCanCloseOrEnqueue(this)) {
			throw new TypeError("Cannot close, the stream is already closing or not readable");
		}
		rs.readableStreamDefaultControllerClose(this);
	}

	enqueue(chunk?: any) {
		if (! rs.isReadableStreamDefaultController(this)) {
			throw new TypeError();
		}
		if (!rs.readableStreamDefaultControllerCanCloseOrEnqueue(this)) {
			throw new TypeError("Cannot enqueue, the stream is closing or not readable");
		}
		rs.readableStreamDefaultControllerEnqueue(this, chunk);
	}

	error(e?: any) {
		if (! rs.isReadableStreamDefaultController(this)) {
			throw new TypeError();
		}
		rs.readableStreamDefaultControllerError(this, e);
	}

	[rs.cancelSteps_](reason: any) {
		q.resetQueue(this);
		const result = this[rs.cancelAlgorithm_](reason);
		rs.readableStreamDefaultControllerClearAlgorithms(this);
		return result;
	}

	[rs.pullSteps_](forAuthorCode: boolean) {
		const stream = this[rs.controlledReadableStream_];
		if (this[q.queue_].length > 0) {
			const chunk = q.dequeueValue(this);
			if (this[rs.closeRequested_] && this[q.queue_].length === 0) {
				rs.readableStreamDefaultControllerClearAlgorithms(this);
				rs.readableStreamClose(stream);
			}
			else {
				rs.readableStreamDefaultControllerCallPullIfNeeded(this);
			}
			return Promise.resolve(rs.readableStreamCreateReadResult(chunk, false, forAuthorCode));
		}

		const pendingPromise = rs.readableStreamAddReadRequest(stream, forAuthorCode);
		rs.readableStreamDefaultControllerCallPullIfNeeded(this);
		return pendingPromise;
	}
}


export function setUpReadableStreamDefaultControllerFromUnderlyingSource<OutputType>(stream: rs.ReadableStream<OutputType>, underlyingSource: rs.ReadableStreamSource<OutputType>, highWaterMark: number, sizeAlgorithm: shared.SizeAlgorithm) {
	// Assert: underlyingSource is not undefined.
	const controller = Object.create(ReadableStreamDefaultController.prototype);
	const startAlgorithm = () => {
		return shared.invokeOrNoop(underlyingSource, "start", [controller]);
	};
	const pullAlgorithm = shared.createAlgorithmFromUnderlyingMethod(underlyingSource, "pull", [controller]);
	const cancelAlgorithm = shared.createAlgorithmFromUnderlyingMethod(underlyingSource, "cancel", []);
	rs.setUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
}
