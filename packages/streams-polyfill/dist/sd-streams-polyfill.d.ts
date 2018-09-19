/**
 * @stardazed/streams-polyfill - drop-in polyfill for Web Streams with fetch and encoding integration
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

/* Types from @stardazed/streams */

interface ReadableStreamController {
	close(): void;
	error(e?: any): void;
	readonly desiredSize: number | null;
}

interface ReadableStreamDefaultController extends ReadableStreamController {
	enqueue(chunk: any): void;
}

interface ReadableByteStreamController extends ReadableStreamController {
	enqueue(chunk: any): void;
	readonly byobRequest: ReadableStreamBYOBRequest | undefined;
}

interface ReadableStreamBYOBRequest {
	respond(bytesWritten: number): void;
	respondWithNewView(view: ArrayBufferView): void;
	readonly view: ArrayBufferView;
}

interface ReadableStreamReaderSD {
	cancel(reason: any): Promise<void>;
	releaseLock(): void;
	readonly closed: Promise<void>;
}

interface ReadableStreamDefaultReader extends ReadableStreamReaderSD {
	read(): Promise<IteratorResult<any>>;
}

interface ReadableStreamBYOBReader extends ReadableStreamReaderSD {
	read(view: ArrayBufferView): Promise<IteratorResult<ArrayBufferView>>;
}

interface ReadableStreamSource<Controller extends ReadableStreamController = ReadableStreamDefaultController> {
	start?(controller: Controller): void | Promise<void>;
	pull?(controller: Controller): void | Promise<void>;
	cancel?(reason?: any): void;
	type?: "bytes" | undefined;
	autoAllocateChunkSize?: number; // only for "bytes" type sources
}

interface PipeToOptions {
	preventClose?: boolean;
	preventAbort?: boolean;
	preventCancel?: boolean;
}

interface StreamTransform {
	readable: ReadableStream;
	writable: WritableStream;
}

interface ReadableStream {
	cancel(reason?: any): Promise<void>;
	getReader(): ReadableStreamDefaultReader;
	getReader(options: { mode: "byob" }): ReadableStreamBYOBReader;
	tee(): ReadableStream[];

	pipeThrough(transform: StreamTransform, options?: PipeToOptions): ReadableStream;
	pipeTo(dest: WritableStream, options?: PipeToOptions): Promise<void>;

	readonly locked: boolean;
}

/*
[AL] Cannot override declared var with a differently shaped object. This will have to be fixed in the TS default lib.

declare var ReadableStream: {
	prototype: ReadableStream;
	new(source?: ReadableStreamSource, strategy?: QueuingStrategy): ReadableStream;
}
*/

// ---- TransformStream

interface TransformStreamDefaultController {
	enqueue(chunk: any): void;
	error(reason: any): void;
	terminate(): void;

	readonly desiredSize: number | null;
}

interface Transformer {
	start?(controller: TransformStreamDefaultController): void | Promise<void>;
	transform?(chunk: any, controller: TransformStreamDefaultController): void | Promise<void>;
	flush?(controller: TransformStreamDefaultController): void | Promise<void>;
	
	readableType?: undefined; // for future spec changes
	writableType?: undefined; // for future spec changes
}

declare class TransformStream {
	constructor(transformer?: Transformer, writableStrategy?: QueuingStrategy, readableStrategy?: QueuingStrategy);

	readonly readable: ReadableStream;
	readonly writable: WritableStream;
}

/* Types from @stardazed/streams-text-encoding */

declare class TextDecoderStream {
	constructor(label?: string, options?: TextDecoderOptions);

	readonly encoding: string;
	readonly fatal: boolean;
	readonly ignoreBOM: boolean;

	readonly readable: ReadableStream;
	readonly writable: WritableStream;
}

declare class TextEncoderStream {
	constructor();

	readonly encoding: string;

	readonly readable: ReadableStream;
	readonly writable: WritableStream;
}
