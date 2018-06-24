import { StreamStrategy, state_, SizeAlgorithm, ControlledPromise, closedPromise_ } from "./shared-internals";
import * as q from "./queue-mixin";
export * from "./shared-internals";

export const backpressure_ = Symbol("backpressure_");
export const closeRequest_ = Symbol("closeRequest_");
export const inFlightWriteRequest_ = Symbol("inFlightWriteRequest_");
export const inFlightCloseRequest_ = Symbol("inFlightCloseRequest_");
export const pendingAbortRequest_ = Symbol("pendingAbortRequest_");
export const storedError_ = Symbol("storedError_");
export const writableStreamController_ = Symbol("writableStreamController_");
export const writer_ = Symbol("writer_");
export const writeRequests_ = Symbol("writeRequests_");

export const abortAlgorithm_ = Symbol("abortAlgorithm_");
export const closeAlgorithm_ = Symbol("closeAlgorithm_");
export const controlledWritableStream_ = Symbol("controlledWritableStream_");
export const started_ = Symbol("started_");
export const strategyHWM_ = Symbol("strategyHWM_");
export const strategySizeAlgorithm_ = Symbol("strategySizeAlgorithm_");
export const writeAlgorithm_ = Symbol("writeAlgorithm_");

export const ownerWritableStream_ = Symbol("ownerWritableStream_");

export const errorSteps_ = Symbol("errorSteps_");
export const abortSteps_ = Symbol("abortSteps_");


export type WriteFunction = (chunk: any, controller: WritableStreamController) => void | Promise<void>;
export type WriteAlgorithm = (chunk: any, controller: WritableStreamController) => Promise<void>;
export type CloseAlgorithm = () => Promise<void>;
export type AbortAlgorithm = (reason?: any) => Promise<void>;

// ----

export interface WritableStreamController {
	error(e?: any): void;

	[errorSteps_](): void;
	[abortSteps_](reason: any): Promise<void>;
}

export interface WritableStreamDefaultController extends WritableStreamController, q.QueueContainer<any> {
	[abortAlgorithm_]: AbortAlgorithm; // A promise - returning algorithm, taking one argument(the abort reason), which communicates a requested abort to the underlying sink
	[closeAlgorithm_]: CloseAlgorithm; // A promise - returning algorithm which communicates a requested close to the underlying sink
	[controlledWritableStream_]: WritableStream; // The WritableStream instance controlled
	[started_]: boolean; // A boolean flag indicating whether the underlying sink has finished starting
	[strategyHWM_]: number; // A number supplied by the creator of the stream as part of the stream’s queuing strategy, indicating the point at which the stream will apply backpressure to its underlying sink
	[strategySizeAlgorithm_]: SizeAlgorithm; // An algorithm to calculate the size of enqueued chunks, as part of the stream’s queuing strategy
	[writeAlgorithm_]: WriteAlgorithm; // A promise-returning algorithm, taking one argument (the chunk to write), which writes data to the underlying sink
}

// ----

export interface WritableStreamWriter {
	readonly closed: Promise<void>;
	readonly desiredSize: number;
	readonly ready: Promise<void>;

	abort(reason: any): Promise<void>;
	close(): Promise<void>;
	releaseLock(): void;
	write(chunk: any): Promise<void>;

	[ownerWritableStream_]: WritableStream | undefined;
	[closedPromise_]: ControlledPromise<void>;
}

// ----

export type StartFunction = (controller: WritableStreamController) => void | Promise<void>;

export type WritableStreamState = "writable" | "closed" | "erroring" | "errored";

export interface WritableStreamSink {
	start?: StartFunction;
	write?(chunk: any, controller: WritableStreamController): void | Promise<void>;
	close?(): void | Promise<void>;
	abort?(reason?: any): void;

	type?: undefined; // unused, for future revisions
}

export interface AbortRequest {
	reason: any;
	wasAlreadyErroring: boolean;
	promise: Promise<void>;
	resolve(): void;
	reject(error: any): void;
}

export declare class WritableStream {
	constructor(underlyingSink?: WritableStreamSink, strategy?: StreamStrategy);

	readonly locked: boolean;
	abort(reason?: any): Promise<void>;
	getWriter(): WritableStreamWriter;

	[state_]: WritableStreamState;
	[backpressure_]: boolean;
	[closeRequest_]: object | undefined;
	[inFlightWriteRequest_]: object | undefined;
	[inFlightCloseRequest_]: object | undefined;
	[pendingAbortRequest_]: AbortRequest | undefined;
	[storedError_]: any;
	[writableStreamController_]: WritableStreamDefaultController | undefined;
	[writer_]: WritableStreamWriter | undefined;
	[writeRequests_]: ControlledPromise<any>[];
}

// ---- Stream

export function isWritableStreamLocked(stream: WritableStream) {
	return stream[writer_] !== undefined;
}

export function writableStreamHasOperationMarkedInFlight(stream: WritableStream) {
	return stream[inFlightWriteRequest_] !== undefined || stream[inFlightCloseRequest_] !== undefined;
}

export function writableStreamAbort(stream: WritableStream, reason: any) {
	const state = stream[state_];
	if (state === "closed" || state === "errored") {
		return Promise.resolve(undefined);
	}
	let pending = stream[pendingAbortRequest_];
	if (pending !== undefined) {
		return pending.promise;
	}
	// Assert: state is "writable" or "erroring".
	let wasAlreadyErroring = false;
	if (state === "erroring") {
		wasAlreadyErroring = true;
		reason = undefined;
	}

	pending = {
		reason,
		wasAlreadyErroring
	} as AbortRequest;
	const promise = new Promise<void>((resolve, reject) => {
		pending!.resolve = resolve;
		pending!.reject = reject;
	});
	stream[pendingAbortRequest_] = pending;
	if (! wasAlreadyErroring) {
		writableStreamStartErroring(stream, reason);
	}
	return promise;
}

export function writableStreamStartErroring(stream: WritableStream, reason: any) {
	// Assert: stream.[[storedError]] is undefined.
	// Assert: stream.[[state]] is "writable".
	const controller = stream[writableStreamController_]!;
	// Assert: controller is not undefined.
	stream[state_] = "erroring";
	stream[storedError_] = reason;
	const writer = stream[writer_];
	if (writer !== undefined) {
		// writableStreamDefaultWriterEnsureReadyPromiseRejected(writer, reason);
	}
	if (! writableStreamHasOperationMarkedInFlight(stream) && controller[started_]) {
		writableStreamFinishErroring(stream);
	}
}

export function writableStreamRejectCloseAndClosedPromiseIfNeeded(stream: WritableStream) {
	// Assert: stream.[[state]] is "errored".
	// If stream.[[closeRequest]] is not undefined,
		// Assert: stream.[[inFlightCloseRequest]] is undefined.
		// Reject stream.[[closeRequest]] with stream.[[storedError]].
		// Set stream.[[closeRequest]] to undefined.
	// Let writer be stream.[[writer]].
	// If writer is not undefined,
		// Reject writer.[[closedPromise]] with stream.[[storedError]].
		// Set writer.[[closedPromise]].[[PromiseIsHandled]] to true.
}

export function writableStreamFinishErroring(stream: WritableStream) {
	// Assert: stream.[[state]] is "erroring".
	// Assert: writableStreamHasOperationMarkedInFlight(stream) is false.
	stream[state_] = "errored";
	const controller = stream[writableStreamController_]!;
	controller[errorSteps_]();
	const storedError = stream[storedError_];
	for (const writeRequest of stream[writeRequests_]) {
		writeRequest.reject(storedError);
	}
	stream[writeRequests_] = [];

	const abortRequest = stream[pendingAbortRequest_];
	if (abortRequest === undefined) {
		writableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
		return;
	}
	stream[pendingAbortRequest_] = undefined;	
	if (abortRequest.wasAlreadyErroring) {
		abortRequest.reject(storedError);
		writableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
		return;
	}
	const promise = controller[abortSteps_](abortRequest.reason);
	promise.then(
		_ => {
			abortRequest.resolve();
			writableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
		},
		error => {
			abortRequest.reject(error);
			writableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
		}
	);
}

export function writableStreamDealWithRejection(stream: WritableStream, error: any) {
	const state = stream[state_];
	if (state === "writable") {
		writableStreamStartErroring(stream, error);
		return;
	}
	// Assert: state is "erroring"
	writableStreamFinishErroring(stream);
}

export function writableStreamUpdateBackpressure(stream: WritableStream, backpressure: boolean) {
	// Assert: stream.[[state]] is "writable".
	// Assert: !WritableStreamCloseQueuedOrInFlight(stream) is false.
	const writer = stream[writer_];
	if (writer !== undefined && backpressure !== stream[backpressure_]) {
		if (backpressure) {
			// Set writer.[[readyPromise]] to a new promise.
		}
		else {
			// Assert: backpressure is false.
			// Resolve writer.[[readyPromise]] with undefined.
		}
	}
	stream[backpressure_] = backpressure;
}

// ---- Writers

// ---- Controller

export function writableStreamDefaultControllerGetDesiredSize(wsdc: WritableStreamDefaultController) {
	return wsdc[strategyHWM_] - wsdc[q.queueTotalSize_];
}

export function writableStreamDefaultControllerGetBackpressure(wsdc: WritableStreamDefaultController) {
	const desiredSize = writableStreamDefaultControllerGetDesiredSize(wsdc);
	return desiredSize <= 0;
}

export function writableStreamDefaultControllerError(wsdc: WritableStreamDefaultController, error: any) {
	const stream = wsdc[controlledWritableStream_];
	// Assert: stream.[[state]] is "writable".
	writableStreamStartErroring(stream, error);
}
