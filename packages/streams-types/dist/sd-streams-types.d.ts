/**
 * @stardazed/streams-types - Complete type definitions for Web Streams
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

declare global {

// ---- Common

interface QueuingStrategy {
	size?(chunk?: any): number;
	highWaterMark?: number;
}

// ---- WritableStream

interface WritableStreamDefaultController {
	error(e?: any): void;
}

interface WritableStreamDefaultWriter<InputType> {
	abort(reason: any): Promise<void>;
	close(): Promise<void>;
	releaseLock(): void;
	write(chunk: InputType): Promise<void>;

	readonly closed: Promise<void>;
	readonly desiredSize: number | null;
	readonly ready: Promise<void>;
}

interface WritableStreamSink<InputType> {
	start?(controller: WritableStreamDefaultController): void | Promise<void>;
	write?(chunk: InputType, controller: WritableStreamDefaultController): void | Promise<void>;
	close?(): void | Promise<void>;
	abort?(reason?: any): void;

	type?: undefined; // unused, for future revisions
}

class WritableStream<InputType> {
	constructor(underlyingSink?: WritableStreamSink<InputType>, strategy?: QueuingStrategy);
	abort(reason?: any): Promise<void>;
	getWriter(): WritableStreamDefaultWriter<InputType>;

	readonly locked: boolean;
}

// ---- ReadableStream

interface ReadableStreamController {
	close(): void;
	error(e?: any): void;
	readonly desiredSize: number | null;
}

interface ReadableStreamDefaultController<OutputType> extends ReadableStreamController {
	enqueue(chunk: OutputType): void;
}

interface ReadableByteStreamController extends ReadableStreamController {
	enqueue(chunk: ArrayBufferView): void;
	readonly byobRequest: ReadableStreamBYOBRequest | undefined;
}

interface ReadableStreamBYOBRequest {
	respond(bytesWritten: number): void;
	respondWithNewView(view: ArrayBufferView): void;
	readonly view: ArrayBufferView;
}

interface ReadableStreamReaderBase {
	cancel(reason: any): Promise<void>;
	releaseLock(): void;
	readonly closed: Promise<void>;
}

interface ReadableStreamDefaultReader<OutputType> extends ReadableStreamReaderBase {
	read(): Promise<IteratorResult<OutputType>>;
}

interface ReadableStreamBYOBReader extends ReadableStreamReaderBase {
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

interface PipeOptions {
	preventClose?: boolean;
	preventAbort?: boolean;
	preventCancel?: boolean;
}

interface GenericTransformStream<InputType, OutputType> {
	readable: ReadableStream<OutputType>;
	writable: WritableStream<InputType>;
}

interface ReadableStream<OutputType> {
	cancel(reason?: any): Promise<void>;
	getReader(): ReadableStreamDefaultReader<OutputType>;
	getReader(options: { mode: "byob" }): ReadableStreamBYOBReader;
	tee(): ReadableStream<OutputType>[];

	pipeThrough<ResultType>(transform: GenericTransformStream<OutputType, ResultType>, options?: PipeOptions): ReadableStream<ResultType>;
	pipeTo(dest: WritableStream<OutputType>, options?: PipeOptions): Promise<void>;

	readonly locked: boolean;
}

const ReadableStream: {
	new<OutputType>(source?: ReadableStreamSource<OutputType>, strategy?: QueuingStrategy): ReadableStream<OutputType>;
	new<OutputType>(source?: ReadableByteStreamSource, strategy?: QueuingStrategy): ReadableStream<OutputType>;
};

// ---- TransformStream

interface TransformStreamDefaultController<OutputType> {
	enqueue(chunk: OutputType): void;
	error(reason: any): void;
	terminate(): void;

	readonly desiredSize: number | null;
}

interface Transformer<InputType, OutputType> {
	start?(controller: TransformStreamDefaultController<OutputType>): void | Promise<void>;
	transform?(chunk: InputType, controller: TransformStreamDefaultController<OutputType>): void | Promise<void>;
	flush?(controller: TransformStreamDefaultController<OutputType>): void | Promise<void>;
	
	readableType?: undefined; // for future spec changes
	writableType?: undefined; // for future spec changes
}

class TransformStream<InputType, OutputType> {
	constructor(transformer?: Transformer<InputType, OutputType>, writableStrategy?: QueuingStrategy, readableStrategy?: QueuingStrategy);

	readonly readable: ReadableStream<OutputType>;
	readonly writable: WritableStream<InputType>;
}

// ---- Built-in Strategies

class ByteLengthQueuingStrategy implements QueuingStrategy {
	constructor(options: { highWaterMark: number });
	size(chunk: ArrayBufferView): number;
	highWaterMark: number;
}

class CountQueuingStrategy implements QueuingStrategy {
	constructor(options: { highWaterMark: number });
	size(): number;
	highWaterMark: number;
}

}

export { }
