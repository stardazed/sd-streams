export const state_ = Symbol("state_");

export const controlledReadableStream_ = Symbol("controlledReadableStream_");
export const pullAlgorithm_ = Symbol("pullAlgorithm_");
export const cancelAlgorithm_ = Symbol("cancelAlgorithm_");
export const strategySizeAlgorithm_ = Symbol("strategySizeAlgorithm_");
export const strategyHWM_ = Symbol("strategyHWM_")
export const queue_ = Symbol("queue_");
export const queueTotalSize_ = Symbol("queueTotalSize_");
export const started_ = Symbol("started_");
export const closeRequested_ = Symbol("closeRequested_");
export const pullAgain_ = Symbol("pullAgain_");
export const pulling_ = Symbol("pulling_");

export const readRequests_ = Symbol("readRequests_");

export const reader_ = Symbol("reader_");
export const storedError_ = Symbol("storedError_");

export type SizeAlgorithm = (this: void, chunk?: any) => number;
export type PullAlgorithm = (controller: ReadableStreamController) => Promise<void>;
export type CancelAlgorithm = (reason?: any) => Promise<void>;

export interface ReadableStreamController {
	readonly desiredSize: number;
	close(): void;
	enqueue(chunk?: any): void;
	error(e?: any): void;
}

interface QueueContainer {
	[queue_]: any[];
	[queueTotalSize_]: number;
}

export type ReadableStreamControllerState = "reading" | undefined;

export interface ReadableStreamDefaultController extends ReadableStreamController, QueueContainer {
	[controlledReadableStream_]: ReadableStream;
	[pullAlgorithm_]: PullAlgorithm;
	[cancelAlgorithm_]: CancelAlgorithm;
	[strategySizeAlgorithm_]: SizeAlgorithm;
	[strategyHWM_]: number;

	[started_]: boolean;
	[closeRequested_]: boolean;
	[pullAgain_]: boolean;
	[pulling_]: boolean;

	[state_]: ReadableStreamControllerState;
}

export interface ReadableStreamStrategy {
	size?: SizeAlgorithm; // change type to unknown in TS3
	highWaterMark?: number;
}

export interface ReadableStreamSource {
	type?: "bytes" | undefined;
	start?(controller: ReadableStreamController): void;
	pull?(controller: ReadableStreamController): void;
	cancel?(reason?: string): void;
}

export interface ReadableStreamReader {
	[readRequests_]: any[];
	read(): Promise<void>;
}

export type ReadableStreamState = "readable" | "closed" | "errored";

export interface ReadableStream {
	readonly locked: boolean;
	cancel(reason?: string): void;
	getReader(): ReadableStreamReader;

	// pipeThrough({ writable, readable }, options);
	// pipeTo(dest, { preventClose, preventAbort, preventCancel } = {});
	// tee(): { }

	[state_]: ReadableStreamState;
	[reader_]: ReadableStreamReader | undefined;
	[storedError_]: any;
}

// ----------------------

export function promiseCall<F extends Function>(f: F, v: object, args: any[]) { // tslint:disable-line:ban-types
	try {
		const result = f.apply(v, args);
		return Promise.resolve(result);
	}
	catch (err) {
		return Promise.reject(err);
	}
}

export function createAlgorithmFromUnderlyingMethod<O extends object, K extends keyof O>(obj: O, methodName: K, extraArgs: any[]) {
	const method = obj[methodName];
	if (method === undefined) {
		return () => Promise.resolve(undefined);
	}
	if (typeof method !== "function") {
		throw new TypeError(`Field "${methodName}" is not a function.`);
	}
	return function(...fnArgs: any[]) {
		return promiseCall(method, obj, fnArgs.concat(extraArgs));
	};
}

export function validateAndNormalizeHighWaterMark(value: any) {
	const highWaterMark = parseInt(value, 10);
	if (isNaN(highWaterMark) || highWaterMark < 0) {
		throw new RangeError("highWaterMark must be a valid, positive integer.");
	}
	return highWaterMark;
}

export function makeSizeAlgorithmFromSizeFunction(sizeFn: undefined | ((chunk: any) => number)): SizeAlgorithm {
	return function(chunk: any) {
		if (typeof sizeFn === "function") {
			return sizeFn(chunk);
		}
		return 1;
	};
}

export function resetQueue(container: QueueContainer) {
	container[queue_] = [];
	container[queueTotalSize_] = 0;
}

// ----

export function isReadableStreamLocked(stream: ReadableStream) {
	return stream[reader_] !== undefined;
}

export function readableStreamGetNumReadRequests(stream: ReadableStream) {
	const reader = stream[reader_];
	if (reader === undefined) {
		return 0;
	}
	return reader[readRequests_].length;
}

// ----

export function readableStreamDefaultControllerCanCloseOrEnqueue(rsdc: ReadableStreamDefaultController) {
	const state = rsdc[controlledReadableStream_][state_];
	return rsdc[closeRequested_] === false && state === "readable";
}

export function readableStreamDefaultControllerGetDesiredSize(rsdc: ReadableStreamDefaultController) {
	const state = rsdc[controlledReadableStream_][state_];
	if (state === "errored") {
		return null;
	}
	if (state === "closed") {
		return 0;
	}
	return rsdc[strategyHWM_] - rsdc[queueTotalSize_];
}

export function readableStreamDefaultControllerError(rsdc: ReadableStreamDefaultController, error: any) {
	
}

export function readableStreamDefaultControllerCallPullIfNeeded(rsdc: ReadableStreamDefaultController) {
	if (! readableStreamDefaultControllerShouldCallPull(rsdc)) {
		return;
	}
	if (rsdc[pulling_]) {
		rsdc[pullAgain_] = true;
		return;
	}
	if (rsdc[pullAgain_]) {
		throw new RangeError("Stream controller is in an invalid state.");
	}

	rsdc[pulling_] = true;
	rsdc[pullAlgorithm_](rsdc).then(
		_ => {
			rsdc[pulling_] = false;
			if (rsdc[pullAgain_]) {
				rsdc[pullAgain_] = false;
				readableStreamDefaultControllerCallPullIfNeeded(rsdc);
			}
		},
		error => {
			readableStreamDefaultControllerError(rsdc, error);
		}
	);
}

export function readableStreamDefaultControllerShouldCallPull(rsdc: ReadableStreamDefaultController) {
	const stream = rsdc[controlledReadableStream_];
	if (! readableStreamDefaultControllerCanCloseOrEnqueue(rsdc)) {
		return false;
	}
	if (rsdc[started_] === false) {
		return false;
	}
	if (isReadableStreamLocked(stream) && readableStreamGetNumReadRequests(stream) > 0) {
		return true;
	}
	const desiredSize = readableStreamDefaultControllerGetDesiredSize(rsdc);
	if (desiredSize === null) {
		throw new RangeError("Stream is in an invalid state.");
	}
	return desiredSize > 0;
}
