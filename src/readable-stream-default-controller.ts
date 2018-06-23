import * as rs from "./readable-internals";
import * as q from "./queue-mixin";

export class ReadableStreamDefaultController implements rs.ReadableStreamDefaultController {
	[rs.controlledReadableStream_]: rs.ReadableStream;
	[rs.pullAlgorithm_]: rs.PullAlgorithm;
	[rs.cancelAlgorithm_]: rs.CancelAlgorithm;
	[rs.strategySizeAlgorithm_]: rs.SizeAlgorithm;
	[rs.strategyHWM_]: number;

	[q.queue_]: q.QueueElement<any>[];
	[q.queueTotalSize_]: number;

	[rs.started_]: boolean;
	[rs.closeRequested_]: boolean;
	[rs.pullAgain_]: boolean;
	[rs.pulling_]: boolean;

	[rs.state_]: rs.ReadableStreamControllerState;

	constructor(stream: rs.ReadableStream, startFunction: rs.StartFunction | undefined, pullFunction: rs.PullFunction | undefined, cancelAlgorithm: rs.CancelAlgorithm, highWaterMark: number, sizeAlgorithm: rs.SizeAlgorithm) {
		this[rs.controlledReadableStream_] = stream;
		q.resetQueue(this);

		this[rs.started_] = false;
		this[rs.closeRequested_] = false;
		this[rs.pullAgain_] = false;
		this[rs.pulling_] = false;

		this[rs.strategySizeAlgorithm_] = sizeAlgorithm;
		this[rs.strategyHWM_] = highWaterMark;

		this[rs.pullAlgorithm_] = rs.createAlgorithmFromFunction(pullFunction, [this]);
		this[rs.cancelAlgorithm_] = cancelAlgorithm;

		stream[rs.readableStreamController_] = this;

		const startResult = startFunction === undefined ? undefined : startFunction(this);
		Promise.resolve(startResult).then(
			_ => {
				this[rs.started_] = true;
				rs.readableStreamDefaultControllerCallPullIfNeeded(this);
			},
			error => {
				rs.readableStreamDefaultControllerError(this, error);
			}
		);
	}

	get desiredSize(): number | null {
		return rs.readableStreamDefaultControllerGetDesiredSize(this);
	}

	close() {
		if (! rs.readableStreamDefaultControllerCanCloseOrEnqueue(this)) {
			throw new TypeError("Cannot close, the stream is already closing or not readable");
		}
		rs.readableStreamDefaultControllerClose(this);
	}

	enqueue(chunk?: any) {
		if (!rs.readableStreamDefaultControllerCanCloseOrEnqueue(this)) {
			throw new TypeError("Cannot enqueue, the stream is closing or not readable");
		}
		rs.readableStreamDefaultControllerEnqueue(this, chunk);
	}

	error(e?: any) {
		rs.readableStreamDefaultControllerError(this, e);
	}

	[rs.cancelSteps_](reason: any) {
		q.resetQueue(this);
		return this[rs.cancelAlgorithm_](reason);
	}

	[rs.pullSteps_]() {
		// Let stream be this.[[controlledReadableStream]].
		const stream = this[rs.controlledReadableStream_];
		if (this[q.queue_].length > 0) {
			//   Let chunk be! DequeueValue(this).
			const chunk = q.dequeueValue(this);
			//   If this.[[closeRequested]] is true and this.[[queue]] is empty, perform! ReadableStreamClose(stream).
			if (this[rs.closeRequested_] && this[q.queue_].length === 0) {
				rs.readableStreamClose(stream);
			}
			else {
				rs.readableStreamDefaultControllerCallPullIfNeeded(this);
			}
			return Promise.resolve(rs.createIterResultObject(chunk, false));
		}

		const pendingPromise = rs.readableStreamAddReadRequest(stream);
		rs.readableStreamDefaultControllerCallPullIfNeeded(this);
		return pendingPromise;
	}
}
