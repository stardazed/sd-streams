/**
* @stardazed/streams-compression - implementation of compressiom streams
* Part of Stardazed
* (c) 2019-Present by Arthur Langereis - @zenmumbler
* https://github.com/stardazed/sd-streams
*/

export class DecompressionStream {
	constructor(format: string);

	readonly readable: ReadableStream<BufferSource>;
	readonly writable: WritableStream<Uint8Array>;
}

export class CompressionStream {
	constructor(format: string);

	readonly readable: ReadableStream<BufferSource>;
	readonly writable: WritableStream<Uint8Array>;
}
