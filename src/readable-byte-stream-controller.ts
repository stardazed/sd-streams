import * as rs from "./readable-internals";
import * as q from "./queue-mixin";

export class ReadableByteStreamController implements rs.ReadableByteStreamController {
	[rs.autoAllocateChunkSize_]: number | undefined;
	[rs.byobRequest_]: rs.ReadableStreamBYOBRequest | undefined;
	[rs.cancelAlgorithm_]: rs.CancelAlgorithm;
	[rs.closeRequested_]: boolean;
	[rs.controlledReadableByteStream_]: rs.ReadableStream;
	[rs.pullAgain_]: boolean;
	[rs.pullAlgorithm_]: rs.PullAlgorithm;
	[rs.pulling_]: boolean;
	[rs.pendingPullIntos_]: rs.PullIntoRequest[];
	[rs.started_]: boolean;
	[rs.strategyHWM_]: number;

	[q.queue_]: q.QueueElement<any>[]; // A List representing the stream’s internal queue of chunks
	[q.queueTotalSize_]: number; // The total size (in bytes) of all the chunks stored in [[queue]]

	constructor(stream: rs.ReadableStream, startFunction: rs.StartFunction | undefined, pullFunction: rs.PullFunction | undefined, cancelAlgorithm: rs.CancelAlgorithm, highWaterMark: number, autoAllocateChunkSize: number | undefined) {
		if (stream[rs.readableStreamController_] !== undefined) {
			throw new TypeError();
		}
		if (autoAllocateChunkSize !== undefined) {
			autoAllocateChunkSize = Number(autoAllocateChunkSize);
			if (! rs.isInteger(autoAllocateChunkSize) || autoAllocateChunkSize <= 0) {
				throw new RangeError("autoAllocateChunkSize, if provided, must be a positive, finite integer");
			}
		}

		this[rs.controlledReadableByteStream_] = stream;
		this[rs.pullAgain_] = false;
		this[rs.pulling_] = false;

		rs.readableByteStreamControllerClearPendingPullIntos(this);
		q.resetQueue(this);

		this[rs.closeRequested_] = false;
		this[rs.started_] = false;
		this[rs.strategyHWM_] = rs.validateAndNormalizeHighWaterMark(highWaterMark);
		this[rs.pullAlgorithm_] = rs.createAlgorithmFromFunction(pullFunction, [this]);
		this[rs.cancelAlgorithm_] = cancelAlgorithm;
		this[rs.autoAllocateChunkSize_] = autoAllocateChunkSize;
		this[rs.pendingPullIntos_] = [];

		stream[rs.readableStreamController_] = this;

		const startResult = startFunction === undefined ? undefined : startFunction(this);
		Promise.resolve(startResult).then(
			_ => {
				this[rs.started_] = true;
				// Assert: controller.[[pulling]] is false.
				// Assert: controller.[[pullAgain]] is false.
				rs.readableByteStreamControllerCallPullIfNeeded(this);
			},
			error => {
				rs.readableByteStreamControllerError(this, error);
			}
		);
	}

	get desiredSize(): number | null {
		return 0;
	}

	close() {
	}

	enqueue(_chunk?: any) {
	}

	error(_e?: any) {
	}

	[rs.cancelSteps_](_reason: any) {
		return Promise.resolve();
	}

	[rs.pullSteps_]() {
		return Promise.resolve({ value: 0, done: true });
	}
}
