import { ControlledPromise, SizeAlgorithm, StreamStrategy, createControlledPromise, createIterResultObject, transferArrayBuffer, closedPromise_, state_, copyDataBlockBytes } from "./shared-internals";
import { WritableStream } from "./writable-internals";
import { QueueContainer, ByteQueueContainer, enqueueValueWithSize, resetQueue, queue_, queueTotalSize_ } from "./queue-mixin";
export * from "./shared-internals";

// ReadableStreamDefaultController
export const controlledReadableStream_ = Symbol("controlledReadableStream_");
export const pullAlgorithm_ = Symbol("pullAlgorithm_");
export const cancelAlgorithm_ = Symbol("cancelAlgorithm_");
export const strategySizeAlgorithm_ = Symbol("strategySizeAlgorithm_");
export const strategyHWM_ = Symbol("strategyHWM_");
export const started_ = Symbol("started_");
export const closeRequested_ = Symbol("closeRequested_");
export const pullAgain_ = Symbol("pullAgain_");
export const pulling_ = Symbol("pulling_");
export const cancelSteps_ = Symbol("cancelSteps_");
export const pullSteps_ = Symbol("pullSteps_");

// ReadableByteStreamController
export const autoAllocateChunkSize_ = Symbol("autoAllocateChunkSize_");
export const byobRequest_ = Symbol("byobRequest_");
export const controlledReadableByteStream_ = Symbol("controlledReadableByteStream_");
export const pendingPullIntos_ = Symbol("pendingPullIntos_");

// ReadableStreamDefaultReader
export const ownerReadableStream_ = Symbol("ownerReadableStream_");
export const readRequests_ = Symbol("readRequests_");
export const readIntoRequests_ = Symbol("readIntoRequests_");

// ReadableStreamBYOBRequest
export const associatedReadableByteStreamController_ = Symbol("associatedReadableByteStreamController_");
export const view_ = Symbol("view_");

// ReadableStreamBYOBReader

// ReadableStream
export const reader_ = Symbol("reader_");
export const readableStreamController_ = Symbol("readableStreamController_");
export const storedError_ = Symbol("storedError_");

export type StartFunction = (controller: ReadableStreamController) => void | Promise<void>;
export type StartAlgorithm = () => Promise<void> | void;
export type PullFunction = (controller: ReadableStreamController) => void | Promise<void>;
export type PullAlgorithm = (controller: ReadableStreamController) => Promise<void>;
export type CancelAlgorithm = (reason?: any) => Promise<void>;

// ----

export interface ReadableStreamController {
	readonly desiredSize: number | null;
	close(): void;
	enqueue(chunk?: any): void;
	error(e?: any): void;

	[cancelSteps_](reason: any): Promise<void>;
	[pullSteps_](): Promise<IteratorResult<any>>;
}

export declare class ReadableStreamBYOBRequest {
	constructor(controller: ReadableByteStreamController, view: ArrayBufferView);
	readonly view: ArrayBufferView;
	respond(bytesWritten: number): void;
	respondWithNewView(view: ArrayBufferView): void;

	[associatedReadableByteStreamController_]: ReadableByteStreamController | undefined;
	[view_]: ArrayBufferView | undefined;
}

interface ArrayBufferViewCtor {
	new(buffer: ArrayBufferLike, byteOffset?: number, byteLength?: number): ArrayBufferView;
}

export interface PullIntoDescriptor {
	readerType: "default" | "byob";
	ctor: ArrayBufferViewCtor;
	buffer: ArrayBufferLike;
	byteOffset: number;
	byteLength: number;
	bytesFilled: number;
	elementSize: number;
}

export interface ReadableByteStreamController extends ReadableStreamController, ByteQueueContainer {
	readonly byobRequest: ReadableStreamBYOBRequest | undefined;

	[autoAllocateChunkSize_]: number | undefined; // A positive integer, when the automatic buffer allocation feature is enabled. In that case, this value specifies the size of buffer to allocate. It is undefined otherwise.
	[byobRequest_]: ReadableStreamBYOBRequest | undefined; // A ReadableStreamBYOBRequest instance representing the current BYOB pull request
	[cancelAlgorithm_]: CancelAlgorithm; // A promise-returning algorithm, taking one argument (the cancel reason), which communicates a requested cancelation to the underlying source
	[closeRequested_]: boolean; // A boolean flag indicating whether the stream has been closed by its underlying byte source, but still has chunks in its internal queue that have not yet been read
	[controlledReadableByteStream_]: ReadableStream; // The ReadableStream instance controlled
	[pullAgain_]: boolean; // A boolean flag set to true if the stream’s mechanisms requested a call to the underlying byte source’s pull() method to pull more data, but the pull could not yet be done since a previous call is still executing
	[pullAlgorithm_]: PullAlgorithm; // A promise-returning algorithm that pulls data from the underlying source
	[pulling_]: boolean; // A boolean flag set to true while the underlying byte source’s pull() method is executing and has not yet fulfilled, used to prevent reentrant calls
	[pendingPullIntos_]: PullIntoDescriptor[]; // A List of descriptors representing pending BYOB pull requests
	[started_]: boolean; // A boolean flag indicating whether the underlying source has finished starting
	[strategyHWM_]: number; // A number supplied to the constructor as part of the stream’s queuing strategy, indicating the point at which the stream will apply backpressure to its underlying byte source
}

export interface ReadableStreamDefaultController extends ReadableStreamController, QueueContainer<any> {
	[controlledReadableStream_]: ReadableStream;
	[pullAlgorithm_]: PullAlgorithm;
	[cancelAlgorithm_]: CancelAlgorithm;
	[strategySizeAlgorithm_]: SizeAlgorithm;
	[strategyHWM_]: number;

	[started_]: boolean;
	[closeRequested_]: boolean;
	[pullAgain_]: boolean;
	[pulling_]: boolean;
}

// ----

export interface ReadableStreamReaderOptions {
	mode?: "byob";
}

export interface ReadableStreamReader {
	readonly closed: Promise<void>;
	cancel(reason: any): Promise<void>;
	releaseLock(): void;

	[ownerReadableStream_]: ReadableStream | undefined;
	[closedPromise_]: ControlledPromise<void>;
}

export declare class ReadableStreamDefaultReader implements ReadableStreamReader {
	constructor(stream: ReadableStream);

	readonly closed: Promise<void>;
	cancel(reason: any): Promise<void>;
	releaseLock(): void;
	read(): Promise<IteratorResult<any>>;

	[ownerReadableStream_]: ReadableStream | undefined;
	[closedPromise_]: ControlledPromise<void>;

	[readRequests_]: ControlledPromise<IteratorResult<any>>[];
}

export declare class ReadableStreamBYOBReader implements ReadableStreamReader {
	constructor(stream: ReadableStream);

	readonly closed: Promise<void>;
	cancel(reason: any): Promise<void>;
	releaseLock(): void;
	read(view: ArrayBufferLike): Promise<IteratorResult<any>>;

	[ownerReadableStream_]: ReadableStream | undefined;
	[closedPromise_]: ControlledPromise<void>;

	[readIntoRequests_]: any[];
}

// ----

export interface ReadableStreamSource {
	type?: "bytes" | undefined;
	autoAllocateChunkSize?: number; // only for "bytes" type sources
	start?: StartFunction;
	pull?: PullFunction;
	cancel?(reason?: any): void;
}

export interface PipeToOptions {
	preventClose?: boolean;
	preventAbort?: boolean;
	preventCancel?: boolean;
}

export interface StreamTransform {
	readable: ReadableStream;
	writable: WritableStream;
}

export type ReadableStreamState = "readable" | "closed" | "errored";

export declare class ReadableStream {
	constructor(source: ReadableStreamSource, strategy: StreamStrategy);

	readonly locked: boolean;
	cancel(reason?: any): Promise<void>;
	getReader(options?: ReadableStreamReaderOptions): ReadableStreamReader;
	tee(): ReadableStream[];

	pipeThrough(transform: StreamTransform, options?: PipeToOptions): ReadableStream;
	pipeTo(dest: WritableStream, options?: PipeToOptions): Promise<void>;

	[state_]: ReadableStreamState;
	[reader_]: ReadableStreamReader | undefined;
	[readableStreamController_]: ReadableStreamController;
	[storedError_]: any;
}

// ---- Stream

export function isReadableStream(value: any): value is ReadableStream {
	if (value == null || typeof value !== "object") {
		return false;
	}
	return readableStreamController_ in value;
}

export function isReadableStreamLocked(stream: ReadableStream) {
	return stream[reader_] !== undefined;
}

export function readableStreamGetNumReadRequests(stream: ReadableStream) {
	const reader = stream[reader_];
	if (reader === undefined) {
		return 0;
	}
	// v-- spec note, assumed
	return (reader as ReadableStreamDefaultReader)[readRequests_].length;
}

export function readableStreamAddReadRequest(stream: ReadableStream) {
	// Assert: !IsReadableStreamDefaultReader(stream.[[reader]]) is true.
	// Assert: stream.[[state]] is "readable".
	const reader = stream[reader_] as ReadableStreamDefaultReader;
	const conProm = createControlledPromise<IteratorResult<any>>();
	reader[readRequests_].push(conProm);
	return conProm.promise;
}

export function readableStreamCancel(stream: ReadableStream, reason: any) {
	if (stream[state_] === "closed") {
		return Promise.resolve(undefined);
	}
	if (stream[state_] === "errored") {
		return Promise.reject(stream[storedError_]);
	}
	readableStreamClose(stream);

	const sourceCancelPromise = stream[readableStreamController_][cancelSteps_](reason);
	return sourceCancelPromise.then(_ => undefined);
}

export function readableStreamClose(stream: ReadableStream) {
	// Assert: stream.[[state]] is "readable".
	stream[state_] = "closed";
	const reader = stream[reader_];
	if (reader === undefined) {
		return;
	}

	if (isReadableStreamDefaultReader(reader)) {
		for (const readRequest of reader[readRequests_]) {
			readRequest.resolve(createIterResultObject(undefined, true));
		}
		reader[readRequests_] = [];
	}
	reader[closedPromise_].resolve();
}

export function readableStreamError(stream: ReadableStream, error: any) {
	if (stream[state_] !== "readable") {
		throw new RangeError("Stream is in an invalid state");
	}
	stream[state_] = "errored";
	stream[storedError_] = error;

	const reader = stream[reader_];
	if (reader === undefined) {
		return;
	}
	if (isReadableStreamDefaultReader(reader)) {
		for (const readRequest of reader[readRequests_]) {
			readRequest.reject(error);
		}
		reader[readRequests_] = [];
	}
	else {
		// Assert: IsReadableStreamBYOBReader(reader).
		// Repeat for each readIntoRequest that is an element of reader.[[readIntoRequests]],
		// 	Reject readIntoRequest.[[promise]] with e.
		// Set reader.[[readIntoRequests]] to a new empty List.
	}

	reader[closedPromise_].reject(error);
}


// ---- DefaultReader

export function isReadableStreamDefaultReader(reader: any): reader is ReadableStreamDefaultReader {
	if (reader == null || typeof reader !== "object") {
		return false;
	}
	return readRequests_ in reader;
}

export function isReadableStreamBYOBReader(reader: any): reader is ReadableStreamBYOBReader {
	if (reader == null || typeof reader !== "object") {
		return false;
	}
	return readIntoRequests_ in reader;
}

export function readableStreamReaderGenericInitialize(reader: ReadableStreamReader, stream: ReadableStream) {
	reader[ownerReadableStream_] = stream;
	stream[reader_] = reader;
	const streamState = stream[state_];

	reader[closedPromise_] = createControlledPromise<void>();
	if (streamState === "readable") {
		// leave as is
	}
	else if (streamState === "closed") {
		reader[closedPromise_].resolve(undefined);
	}
	else {
		reader[closedPromise_].reject(stream[storedError_]);
	}
}

export function readableStreamReaderGenericRelease(reader: ReadableStreamReader) {
	// Assert: reader.[[ownerReadableStream]] is not undefined.
	// Assert: reader.[[ownerReadableStream]].[[reader]] is reader.
	const stream = reader[ownerReadableStream_];
	if (stream === undefined) {
		throw new TypeError("Reader is in an inconsistent state");
	}

	if (stream[state_] === "readable") {
		reader[closedPromise_].reject(new TypeError());
	}
	else {
		reader[closedPromise_] = createControlledPromise<void>();
		reader[closedPromise_].reject(new TypeError());
	}

	stream[reader_] = undefined;
	reader[ownerReadableStream_] = undefined;
}

export function readableStreamDefaultReaderRead(reader: ReadableStreamDefaultReader) {
	// Assert: stream is not undefined.
	const stream = reader[ownerReadableStream_]!;

	if (stream[state_] === "closed") {
		return Promise.resolve(createIterResultObject(undefined, true));
	}
	if (stream[state_] === "errored") {
		return Promise.reject(stream[storedError_]);
	}
	// Assert: stream.[[state]] is "readable".
	return stream[readableStreamController_][pullSteps_]();
}

export function readableStreamFulfillReadRequest(stream: ReadableStream, chunk: any, done: boolean) {
	// Let reader be stream.[[reader]].
	const reader = stream[reader_];
	if (! isReadableStreamDefaultReader(reader)) {
		throw new TypeError("Invalid stream reader");
	}
	const readRequest = reader[readRequests_].shift()!; // <-- length check done in caller
	readRequest.resolve(createIterResultObject(chunk, done));
}

// ---- DefaultController

export function isReadableStreamDefaultController(value: any): value is ReadableStreamDefaultController {
	if (value == null || typeof value !== "object") {
		return false;
	}
	return controlledReadableStream_ in value;
}

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

export function readableStreamDefaultControllerClose(rsdc: ReadableStreamDefaultController) {
	// Assert: !ReadableStreamDefaultControllerCanCloseOrEnqueue(controller) is true.
	rsdc[closeRequested_] = true;
	const stream = rsdc[controlledReadableStream_];
	if (rsdc[queue_].length === 0) {
		readableStreamClose(stream);
	}
}

export function readableStreamDefaultControllerEnqueue(rsdc: ReadableStreamDefaultController, chunk: any) {
	const stream = rsdc[controlledReadableStream_];
	// Assert: !ReadableStreamDefaultControllerCanCloseOrEnqueue(controller) is true.
	if (isReadableStreamLocked(stream) && readableStreamGetNumReadRequests(stream) > 0) {
		readableStreamFulfillReadRequest(stream, chunk, false);
	}
	else {
		// Let result be the result of performing controller.[[strategySizeAlgorithm]], passing in chunk,
		// and interpreting the result as an ECMAScript completion value.
		// impl note: assuming that in JS land this just means try/catch with rethrow
		let chunkSize: number;
		try {
			chunkSize = rsdc[strategySizeAlgorithm_](chunk);
		}
		catch (error) {
			readableStreamDefaultControllerError(rsdc, error);
			throw error;
		}
		try {
			enqueueValueWithSize(rsdc, chunk, chunkSize);
		}
		catch (error) {
			readableStreamDefaultControllerError(rsdc, error);
			throw error;
		}
	}
	readableStreamDefaultControllerCallPullIfNeeded(rsdc);
}

export function readableStreamDefaultControllerError(rsdc: ReadableStreamDefaultController, error: any) {
	const stream = rsdc[controlledReadableStream_];
	if (stream[state_] !== "readable") {
		return;
	}
	resetQueue(rsdc);
	readableStreamError(stream, error);
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

// ---- BYOBRequest

export function isReadableStreamBYOBRequest(value: any): value is ReadableStreamBYOBRequest {
	if (value == null || typeof value !== "object") {
		return false;
	}
	return associatedReadableByteStreamController_ in value;
}


// ---- BYOBReader


// ---- ByteController

export function isReadableByteStreamController(value: any): value is ReadableByteStreamController {
	if (value == null || typeof value !== "object") {
		return false;
	}
	return controlledReadableByteStream_ in value;
}

