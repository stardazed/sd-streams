/**
 * @stardazed/streams-types - Complete type definitions for Web Streams
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

// ---- Common

export interface QueuingStrategy {
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

declare class WritableStream<InputType> {
	constructor(underlyingSink?: WritableStreamSink<InputType>, strategy?: QueuingStrategy);
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

export interface ReadableStreamReaderBase {
	cancel(reason: any): Promise<void>;
	releaseLock(): void;
	readonly closed: Promise<void>;
}

export interface ReadableStreamDefaultReader<OutputType> extends ReadableStreamReaderBase {
	read(): Promise<IteratorResult<OutputType>>;
}

export interface ReadableStreamBYOBReader extends ReadableStreamReaderBase {
	read(view: ArrayBufferView): Promise<IteratorResult<ArrayBufferView>>;
}

interface ReadableStreamSource<OutputType> {
	start?(controller: ReadableStreamDefaultController<OutputType>): void | Promise<void>;
	pull?(controller: ReadableStreamDefaultController<OutputType>): void | Promise<void>;
	cancel?(reason?: any): void;
}

interface ReadableByteStreamSource {
	start?(controller: ReadableByteStreamController): void | Promise<void>;
	pull?(controller: ReadableByteStreamController): void | Promise<void>;
	cancel?(reason?: any): void;
	type: "bytes";
	autoAllocateChunkSize?: number;
}

export interface PipeOptions {
	preventClose?: boolean;
	preventAbort?: boolean;
	preventCancel?: boolean;
}

export interface GenericTransformStream<InputType, OutputType> {
	readable: ReadableStream<OutputType>;
	writable: WritableStream<InputType>;
}

declare class ReadableStream<OutputType> {
	constructor(source?: ReadableStreamSource<OutputType>, strategy?: QueuingStrategy);
	constructor(source?: ReadableByteStreamSource, strategy?: QueuingStrategy);

	cancel(reason?: any): Promise<void>;
	getReader(): ReadableStreamDefaultReader<OutputType>;
	getReader(options: { mode: "byob" }): ReadableStreamBYOBReader;
	tee(): ReadableStream<OutputType>[];

	pipeThrough<ResultType>(transform: GenericTransformStream<OutputType, ResultType>, options?: PipeOptions): ReadableStream<ResultType>;
	pipeTo(dest: WritableStream<OutputType>, options?: PipeOptions): Promise<void>;

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

declare class TransformStream<InputType, OutputType> {
	constructor(transformer?: Transformer<InputType, OutputType>, writableStrategy?: QueuingStrategy, readableStrategy?: QueuingStrategy);

	readonly readable: ReadableStream<OutputType>;
	readonly writable: WritableStream<InputType>;
}

// ---- Built-in Strategies

declare class ByteLengthQueuingStrategy implements QueuingStrategy {
	constructor(options: { highWaterMark: number });
	size(chunk: ArrayBufferView): number;
	highWaterMark: number;
}

declare class CountQueuingStrategy implements QueuingStrategy {
	constructor(options: { highWaterMark: number });
	size(): number;
	highWaterMark: number;
}
