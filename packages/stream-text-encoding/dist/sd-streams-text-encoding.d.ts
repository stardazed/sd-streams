/**
* @stardazed/streams-text-encoding - implementation of text encoder and decoder streams
* Part of Stardazed
* (c) 2018-Present by @zenmumbler
* https://github.com/stardazed/sd-streams
*/

export class TextDecoderStream {
	constructor(label?: string, options?: TextDecoderOptions);

	readonly encoding: string;
	readonly fatal: boolean;
	readonly ignoreBOM: boolean;

	readonly readable: ReadableStream<string>;
	readonly writable: WritableStream<ArrayBuffer | Uint8Array>;
}

export class TextEncoderStream {
	constructor();

	readonly encoding: string;

	readonly readable: ReadableStream<Uint8Array>;
	readonly writable: WritableStream<string>;
}
