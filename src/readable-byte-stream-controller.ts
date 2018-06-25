import * as rs from "./readable-internals";
import * as q from "./queue-mixin";

export class ReadableByteStreamController {
	[rs.autoAllocateChunkSize_]: number | undefined; // A positive integer, when the automatic buffer allocation feature is enabled. In that case, this value specifies the size of buffer to allocate. It is undefined otherwise.
	[rs.byobRequest_]: object; // A ReadableStreamBYOBRequest instance representing the current BYOB pull request
	[rs.cancelAlgorithm_]: rs.CancelAlgorithm; // A promise-returning algorithm, taking one argument (the cancel reason), which communicates a requested cancelation to the underlying source
	[rs.closeRequested_]: boolean; // A boolean flag indicating whether the stream has been closed by its underlying byte source, but still has chunks in its internal queue that have not yet been read
	[rs.controlledReadableByteStream_]: rs.ReadableStream; // The ReadableStream instance controlled
	[rs.pullAgain_]: boolean; // A boolean flag set to true if the stream’s mechanisms requested a call to the underlying byte source’s pull() method to pull more data, but the pull could not yet be done since a previous call is still executing
	[rs.pullAlgorithm_]: rs.PullAlgorithm; // A promise-returning algorithm that pulls data from the underlying source
	[rs.pulling_]: boolean; // A boolean flag set to true while the underlying byte source’s pull() method is executing and has not yet fulfilled, used to prevent reentrant calls
	[rs.pendingPullIntos_]: any[]; // A List of descriptors representing pending BYOB pull requests
	[rs.started_]: boolean; // A boolean flag indicating whether the underlying source has finished starting
	[rs.strategyHWM_]: number; // A number supplied to the constructor as part of the stream’s queuing strategy, indicating the point at which the stream will apply backpressure to its underlying byte source

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
