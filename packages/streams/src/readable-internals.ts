/**
 * streams/readable-internals - internal types and functions for readable streams
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

import * as ws from "./writable-internals";
import * as shared from "./shared-internals";
import * as q from "./queue-mixin";

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
export const closedPromise_ = Symbol("closedPromise_");
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

export type StartFunction = (controller: ReadableStreamController) => void | Promise<void>;
export type StartAlgorithm = () => Promise<void> | void;
export type PullFunction = (controller: ReadableStreamController) => void | Promise<void>;
export type PullAlgorithm = (controller: ReadableStreamController) => Promise<void>;
export type CancelAlgorithm = (reason?: any) => Promise<void>;

// ----

export interface ReadableStreamController {
	readonly desiredSize: number | null;
	close(): void;
	error(e?: any): void;

	[cancelSteps_](reason: any): Promise<void>;
	[pullSteps_](forAuthorCode: boolean): Promise<IteratorResult<any>>;
}

export interface ReadableStreamBYOBRequest {
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

export interface ReadableByteStreamController extends ReadableStreamController, q.ByteQueueContainer {
	readonly byobRequest: ReadableStreamBYOBRequest | undefined;
	enqueue(chunk: ArrayBufferView): void;

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

export interface ReadableStreamDefaultController extends ReadableStreamController, q.QueueContainer<any> {
	enqueue(chunk?: any): void;

	[controlledReadableStream_]: ReadableStream;
	[pullAlgorithm_]: PullAlgorithm;
	[cancelAlgorithm_]: CancelAlgorithm;
	[strategySizeAlgorithm_]: shared.SizeAlgorithm;
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
	[closedPromise_]: shared.ControlledPromise<void>;
}

export interface ReadRequest<V> extends shared.ControlledPromise<V> {
	forAuthorCode: boolean;
}

export declare class ReadableStreamDefaultReader implements ReadableStreamReader {
	constructor(stream: ReadableStream);

	readonly closed: Promise<void>;
	cancel(reason: any): Promise<void>;
	releaseLock(): void;
	read(): Promise<IteratorResult<any>>;

	[ownerReadableStream_]: ReadableStream | undefined;
	[closedPromise_]: shared.ControlledPromise<void>;

	[readRequests_]: ReadRequest<IteratorResult<any>>[];
}

export declare class ReadableStreamBYOBReader implements ReadableStreamReader {
	constructor(stream: ReadableStream);

	readonly closed: Promise<void>;
	cancel(reason: any): Promise<void>;
	releaseLock(): void;
	read(view: ArrayBufferView): Promise<IteratorResult<ArrayBufferView>>;

	[ownerReadableStream_]: ReadableStream | undefined;
	[closedPromise_]: shared.ControlledPromise<void>;

	[readIntoRequests_]: ReadRequest<IteratorResult<ArrayBufferView>>[];
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
	writable: ws.WritableStream;
}

export type ReadableStreamState = "readable" | "closed" | "errored";

export declare class ReadableStream {
	constructor(source: ReadableStreamSource, strategy: shared.StreamStrategy);

	readonly locked: boolean;
	cancel(reason?: any): Promise<void>;
	getReader(options?: ReadableStreamReaderOptions): ReadableStreamReader;
	tee(): ReadableStream[];

	pipeThrough(transform: StreamTransform, options?: PipeToOptions): ReadableStream;
	pipeTo(dest: ws.WritableStream, options?: PipeToOptions): Promise<void>;

	[shared.state_]: ReadableStreamState;
	[shared.storedError_]: any;
	[reader_]: ReadableStreamReader | undefined;
	[readableStreamController_]: ReadableStreamController;
}

// ---- Stream

export function initializeReadableStream(stream: ReadableStream) {
	stream[shared.state_] = "readable";
	stream[reader_] = undefined;
	stream[shared.storedError_] = undefined;
	stream[readableStreamController_] = undefined!; // mark slot as used for brand check
}

export function isReadableStream(value: any): value is ReadableStream {
	if (value == null || typeof value !== "object") {
		return false;
	}
	return readableStreamController_ in value;
}

export function isReadableStreamLocked(stream: ReadableStream) {
	return stream[reader_] !== undefined;
}

export function readableStreamGetNumReadIntoRequests(stream: ReadableStream) {
	const reader = stream[reader_] as ReadableStreamBYOBReader;
	if (reader === undefined) {
		return 0;
	}
	return reader[readIntoRequests_].length;
}

export function readableStreamGetNumReadRequests(stream: ReadableStream) {
	const reader = stream[reader_] as ReadableStreamDefaultReader;
	if (reader === undefined) {
		return 0;
	}
	return reader[readRequests_].length;
}

export function readableStreamCreateReadResult<T>(value: T, done: boolean, forAuthorCode: boolean): IteratorResult<T> {
	const prototype = forAuthorCode ? Object.prototype : null;
	const result = Object.create(prototype);
	result.value = value;
	result.done = done;
	return result;
}

export function readableStreamAddReadIntoRequest(stream: ReadableStream, forAuthorCode: boolean) {
	// Assert: ! IsReadableStreamBYOBReader(stream.[[reader]]) is true.
	// Assert: stream.[[state]] is "readable" or "closed".
	const reader = stream[reader_] as ReadableStreamBYOBReader;
	const conProm = shared.createControlledPromise<IteratorResult<any>>() as ReadRequest<IteratorResult<any>>;
	conProm.forAuthorCode = forAuthorCode;
	reader[readIntoRequests_].push(conProm);
	return conProm.promise;
}

export function readableStreamAddReadRequest(stream: ReadableStream, forAuthorCode: boolean) {
	// Assert: ! IsReadableStreamDefaultReader(stream.[[reader]]) is true.
	// Assert: stream.[[state]] is "readable".
	const reader = stream[reader_] as ReadableStreamDefaultReader;
	const conProm = shared.createControlledPromise<IteratorResult<any>>() as ReadRequest<IteratorResult<any>>;
	conProm.forAuthorCode = forAuthorCode;
	reader[readRequests_].push(conProm);
	return conProm.promise;
}

export function readableStreamHasBYOBReader(stream: ReadableStream) {
	const reader = stream[reader_];
	return isReadableStreamBYOBReader(reader);
}

export function readableStreamHasDefaultReader(stream: ReadableStream) {
	const reader = stream[reader_];
	return isReadableStreamDefaultReader(reader);
}

export function readableStreamCancel(stream: ReadableStream, reason: any) {
	if (stream[shared.state_] === "closed") {
		return Promise.resolve(undefined);
	}
	if (stream[shared.state_] === "errored") {
		return Promise.reject(stream[shared.storedError_]);
	}
	readableStreamClose(stream);

	const sourceCancelPromise = stream[readableStreamController_][cancelSteps_](reason);
	return sourceCancelPromise.then(_ => undefined);
}

export function readableStreamClose(stream: ReadableStream) {
	// Assert: stream.[[state]] is "readable".
	stream[shared.state_] = "closed";
	const reader = stream[reader_];
	if (reader === undefined) {
		return;
	}

	if (isReadableStreamDefaultReader(reader)) {
		for (const readRequest of reader[readRequests_]) {
			readRequest.resolve(readableStreamCreateReadResult(undefined, true, readRequest.forAuthorCode));
		}
		reader[readRequests_] = [];
	}
	reader[closedPromise_].resolve();
	reader[closedPromise_].promise.catch(() => {});
}

export function readableStreamError(stream: ReadableStream, error: any) {
	if (stream[shared.state_] !== "readable") {
		throw new RangeError("Stream is in an invalid state");
	}
	stream[shared.state_] = "errored";
	stream[shared.storedError_] = error;

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
		const readIntoRequests = (reader as ReadableStreamBYOBReader)[readIntoRequests_];
		for (const readIntoRequest of readIntoRequests) {
			readIntoRequest.reject(error);
		}
		(reader as ReadableStreamBYOBReader)[readIntoRequests_] = [];
	}

	reader[closedPromise_].reject(error);
}


// ---- Readers

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
	const streamState = stream[shared.state_];

	reader[closedPromise_] = shared.createControlledPromise<void>();
	if (streamState === "readable") {
		// leave as is
	}
	else if (streamState === "closed") {
		reader[closedPromise_].resolve(undefined);
	}
	else {
		reader[closedPromise_].reject(stream[shared.storedError_]);
		reader[closedPromise_].promise.catch(() => {});
	}
}

export function readableStreamReaderGenericRelease(reader: ReadableStreamReader) {
	// Assert: reader.[[ownerReadableStream]] is not undefined.
	// Assert: reader.[[ownerReadableStream]].[[reader]] is reader.
	const stream = reader[ownerReadableStream_];
	if (stream === undefined) {
		throw new TypeError("Reader is in an inconsistent state");
	}

	if (stream[shared.state_] === "readable") {
		// code moved out
	}
	else {
		reader[closedPromise_] = shared.createControlledPromise<void>();
	}
	reader[closedPromise_].reject(new TypeError());
	reader[closedPromise_].promise.catch(() => {});

	stream[reader_] = undefined;
	reader[ownerReadableStream_] = undefined;
}

export function readableStreamBYOBReaderRead(reader: ReadableStreamBYOBReader, view: ArrayBufferView, forAuthorCode = false) {
	const stream = reader[ownerReadableStream_]!;
	// Assert: stream is not undefined.
	
	if (stream[shared.state_] === "errored") {
		return Promise.reject(stream[shared.storedError_]);
	}
	return readableByteStreamControllerPullInto(stream[readableStreamController_] as ReadableByteStreamController, view, forAuthorCode);
}

export function readableStreamDefaultReaderRead(reader: ReadableStreamDefaultReader, forAuthorCode = false) {
	const stream = reader[ownerReadableStream_]!;
	// Assert: stream is not undefined.

	if (stream[shared.state_] === "closed") {
		return Promise.resolve(readableStreamCreateReadResult(undefined, true, forAuthorCode));
	}
	if (stream[shared.state_] === "errored") {
		return Promise.reject(stream[shared.storedError_]);
	}
	// Assert: stream.[[state]] is "readable".
	return stream[readableStreamController_][pullSteps_](forAuthorCode);
}

export function readableStreamFulfillReadIntoRequest(stream: ReadableStream, chunk: ArrayBufferView, done: boolean) {
	const reader = stream[reader_] as ReadableStreamBYOBReader;
	const readIntoRequest = reader[readIntoRequests_].shift()!; // <-- length check done in caller
	readIntoRequest.resolve(readableStreamCreateReadResult(chunk, done, readIntoRequest.forAuthorCode));
}

export function readableStreamFulfillReadRequest(stream: ReadableStream, chunk: any, done: boolean) {
	const reader = stream[reader_] as ReadableStreamDefaultReader;
	const readRequest = reader[readRequests_].shift()!; // <-- length check done in caller
	readRequest.resolve(readableStreamCreateReadResult(chunk, done, readRequest.forAuthorCode));
}

// ---- DefaultController

export function setUpReadableStreamDefaultController(stream: ReadableStream, controller: ReadableStreamDefaultController, startAlgorithm: StartAlgorithm, pullAlgorithm: PullAlgorithm, cancelAlgorithm: CancelAlgorithm, highWaterMark: number, sizeAlgorithm: shared.SizeAlgorithm) {
	// Assert: stream.[[readableStreamController]] is undefined.
	controller[controlledReadableStream_] = stream;
	q.resetQueue(controller);
	controller[started_] = false;
	controller[closeRequested_] = false;
	controller[pullAgain_] = false;
	controller[pulling_] = false;
	controller[strategySizeAlgorithm_] = sizeAlgorithm;
	controller[strategyHWM_] = highWaterMark;
	controller[pullAlgorithm_] = pullAlgorithm;
	controller[cancelAlgorithm_] = cancelAlgorithm;
	stream[readableStreamController_] = controller;

	const startResult = startAlgorithm();
	Promise.resolve(startResult).then(
		_ => {
			controller[started_] = true;
			// Assert: controller.[[pulling]] is false.
			// Assert: controller.[[pullAgain]] is false.
			readableStreamDefaultControllerCallPullIfNeeded(controller);
		},
		error => {
			readableStreamDefaultControllerError(controller, error);
		}
	);
}

export function isReadableStreamDefaultController(value: any): value is ReadableStreamDefaultController {
	if (value == null || typeof value !== "object") {
		return false;
	}
	return controlledReadableStream_ in value;
}

export function readableStreamDefaultControllerHasBackpressure(controller: ReadableStreamDefaultController) {
	return ! readableStreamDefaultControllerShouldCallPull(controller);
}

export function readableStreamDefaultControllerCanCloseOrEnqueue(controller: ReadableStreamDefaultController) {
	const state = controller[controlledReadableStream_][shared.state_];
	return controller[closeRequested_] === false && state === "readable";
}

export function readableStreamDefaultControllerGetDesiredSize(controller: ReadableStreamDefaultController) {
	const state = controller[controlledReadableStream_][shared.state_];
	if (state === "errored") {
		return null;
	}
	if (state === "closed") {
		return 0;
	}
	return controller[strategyHWM_] - controller[q.queueTotalSize_];
}

export function readableStreamDefaultControllerClose(controller: ReadableStreamDefaultController) {
	// Assert: !ReadableStreamDefaultControllerCanCloseOrEnqueue(controller) is true.
	controller[closeRequested_] = true;
	const stream = controller[controlledReadableStream_];
	if (controller[q.queue_].length === 0) {
		readableStreamDefaultControllerClearAlgorithms(controller);
		readableStreamClose(stream);
	}
}

export function readableStreamDefaultControllerEnqueue(controller: ReadableStreamDefaultController, chunk: any) {
	const stream = controller[controlledReadableStream_];
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
			chunkSize = controller[strategySizeAlgorithm_](chunk);
		}
		catch (error) {
			readableStreamDefaultControllerError(controller, error);
			throw error;
		}
		try {
			q.enqueueValueWithSize(controller, chunk, chunkSize);
		}
		catch (error) {
			readableStreamDefaultControllerError(controller, error);
			throw error;
		}
	}
	readableStreamDefaultControllerCallPullIfNeeded(controller);
}

export function readableStreamDefaultControllerError(controller: ReadableStreamDefaultController, error: any) {
	const stream = controller[controlledReadableStream_];
	if (stream[shared.state_] !== "readable") {
		return;
	}
	q.resetQueue(controller);
	readableStreamDefaultControllerClearAlgorithms(controller);
	readableStreamError(stream, error);
}

export function readableStreamDefaultControllerCallPullIfNeeded(controller: ReadableStreamDefaultController) {
	if (! readableStreamDefaultControllerShouldCallPull(controller)) {
		return;
	}
	if (controller[pulling_]) {
		controller[pullAgain_] = true;
		return;
	}
	if (controller[pullAgain_]) {
		throw new RangeError("Stream controller is in an invalid state.");
	}

	controller[pulling_] = true;
	controller[pullAlgorithm_](controller).then(
		_ => {
			controller[pulling_] = false;
			if (controller[pullAgain_]) {
				controller[pullAgain_] = false;
				readableStreamDefaultControllerCallPullIfNeeded(controller);
			}
		},
		error => {
			readableStreamDefaultControllerError(controller, error);
		}
	);
}

export function readableStreamDefaultControllerShouldCallPull(controller: ReadableStreamDefaultController) {
	const stream = controller[controlledReadableStream_];
	if (! readableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
		return false;
	}
	if (controller[started_] === false) {
		return false;
	}
	if (isReadableStreamLocked(stream) && readableStreamGetNumReadRequests(stream) > 0) {
		return true;
	}
	const desiredSize = readableStreamDefaultControllerGetDesiredSize(controller);
	if (desiredSize === null) {
		throw new RangeError("Stream is in an invalid state.");
	}
	return desiredSize > 0;
}

export function readableStreamDefaultControllerClearAlgorithms(controller: ReadableStreamDefaultController) {
	controller[pullAlgorithm_] = undefined!;
	controller[cancelAlgorithm_] = undefined!;
}


// ---- BYOBController

export function setUpReadableByteStreamController(stream: ReadableStream, controller: ReadableByteStreamController, startAlgorithm: StartAlgorithm, pullAlgorithm: PullAlgorithm, cancelAlgorithm: CancelAlgorithm, highWaterMark: number, autoAllocateChunkSize: number | undefined) {
	// Assert: stream.[[readableStreamController]] is undefined.
	if (stream[readableStreamController_] !== undefined) {
		throw new TypeError("Cannot reuse streams");
	}
	if (autoAllocateChunkSize !== undefined) {
		if (! shared.isInteger(autoAllocateChunkSize) || autoAllocateChunkSize <= 0) {
			throw new RangeError("autoAllocateChunkSize must be a positive, finite integer");
		}
	}
	// Set controller.[[controlledReadableByteStream]] to stream.
	controller[controlledReadableByteStream_] = stream;
	// Set controller.[[pullAgain]] and controller.[[pulling]] to false.
	controller[pullAgain_] = false;
	controller[pulling_] = false;
	readableByteStreamControllerClearPendingPullIntos(controller);
	q.resetQueue(controller);
	controller[closeRequested_] = false;
	controller[started_] = false;
	controller[strategyHWM_] = shared.validateAndNormalizeHighWaterMark(highWaterMark);
	controller[pullAlgorithm_] = pullAlgorithm;
	controller[cancelAlgorithm_] = cancelAlgorithm;
	controller[autoAllocateChunkSize_] = autoAllocateChunkSize;
	controller[pendingPullIntos_] = [];
	stream[readableStreamController_] = controller;

	// Let startResult be the result of performing startAlgorithm.
	const startResult = startAlgorithm();
	Promise.resolve(startResult).then(
		_ => {
			controller[started_] = true;
			// Assert: controller.[[pulling]] is false.
			// Assert: controller.[[pullAgain]] is false.
			readableByteStreamControllerCallPullIfNeeded(controller);
		},
		error => {
			readableByteStreamControllerError(controller, error);
		}
	);
}

export function isReadableStreamBYOBRequest(value: any): value is ReadableStreamBYOBRequest {
	if (value == null || typeof value !== "object") {
		return false;
	}
	return associatedReadableByteStreamController_ in value;
}

export function isReadableByteStreamController(value: any): value is ReadableByteStreamController {
	if (value == null || typeof value !== "object") {
		return false;
	}
	return controlledReadableByteStream_ in value;
}

export function readableByteStreamControllerCallPullIfNeeded(controller: ReadableByteStreamController) {
	if (! readableByteStreamControllerShouldCallPull(controller)) {
		return;
	}
	if (controller[pulling_]) {
		controller[pullAgain_] = true;
		return;
	}
	// Assert: controller.[[pullAgain]] is false.
	controller[pulling_] = true;
	controller[pullAlgorithm_](controller).then(
		_ => {
			controller[pulling_] = false;
			if (controller[pullAgain_]) {
				controller[pullAgain_] = false;
				readableByteStreamControllerCallPullIfNeeded(controller);
			}
		},
		error => {
			readableByteStreamControllerError(controller, error);
		}
	);
}

export function readableByteStreamControllerClearAlgorithms(controller: ReadableByteStreamController) {
	controller[pullAlgorithm_] = undefined!;
	controller[cancelAlgorithm_] = undefined!;
}

export function readableByteStreamControllerClearPendingPullIntos(controller: ReadableByteStreamController) {
	readableByteStreamControllerInvalidateBYOBRequest(controller);
	controller[pendingPullIntos_] = [];
}

export function readableByteStreamControllerClose(controller: ReadableByteStreamController) {
	const stream = controller[controlledReadableByteStream_];
	// Assert: controller.[[closeRequested]] is false.
	// Assert: stream.[[state]] is "readable".
	if (controller[q.queueTotalSize_] > 0) {
		controller[closeRequested_] = true;
		return;
	}
	if (controller[pendingPullIntos_].length > 0) {
		const firstPendingPullInto = controller[pendingPullIntos_][0];
		if (firstPendingPullInto.bytesFilled > 0) {
			const error = new TypeError();
			readableByteStreamControllerError(controller, error);
			throw error;
		}
	}
	readableByteStreamControllerClearAlgorithms(controller);
	readableStreamClose(stream);
}

export function readableByteStreamControllerCommitPullIntoDescriptor(stream: ReadableStream, pullIntoDescriptor: PullIntoDescriptor) {
	// Assert: stream.[[state]] is not "errored".
	let done = false;
	if (stream[shared.state_] === "closed") {
		// Assert: pullIntoDescriptor.[[bytesFilled]] is 0.
		done = true;
	}
	const filledView = readableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
	if (pullIntoDescriptor.readerType === "default") {
		readableStreamFulfillReadRequest(stream, filledView, done);
	}
	else {
		// Assert: pullIntoDescriptor.[[readerType]] is "byob".
		readableStreamFulfillReadIntoRequest(stream, filledView, done);
	}
}

export function readableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor: PullIntoDescriptor) {
	const { bytesFilled, elementSize } = pullIntoDescriptor;
	// Assert: bytesFilled <= pullIntoDescriptor.byteLength
	// Assert: bytesFilled mod elementSize is 0
	return new pullIntoDescriptor.ctor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, bytesFilled / elementSize);
}

export function readableByteStreamControllerEnqueue(controller: ReadableByteStreamController, chunk: ArrayBufferView) {
	const stream = controller[controlledReadableByteStream_];
	// Assert: controller.[[closeRequested]] is false.
	// Assert: stream.[[state]] is "readable".
	const { buffer, byteOffset, byteLength } = chunk;
	
	const transferredBuffer = shared.transferArrayBuffer(buffer);

	if (readableStreamHasDefaultReader(stream)) {
		if (readableStreamGetNumReadRequests(stream) === 0) {
			readableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
		}
		else {
			// Assert: controller.[[queue]] is empty.
			const transferredView = new Uint8Array(transferredBuffer, byteOffset, byteLength);
			readableStreamFulfillReadRequest(stream, transferredView, false);
		}
	}
	else if (readableStreamHasBYOBReader(stream)) {
		readableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
		readableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
	}
	else {
		// Assert: !IsReadableStreamLocked(stream) is false.
		readableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
	}
	readableByteStreamControllerCallPullIfNeeded(controller);
}

export function readableByteStreamControllerEnqueueChunkToQueue(controller: ReadableByteStreamController, buffer: ArrayBufferLike, byteOffset: number, byteLength: number) {
	controller[q.queue_].push({ buffer, byteOffset, byteLength });
	controller[q.queueTotalSize_] += byteLength;
}

export function readableByteStreamControllerError(controller: ReadableByteStreamController, error: any) {
	const stream = controller[controlledReadableByteStream_];
	if (stream[shared.state_] !== "readable") {
		return;
	}
	readableByteStreamControllerClearPendingPullIntos(controller);
	q.resetQueue(controller);
	readableByteStreamControllerClearAlgorithms(controller);
	readableStreamError(stream, error);
}

export function readableByteStreamControllerFillHeadPullIntoDescriptor(controller: ReadableByteStreamController, size: number, pullIntoDescriptor: PullIntoDescriptor) {
	// Assert: either controller.[[pendingPullIntos]] is empty, or the first element of controller.[[pendingPullIntos]] is pullIntoDescriptor.
	readableByteStreamControllerInvalidateBYOBRequest(controller);
	pullIntoDescriptor.bytesFilled += size;
}

export function readableByteStreamControllerFillPullIntoDescriptorFromQueue(controller: ReadableByteStreamController, pullIntoDescriptor: PullIntoDescriptor) {
	const elementSize = pullIntoDescriptor.elementSize;
	const currentAlignedBytes = pullIntoDescriptor.bytesFilled - (pullIntoDescriptor.bytesFilled % elementSize);
	const maxBytesToCopy = Math.min(controller[q.queueTotalSize_], pullIntoDescriptor.byteLength - pullIntoDescriptor.bytesFilled);
	const maxBytesFilled = pullIntoDescriptor.bytesFilled + maxBytesToCopy;
	const maxAlignedBytes = maxBytesFilled - (maxBytesFilled % elementSize);
	let totalBytesToCopyRemaining = maxBytesToCopy;
	let ready = false;

	if (maxAlignedBytes > currentAlignedBytes) {
		totalBytesToCopyRemaining = maxAlignedBytes - pullIntoDescriptor.bytesFilled;
		ready = true;
	}
	const queue = controller[q.queue_];

	while (totalBytesToCopyRemaining > 0) {
		const headOfQueue = queue.front()!;
		const bytesToCopy = Math.min(totalBytesToCopyRemaining, headOfQueue.byteLength);
		const destStart = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
		shared.copyDataBlockBytes(pullIntoDescriptor.buffer, destStart, headOfQueue.buffer, headOfQueue.byteOffset, bytesToCopy);
		if (headOfQueue.byteLength === bytesToCopy) {
			queue.shift();
		}
		else {
			headOfQueue.byteOffset += bytesToCopy;
			headOfQueue.byteLength -= bytesToCopy;
		}
		controller[q.queueTotalSize_] -= bytesToCopy;
		readableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesToCopy, pullIntoDescriptor);
		totalBytesToCopyRemaining -= bytesToCopy;
	}
	if (! ready) {
		// Assert: controller[queueTotalSize_] === 0
		// Assert: pullIntoDescriptor.bytesFilled > 0
		// Assert: pullIntoDescriptor.bytesFilled < pullIntoDescriptor.elementSize
	}
	return ready;
}

export function readableByteStreamControllerGetDesiredSize(controller: ReadableByteStreamController) {
	const stream = controller[controlledReadableByteStream_];
	const state = stream[shared.state_];
	if (state === "errored") {
		return null;
	}
	if (state === "closed") {
		return 0;
	}
	return controller[strategyHWM_] - controller[q.queueTotalSize_];
}

export function readableByteStreamControllerHandleQueueDrain(controller: ReadableByteStreamController) {
	// Assert: controller.[[controlledReadableByteStream]].[[state]] is "readable".
	if (controller[q.queueTotalSize_] === 0 && controller[closeRequested_]) {
		readableByteStreamControllerClearAlgorithms(controller);
		readableStreamClose(controller[controlledReadableByteStream_]);
	}
	else {
		readableByteStreamControllerCallPullIfNeeded(controller);
	}
}

export function readableByteStreamControllerInvalidateBYOBRequest(controller: ReadableByteStreamController) {
	const byobRequest = controller[byobRequest_];
	if (byobRequest === undefined) {
		return;
	}
	byobRequest[associatedReadableByteStreamController_] = undefined;
	byobRequest[view_] = undefined;
	controller[byobRequest_] = undefined;
}

export function readableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller: ReadableByteStreamController) {
	// Assert: controller.[[closeRequested]] is false.
	const pendingPullIntos = controller[pendingPullIntos_];
	while (pendingPullIntos.length > 0) {
		if (controller[q.queueTotalSize_] === 0) {
			return;
		}
		const pullIntoDescriptor = pendingPullIntos[0];
		if (readableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
			readableByteStreamControllerShiftPendingPullInto(controller);
			readableByteStreamControllerCommitPullIntoDescriptor(controller[controlledReadableByteStream_], pullIntoDescriptor);
		}
	}
}

export function readableByteStreamControllerPullInto(controller: ReadableByteStreamController, view: ArrayBufferView, forAuthorCode: boolean) {
	const stream = controller[controlledReadableByteStream_];

	const elementSize = (view as Uint8Array).BYTES_PER_ELEMENT || 1; // DataView exposes this in Webkit as 1, is not present in FF or Blink
	const ctor = (view as any).constructor as Uint8ArrayConstructor; // the typecast here is just for TS typing, it does not influence buffer creation

	const byteOffset = view.byteOffset;
	const byteLength = view.byteLength;
	const buffer = shared.transferArrayBuffer(view.buffer);
	const pullIntoDescriptor: PullIntoDescriptor = { buffer, byteOffset, byteLength, bytesFilled: 0, elementSize, ctor, readerType: "byob" };

	if (controller[pendingPullIntos_].length > 0) {
		controller[pendingPullIntos_].push(pullIntoDescriptor);
		return readableStreamAddReadIntoRequest(stream, forAuthorCode);
	}
	if (stream[shared.state_] === "closed") {
		const emptyView = new ctor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, 0);
		return Promise.resolve(readableStreamCreateReadResult(emptyView, true, forAuthorCode));
	}

	if (controller[q.queueTotalSize_] > 0) {
		if (readableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
			const filledView = readableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
			readableByteStreamControllerHandleQueueDrain(controller);
			return Promise.resolve(readableStreamCreateReadResult(filledView, false, forAuthorCode));
		}
		if (controller[closeRequested_]) {
			const error = new TypeError();
			readableByteStreamControllerError(controller, error);
			return Promise.reject(error);
		}
	}

	controller[pendingPullIntos_].push(pullIntoDescriptor);
	const promise = readableStreamAddReadIntoRequest(stream, forAuthorCode);
	readableByteStreamControllerCallPullIfNeeded(controller);
	return promise;
}

export function readableByteStreamControllerRespond(controller: ReadableByteStreamController, bytesWritten: number) {
	bytesWritten = Number(bytesWritten);
	if (! shared.isFiniteNonNegativeNumber(bytesWritten)) {
		throw new RangeError("bytesWritten must be a finite, non-negative number");
	}
	// Assert: controller.[[pendingPullIntos]] is not empty.
	readableByteStreamControllerRespondInternal(controller, bytesWritten);
}

export function readableByteStreamControllerRespondInClosedState(controller: ReadableByteStreamController, firstDescriptor: PullIntoDescriptor) {
	firstDescriptor.buffer = shared.transferArrayBuffer(firstDescriptor.buffer);
	// Assert: firstDescriptor.[[bytesFilled]] is 0.
	const stream = controller[controlledReadableByteStream_];
	if (readableStreamHasBYOBReader(stream)) {
		while (readableStreamGetNumReadIntoRequests(stream) > 0) {
			const pullIntoDescriptor = readableByteStreamControllerShiftPendingPullInto(controller)!;
			readableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor);
		}
	}
}

export function readableByteStreamControllerRespondInReadableState(controller: ReadableByteStreamController, bytesWritten: number, pullIntoDescriptor: PullIntoDescriptor) {
	if (pullIntoDescriptor.bytesFilled + bytesWritten > pullIntoDescriptor.byteLength) {
		throw new RangeError();
	}
	readableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesWritten, pullIntoDescriptor);
	if (pullIntoDescriptor.bytesFilled < pullIntoDescriptor.elementSize) {
		return;
	}
	readableByteStreamControllerShiftPendingPullInto(controller);
	const remainderSize = pullIntoDescriptor.bytesFilled % pullIntoDescriptor.elementSize;
	if (remainderSize > 0) {
		const end = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
		const remainder = shared.cloneArrayBuffer(pullIntoDescriptor.buffer, end - remainderSize, remainderSize, ArrayBuffer);
		readableByteStreamControllerEnqueueChunkToQueue(controller, remainder, 0, remainder.byteLength);
	}
	pullIntoDescriptor.buffer = shared.transferArrayBuffer(pullIntoDescriptor.buffer);
	pullIntoDescriptor.bytesFilled = pullIntoDescriptor.bytesFilled - remainderSize;
	readableByteStreamControllerCommitPullIntoDescriptor(controller[controlledReadableByteStream_], pullIntoDescriptor);
	readableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
}

export function readableByteStreamControllerRespondInternal(controller: ReadableByteStreamController, bytesWritten: number) {
	const firstDescriptor = controller[pendingPullIntos_][0];
	const stream = controller[controlledReadableByteStream_];
	if (stream[shared.state_] === "closed") {
		if (bytesWritten !== 0) {
			throw new TypeError();
		}
		readableByteStreamControllerRespondInClosedState(controller, firstDescriptor);
	}
	else {
		// Assert: stream.[[state]] is "readable".
		readableByteStreamControllerRespondInReadableState(controller, bytesWritten, firstDescriptor);
	}
	readableByteStreamControllerCallPullIfNeeded(controller);
}

export function readableByteStreamControllerRespondWithNewView(controller: ReadableByteStreamController, view: ArrayBufferView) {
	// Assert: controller.[[pendingPullIntos]] is not empty.
	const firstDescriptor = controller[pendingPullIntos_][0];
	if (firstDescriptor.byteOffset + firstDescriptor.bytesFilled !== view.byteOffset) {
		throw new RangeError();
	} 
	if (firstDescriptor.byteLength !== view.byteLength) {
		throw new RangeError();
	}
	firstDescriptor.buffer = view.buffer;
	readableByteStreamControllerRespondInternal(controller, view.byteLength);
}

export function readableByteStreamControllerShiftPendingPullInto(controller: ReadableByteStreamController) {
	const descriptor = controller[pendingPullIntos_].shift();
	readableByteStreamControllerInvalidateBYOBRequest(controller);
	return descriptor;
}

export function readableByteStreamControllerShouldCallPull(controller: ReadableByteStreamController) {
	// Let stream be controller.[[controlledReadableByteStream]].
	const stream = controller[controlledReadableByteStream_];
	if (stream[shared.state_] !== "readable") {
		return false;
	}
	if (controller[closeRequested_]) {
		return false;
	}
	if (! controller[started_]) {
		return false;
	}
	if (readableStreamHasDefaultReader(stream) && readableStreamGetNumReadRequests(stream) > 0) {
		return true;
	}
	if (readableStreamHasBYOBReader(stream) && readableStreamGetNumReadIntoRequests(stream) > 0) {
		return true;
	}
	const desiredSize = readableByteStreamControllerGetDesiredSize(controller);
	// Assert: desiredSize is not null.
	return desiredSize! > 0;
}

export function setUpReadableStreamBYOBRequest(request: ReadableStreamBYOBRequest, controller: ReadableByteStreamController, view: ArrayBufferView) {
	if (! isReadableByteStreamController(controller)) {
		throw new TypeError();
	}
	if (! ArrayBuffer.isView(view)) {
		throw new TypeError();
	}
	// Assert: !IsDetachedBuffer(view.[[ViewedArrayBuffer]]) is false.

	request[associatedReadableByteStreamController_] = controller;
	request[view_] = view;
}
