import * as rs from "./readable-internals";
import * as q from "./queue-mixin";
import { ReadableStreamBYOBRequest } from "./readable-stream-byob-request";

export class ReadableByteStreamController implements rs.ReadableByteStreamController {
	[rs.autoAllocateChunkSize_]: number | undefined;
	[rs.byobRequest_]: rs.ReadableStreamBYOBRequest | undefined;
	[rs.cancelAlgorithm_]: rs.CancelAlgorithm;
	[rs.closeRequested_]: boolean;
	[rs.controlledReadableByteStream_]: rs.ReadableStream;
	[rs.pullAgain_]: boolean;
	[rs.pullAlgorithm_]: rs.PullAlgorithm;
	[rs.pulling_]: boolean;
	[rs.pendingPullIntos_]: rs.PullIntoDescriptor[];
	[rs.started_]: boolean;
	[rs.strategyHWM_]: number;

	[q.queue_]: { buffer: ArrayBufferLike, byteOffset: number, byteLength: number }[];
	[q.queueTotalSize_]: number;

	constructor(stream: rs.ReadableStream, startFunction: rs.StartFunction | undefined, pullFunction: rs.PullFunction | undefined, cancelAlgorithm: rs.CancelAlgorithm, highWaterMark: number, autoAllocateChunkSize: number | undefined) {
		if (! rs.isReadableStream(stream)) {
			throw new TypeError();
		}
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

	get byobRequest(): rs.ReadableStreamBYOBRequest | undefined {
		if (! rs.isReadableByteStreamController(this)) {
			throw new TypeError();
		}
		if (this[rs.byobRequest_] === undefined && this[rs.pendingPullIntos_].length > 0) {
			const firstDescriptor = this[rs.pendingPullIntos_][0];
			const view = new Uint8Array(firstDescriptor.buffer, firstDescriptor.byteOffset + firstDescriptor.bytesFilled, firstDescriptor.byteLength - firstDescriptor.bytesFilled);
			const byobRequest = new ReadableStreamBYOBRequest(this, view);
			this[rs.byobRequest_] = byobRequest;
		}
		return this[rs.byobRequest_];
	}

	get desiredSize(): number | null {
		if (! rs.isReadableByteStreamController(this)) {
			throw new TypeError();
		}
		return rs.readableByteStreamControllerGetDesiredSize(this);
	}

	close() {
		if (! rs.isReadableByteStreamController(this)) {
			throw new TypeError();
		}
		if (this[rs.closeRequested_]) {
			throw new TypeError("Stream is already closing");
		}
		if (this[rs.controlledReadableByteStream_][rs.state_] !== "readable") {
			throw new TypeError("Stream is closed or errored");
		}
		rs.readableByteStreamControllerClose(this);
	}

	enqueue(chunk: ArrayBufferView) {
		if (! rs.isReadableByteStreamController(this)) {
			throw new TypeError();
		}
		if (this[rs.closeRequested_]) {
			throw new TypeError("Stream is already closing");
		}
		if (this[rs.controlledReadableByteStream_][rs.state_] !== "readable") {
			throw new TypeError("Stream is closed or errored");
		}
		if (! ArrayBuffer.isView(chunk)) {
			throw new TypeError("chunk must be a valid ArrayBufferView");
		}
		// If ! IsDetachedBuffer(chunk.[[ViewedArrayBuffer]]) is true, throw a TypeError exception.
		return rs.readableByteStreamControllerEnqueue(this, chunk);
	}

	error(error?: any) {
		if (! rs.isReadableByteStreamController(this)) {
			throw new TypeError();
		}
		rs.readableByteStreamControllerError(this, error);
	}

	[rs.cancelSteps_](reason: any) {
		if (this[rs.pendingPullIntos_].length > 0) {
			const firstDescriptor = this[rs.pendingPullIntos_][0];
			firstDescriptor.bytesFilled = 0;
		}
		q.resetQueue(this);
		return this[rs.cancelAlgorithm_](reason);
	}

	[rs.pullSteps_]() {
		const stream = this[rs.controlledReadableByteStream_];
		// Assert: ! ReadableStreamHasDefaultReader(stream) is true.
		if (this[q.queueTotalSize_] > 0) {
			// Assert: ! ReadableStreamGetNumReadRequests(stream) is 0.
			const entry = this[q.queue_].shift()!;
			this[q.queueTotalSize_] -= entry.byteLength;
			rs.readableByteStreamControllerHandleQueueDrain(this);
			const view = new Uint8Array(entry.buffer, entry.byteOffset, entry.byteLength);
			return Promise.resolve(rs.createIterResultObject(view, false));
		}
		const autoAllocateChunkSize = this[rs.autoAllocateChunkSize_];
		if (autoAllocateChunkSize !== undefined) {
			let buffer: ArrayBuffer;
			try {
				buffer = new ArrayBuffer(autoAllocateChunkSize);
			}
			catch (error) {
				return Promise.reject(error);
			}
			const pullIntoDescriptor: rs.PullIntoDescriptor = {
				buffer,
				byteOffset: 0,
				byteLength: autoAllocateChunkSize,
				bytesFilled: 0,
				elementSize: 1,
				ctor: Uint8Array,
				readerType: "default"
			};
			this[rs.pendingPullIntos_].push(pullIntoDescriptor);
		}

		const promise = rs.readableStreamAddReadRequest(stream);
		rs.readableByteStreamControllerCallPullIfNeeded(this);
		return promise;
	}
}
