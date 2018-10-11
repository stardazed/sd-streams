/**
 * @stardazed/streams - implementation of the web streams standard
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

// ---- Common

export interface StreamStrategy {
	size?(chunk?: any): number;
	highWaterMark?: number;
}

// ---- WritableStream

export interface WritableStreamDefaultController {
	error(e?: any): void;
}

export interface WritableStreamDefaultWriter<InputType> {
	abort(reason: any): Promise<void>;
	close(): Promise<void>;
	releaseLock(): void;
	write(chunk: InputType): Promise<void>;

	readonly closed: Promise<void>;
	readonly desiredSize: number | null;
	readonly ready: Promise<void>;
}

export interface WritableStreamSink<InputType> {
	start?(controller: WritableStreamDefaultController): void | Promise<void>;
	write?(chunk: InputType, controller: WritableStreamDefaultController): void | Promise<void>;
	close?(): void | Promise<void>;
	abort?(reason?: any): void;

	type?: undefined; // unused, for future revisions
}

export declare class WritableStream<InputType> {
	constructor(underlyingSink?: WritableStreamSink<InputType>, strategy?: StreamStrategy);
	abort(reason?: any): Promise<void>;
	getWriter(): WritableStreamDefaultWriter<InputType>;

	readonly locked: boolean;
}

// ---- ReadableStream

export interface ReadableStreamController {
	close(): void;
	error(e?: any): void;
	readonly desiredSize: number | null;
}

export interface ReadableStreamDefaultController<OutputType> extends ReadableStreamController {
	enqueue(chunk: OutputType): void;
}

export interface ReadableByteStreamController extends ReadableStreamController {
	enqueue(chunk: ArrayBufferView): void;
	readonly byobRequest: ReadableStreamBYOBRequest | undefined;
}

export interface ReadableStreamBYOBRequest {
	respond(bytesWritten: number): void;
	respondWithNewView(view: ArrayBufferView): void;
	readonly view: ArrayBufferView;
}

export interface ReadableStreamReader {
	cancel(reason: any): Promise<void>;
	releaseLock(): void;
	readonly closed: Promise<void>;
}

export interface ReadableStreamDefaultReader<OutputType> extends ReadableStreamReader {
	read(): Promise<IteratorResult<OutputType>>;
}

export interface ReadableStreamBYOBReader extends ReadableStreamReader {
	read(view: ArrayBufferView): Promise<IteratorResult<ArrayBufferView>>;
}

interface ReadableStreamSource<OutputType, Controller extends ReadableStreamController = ReadableStreamDefaultController<OutputType>> {
	start?(controller: Controller): void | Promise<void>;
	pull?(controller: Controller): void | Promise<void>;
	cancel?(reason?: any): void;
	type?: "bytes" | undefined;
	autoAllocateChunkSize?: number; // only for "bytes" type sources
}

export interface PipeToOptions {
	preventClose?: boolean;
	preventAbort?: boolean;
	preventCancel?: boolean;
}

export interface StreamTransform<InputType, OutputType> {
	readable: ReadableStream<OutputType>;
	writable: WritableStream<InputType>;
}

export declare class ReadableStream<OutputType> {
	constructor(source?: ReadableStreamSource<OutputType>, strategy?: StreamStrategy);

	cancel(reason?: any): Promise<void>;
	getReader(): ReadableStreamDefaultReader<OutputType>;
	getReader(options: { mode: "byob" }): ReadableStreamBYOBReader;
	tee(): ReadableStream<OutputType>[];

	pipeThrough<ResultType>(transform: StreamTransform<OutputType, ResultType>, options?: PipeToOptions): ReadableStream<ResultType>;
	pipeTo(dest: WritableStream<OutputType>, options?: PipeToOptions): Promise<void>;

	readonly locked: boolean;
}

// ---- TransformStream

export interface TransformStreamDefaultController<OutputType> {
	enqueue(chunk: OutputType): void;
	error(reason: any): void;
	terminate(): void;

	readonly desiredSize: number | null;
}

export interface Transformer<InputType, OutputType> {
	start?(controller: TransformStreamDefaultController<OutputType>): void | Promise<void>;
	transform?(chunk: InputType, controller: TransformStreamDefaultController<OutputType>): void | Promise<void>;
	flush?(controller: TransformStreamDefaultController<OutputType>): void | Promise<void>;
	
	readableType?: undefined; // for future spec changes
	writableType?: undefined; // for future spec changes
}

export declare class TransformStream<InputType, OutputType> {
	constructor(transformer?: Transformer<InputType, OutputType>, writableStrategy?: StreamStrategy, readableStrategy?: StreamStrategy);

	readonly readable: ReadableStream<OutputType>;
	readonly writable: WritableStream<InputType>;
}

// ---- Built-in Strategies

export declare class ByteLengthQueuingStrategy {
	constructor(options: { highWaterMark: number });
	size(chunk: ArrayBufferView): number;
	highWaterMark: number;
}

export declare class CountQueuingStrategy {
	constructor(options: { highWaterMark: number });
	size(): number;
	highWaterMark: number;
}


// ---- Internal helpers for other standards

/**
 * Internal function for use in other web standard implementations.
 * Don't use this unless you are implementing web standards.
 * @private
 */
export function internal_readableStreamTee<T>(stream: ReadableStream<T>, cloneForBranch2: boolean): ReadableStream<T>[];
