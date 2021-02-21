/*
@stardazed/streams-polyfill - drop-in polyfill for Web Streams with fetch and encoding integration
Part of Stardazed
(c) 2018-Present by @zenmumbler
https://github.com/stardazed/sd-streams
*/

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
