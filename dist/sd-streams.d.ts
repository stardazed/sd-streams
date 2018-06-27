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

export interface WritableStreamDefaultWriter {
	abort(reason: any): Promise<void>;
	close(): Promise<void>;
	releaseLock(): void;
	write(chunk: any): Promise<void>;

	readonly closed: Promise<void>;
	readonly desiredSize: number | null;
	readonly ready: Promise<void>;
}

export interface WritableStreamSink {
	start?(controller: WritableStreamDefaultController): void | Promise<void>;
	write?(chunk: any, controller: WritableStreamDefaultController): void | Promise<void>;
	close?(): void | Promise<void>;
	abort?(reason?: any): void;

	type?: undefined; // unused, for future revisions
}

export declare class WritableStream {
	constructor(underlyingSink?: WritableStreamSink, strategy?: StreamStrategy);
	abort(reason?: any): Promise<void>;
	getWriter(): WritableStreamDefaultWriter;

	readonly locked: boolean;
}

// ---- ReadableStream

export interface ReadableStreamController {
	readonly desiredSize: number | null;
	close(): void;
	error(e?: any): void;
}

export interface ReadableStreamDefaultController extends ReadableStreamController {
	enqueue(chunk: any): void;
}

export interface ReadableByteStreamController extends ReadableStreamController {
	enqueue(chunk: any): void;
	readonly byobRequest: ReadableStreamBYOBRequest | undefined;
}

export interface ReadableStreamBYOBRequest {
	readonly view: ArrayBufferView;
	respond(bytesWritten: number): void;
	respondWithNewView(view: ArrayBufferView): void;
}

export interface ReadableStreamReader {
	readonly closed: Promise<void>;
	cancel(reason: any): Promise<void>;
	releaseLock(): void;
}

export interface ReadableStreamDefaultReader extends ReadableStreamReader {
	read(): Promise<IteratorResult<any>>;
}

export interface ReadableStreamBYOBReader extends ReadableStreamReader {
	read(view: ArrayBufferView): Promise<IteratorResult<ArrayBufferView>>;
}

interface ReadableStreamSource<Controller extends ReadableStreamController = ReadableStreamDefaultController> {
	type?: "bytes" | undefined;
	autoAllocateChunkSize?: number; // only for "bytes" type sources
	start?(controller: Controller): void | Promise<void>;
	pull?(controller: Controller): void | Promise<void>;
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

export declare class ReadableStream {
	constructor(source?: ReadableStreamSource, strategy?: StreamStrategy);

	cancel(reason?: any): Promise<void>;
	getReader(): ReadableStreamDefaultReader;
	getReader(options: { mode: "byob" }): ReadableStreamBYOBReader;
	tee(): ReadableStream[];

	pipeThrough(transform: StreamTransform, options?: PipeToOptions): ReadableStream;
	pipeTo(dest: WritableStream, options?: PipeToOptions): Promise<void>;

	readonly locked: boolean;
}

// ---- TransformStream

export interface TransformStreamDefaultController {
	enqueue(chunk: any): void;
	error(reason: any): void;
	terminate(): void;

	readonly desiredSize: number | null;
}

export interface Transformer {
	start?(controller: TransformStreamDefaultController): void | Promise<void>;
	transform?(chunk: any, controller: TransformStreamDefaultController): void | Promise<void>;
	flush?(controller: TransformStreamDefaultController): void | Promise<void>;
	
	readableType?: undefined; // for future spec changes
	writableType?: undefined; // for future spec changes
}

export declare class TransformStream {
	constructor(transformer?: Transformer, writableStrategy?: StreamStrategy, readableStrategy?: StreamStrategy);

	readonly readable: ReadableStream;
	readonly writable: WritableStream;
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
