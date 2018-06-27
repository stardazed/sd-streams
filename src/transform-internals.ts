/**
 * streams/transform-internals - internal types and functions for transform streams
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

import * as rs from "./readable-internals";
import * as ws from "./writable-internals";
import * as shared from "./shared-internals";

import { createReadableStream } from "./readable-stream";
import { createWritableStream } from "./writable-stream";

export const state_ = Symbol("transformState_");
export const backpressure_ = Symbol("backpressure_");
export const backpressureChangePromise_ = Symbol("backpressureChangePromise_");
export const readable_ = Symbol("readable_");
export const transformStreamController_ = Symbol("transformStreamController_");
export const writable_ = Symbol("writable_");

export const controlledTransformStream_ = Symbol("controlledTransformStream_");
export const flushAlgorithm_ = Symbol("flushAlgorithm_");
export const transformAlgorithm_ = Symbol("transformAlgorithm_");

// ----

export type TransformFunction = (chunk: any, controller: TransformStreamDefaultController) => void | Promise<void>;
export type TransformAlgorithm = (chunk: any) => Promise<void>;
export type FlushFunction = (controller: TransformStreamDefaultController) => void | Promise<void>;
export type FlushAlgorithm = () => Promise<void>;

// ----

export interface TransformStreamDefaultController {
	readonly desiredSize: number | null;
	enqueue(chunk: any): void;
	error(reason: any): void;
	terminate(): void;

	[controlledTransformStream_]: TransformStream; // The TransformStream instance controlled; also used for the IsTransformStreamDefaultController brand check
	[flushAlgorithm_]: FlushAlgorithm; // A promise - returning algorithm which communicates a requested close to the transformer
	[transformAlgorithm_]: TransformAlgorithm; // A promise - returning algorithm, taking one argument(the chunk to transform), which requests the transformer perform its transformation
}

export interface Transformer {
	start?(controller: TransformStreamDefaultController): void | Promise<void>;
	transform?: TransformFunction;
	flush?: FlushFunction;
	
	readableType?: undefined; // for future spec changes
	writableType?: undefined; // for future spec changes
}

export declare class TransformStream {
	constructor(transformer: Transformer, writableStrategy: shared.StreamStrategy, readableStrategy: shared.StreamStrategy);

	readonly readable: rs.ReadableStream;
	readonly writable: ws.WritableStream;

	[backpressure_]: boolean | undefined; // Whether there was backpressure on [[readable]] the last time it was observed
	[backpressureChangePromise_]: shared.ControlledPromise<void> | undefined; // A promise which is fulfilled and replaced every time the value of[[backpressure]] changes
	[readable_]: rs.ReadableStream; // The ReadableStream instance controlled by this object
	[transformStreamController_]: TransformStreamDefaultController; // A TransformStreamDefaultController created with the ability to control[[readable]] and[[writable]]; also used for the IsTransformStream brand check
	[writable_]: ws.WritableStream; // The WritableStream instance controlled by this object
}

// ---- TransformStream

export function isTransformStream(value: any): value is TransformStream {
	if (value == null || typeof value !== "object") {
		return false;
	}
	return transformStreamController_ in value;
}

export function initializeTransformStream(stream: TransformStream, startPromise: Promise<void>, writableHighWaterMark: number, writableSizeAlgorithm: shared.SizeAlgorithm, readableHighWaterMark: number, readableSizeAlgorithm: shared.SizeAlgorithm) {
	const startAlgorithm = function() {
		return startPromise;
	};
	const writeAlgorithm = function(chunk: any) {
		return transformStreamDefaultSinkWriteAlgorithm(stream, chunk);
	};
	const abortAlgorithm = function(reason: any) {
		return transformStreamDefaultSinkAbortAlgorithm(stream, reason);
	};
	const closeAlgorithm = function() {
		return transformStreamDefaultSinkCloseAlgorithm(stream);
	};
	stream[writable_] = createWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, writableHighWaterMark, writableSizeAlgorithm);

	const pullAlgorithm = function() {
		return transformStreamDefaultSourcePullAlgorithm(stream);
	};
	const cancelAlgorithm = function(reason: any) {
		transformStreamErrorWritableAndUnblockWrite(stream, reason);
		return Promise.resolve(undefined);
	};
	stream[readable_] = createReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, readableHighWaterMark, readableSizeAlgorithm);

	stream[backpressure_] = undefined;
	stream[backpressureChangePromise_] = undefined;
	transformStreamSetBackpressure(stream, true);
	(stream as any)[transformStreamController_] = undefined; // initialize slot for brand-check
}

export function transformStreamError(stream: TransformStream, error: any) {
	rs.readableStreamDefaultControllerError(stream[readable_][rs.readableStreamController_] as rs.ReadableStreamDefaultController, error);
	transformStreamErrorWritableAndUnblockWrite(stream, error);
}

export function transformStreamErrorWritableAndUnblockWrite(stream: TransformStream, error: any) {
	ws.writableStreamDefaultControllerErrorIfNeeded(stream[writable_][ws.writableStreamController_]!, error);
	if (stream[backpressure_]) {
		transformStreamSetBackpressure(stream, false);
	}
}

export function transformStreamSetBackpressure(stream: TransformStream, backpressure: boolean) {
	// Assert: stream.[[backpressure]] is not backpressure.
	if (stream[backpressure_] !== undefined) {
		stream[backpressureChangePromise_]!.resolve(undefined);
	}
	stream[backpressureChangePromise_] = shared.createControlledPromise<void>();
	stream[backpressure_] = backpressure;
}


// ---- TransformStreamDefaultController

export function isTransformStreamDefaultController(value: any): value is TransformStreamDefaultController {
	if (value == null || typeof value !== "object") {
		return false;
	}
	return controlledTransformStream_ in value;
}

export function setUpTransformStreamDefaultController(stream: TransformStream, controller: TransformStreamDefaultController, transformAlgorithm: TransformAlgorithm, flushAlgorithm: FlushAlgorithm) {
	// Assert: ! IsTransformStream(stream) is true.
	// Assert: stream.[[transformStreamController]] is undefined.
	controller[controlledTransformStream_] = stream;
	stream[transformStreamController_] = controller;
	controller[transformAlgorithm_] = transformAlgorithm;
	controller[flushAlgorithm_] = flushAlgorithm;
}

export function transformStreamDefaultControllerEnqueue(controller: TransformStreamDefaultController, chunk: any) {
	const stream = controller[controlledTransformStream_];
	const readableController = stream[readable_][rs.readableStreamController_] as rs.ReadableStreamDefaultController;
	if (! rs.readableStreamDefaultControllerCanCloseOrEnqueue(readableController)) {
		throw new TypeError();
	}
	try {
		rs.readableStreamDefaultControllerEnqueue(readableController, chunk);
	}
	catch (error) {
		transformStreamErrorWritableAndUnblockWrite(stream, error);
		throw stream[readable_][rs.storedError_];
	}
	const backpressure = rs.readableStreamDefaultControllerHasBackpressure(readableController);
	if (backpressure !== stream[backpressure_]) {
		// Assert: backpressure is true.
		transformStreamSetBackpressure(stream, true);
	}
}

export function transformStreamDefaultControllerError(controller: TransformStreamDefaultController, error: any) {
	transformStreamError(controller[controlledTransformStream_], error);
}

export function transformStreamDefaultControllerTerminate(controller: TransformStreamDefaultController) {
	const stream = controller[controlledTransformStream_];
	const readableController = stream[readable_][rs.readableStreamController_] as rs.ReadableStreamDefaultController;
	if (rs.readableStreamDefaultControllerCanCloseOrEnqueue(readableController)) {
		rs.readableStreamDefaultControllerClose(readableController);
	}
	const error = new TypeError("The transform stream has been terminated");
	transformStreamErrorWritableAndUnblockWrite(stream, error);
}


// ---- Transform Sinks

export function transformStreamDefaultSinkWriteAlgorithm(stream: TransformStream, chunk: any) {
	// Assert: stream.[[writable]].[[state]] is "writable".
	const controller = stream[transformStreamController_];
	if (stream[backpressure_]) {
		const backpressureChangePromise = stream[backpressureChangePromise_]!;
		// Assert: backpressureChangePromise is not undefined.
		return backpressureChangePromise.promise.then(_ => {
			const writable = stream[writable_];
			const state = writable[ws.state_];
			if (state === "erroring") {
				throw writable[ws.storedError_];
			}
			// Assert: state is "writable".
			return controller[transformAlgorithm_](chunk);
		});
	}
	return controller[transformAlgorithm_](chunk);
}

export function transformStreamDefaultSinkAbortAlgorithm(stream: TransformStream, reason: any) {
	transformStreamError(stream, reason);
	return Promise.resolve(undefined);
}

export function transformStreamDefaultSinkCloseAlgorithm(stream: TransformStream) {
	const readable = stream[readable_];
	const flushPromise = stream[transformStreamController_][flushAlgorithm_]();
	return flushPromise.then(
		_ => {
			if (readable[rs.state_] === "errored") {
				throw readable[rs.storedError_];
			}
			const readableController = readable[rs.readableStreamController_] as rs.ReadableStreamDefaultController;
			if (rs.readableStreamDefaultControllerCanCloseOrEnqueue(readableController)) {
				rs.readableStreamDefaultControllerClose(readableController);
			}
		},
		error => {
			transformStreamError(stream, error);
			throw readable[rs.storedError_];
		}
	);
}


// ---- Transform Sources

export function transformStreamDefaultSourcePullAlgorithm(stream: TransformStream) {
	// Assert: stream.[[backpressure]] is true.
	// Assert: stream.[[backpressureChangePromise]] is not undefined.
	transformStreamSetBackpressure(stream, false);
	return stream[backpressureChangePromise_]!.promise;
}
