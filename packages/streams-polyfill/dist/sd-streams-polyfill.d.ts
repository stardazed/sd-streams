/*
@stardazed/streams-polyfill - drop-in polyfill for Web Streams with fetch and encoding integration
Part of Stardazed
(c) 2018-Present by @zenmumbler
https://github.com/stardazed/sd-streams
*/

interface ReadableStreamBYOBReadValueResult {
    done: false;
    value: Uint8Array;
}

interface ReadableStreamBYOBReader<R = any> extends ReadableStreamGenericReader {
    read(view: ArrayBufferView): Promise<ReadableStreamBYOBReadValueResult | ReadableStreamDefaultReadDoneResult>;
    releaseLock(): void;
}

interface ReadableStream {
	getReader(options: { mode?: "byob" }): ReadableStreamBYOBReader;
}

// there are no official types yet for the compression streams, so provide them here
// all other types covered by this polyfill are available from the standard TS types

declare class DecompressionStream {
	constructor(format: string);

	readonly readable: ReadableStream<BufferSource>;
	readonly writable: WritableStream<Uint8Array>;
}

declare class CompressionStream {
	constructor(format: string);

	readonly readable: ReadableStream<BufferSource>;
	readonly writable: WritableStream<Uint8Array>;
}
