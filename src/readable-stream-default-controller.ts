import * as rs from "./readable-internals";

export class ReadableStreamDefaultController implements rs.ReadableStreamDefaultController {
	[rs.controlledReadableStream_]: rs.ReadableStream;
	[rs.pullAlgorithm_]: rs.PullAlgorithm;
	[rs.cancelAlgorithm_]: rs.CancelAlgorithm;
	[rs.strategySizeAlgorithm_]: rs.SizeAlgorithm;
	[rs.strategyHWM_]: number;

	[rs.queue_]!: any[];
	[rs.queueTotalSize_]!: number;

	[rs.started_]: boolean;
	[rs.closeRequested_]: boolean;
	[rs.pullAgain_]: boolean;
	[rs.pulling_]: boolean;

	[rs.state_]: rs.ReadableStreamControllerState;

	constructor(stream: rs.ReadableStream, source: rs.ReadableStreamSource, highWaterMark: number, sizeAlgorithm: rs.SizeAlgorithm) {
		this[rs.controlledReadableStream_] = stream;
		rs.resetQueue(this);

		this[rs.started_] = false;
		this[rs.closeRequested_] = false;
		this[rs.pullAgain_] = false;
		this[rs.pulling_] = false;

		this[rs.strategySizeAlgorithm_] = sizeAlgorithm;
		this[rs.strategyHWM_] = highWaterMark;

		this[rs.pullAlgorithm_] = rs.createAlgorithmFromUnderlyingMethod(source, "pull", [this]);
		this[rs.cancelAlgorithm_] = rs.createAlgorithmFromUnderlyingMethod(source, "cancel", []);

		stream[rs.readableStreamController_] = this;

		const startResult = source.start ? source.start(this) : undefined;
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

	[rs.cancelSteps_](reason: string) {
		rs.resetQueue(this);
		return this[rs.cancelAlgorithm_](reason);
	}

	[rs.pullSteps_]() {
		// Let stream be this.[[controlledReadableStream]].
		const stream = this[rs.controlledReadableStream_];
		if (this[rs.queue_].length > 0) {
			//   Let chunk be! DequeueValue(this).
			const chunk = rs.dequeueValue(this);
			//   If this.[[closeRequested]] is true and this.[[queue]] is empty, perform! ReadableStreamClose(stream).
			if (this[rs.closeRequested_] && this[rs.queue_].length === 0) {
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
