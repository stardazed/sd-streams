/*
streams-compression/compression-stream - transform stream compressing arbitrary data
Part of Stardazed
(c) 2019-Present by @zenmumbler
https://github.com/stardazed/sd-streams
*/

import { Deflater } from "@stardazed/zlib";

const comContext = Symbol("comContext");
const comTransform = Symbol("comTransform");

class CompressionTransformer implements Transformer<BufferSource, Uint8Array> {
	private deflater_: Deflater;

	constructor(deflater: Deflater) {
		this.deflater_ = deflater;
	}

	transform(chunk: BufferSource, controller: TransformStreamDefaultController<Uint8Array>) {
		if (!(chunk instanceof ArrayBuffer || ArrayBuffer.isView(chunk))) {
			throw new TypeError("Input data must be a BufferSource");
		}
		const buffers = this.deflater_.append(chunk);
		for (const buf of buffers) {
			controller.enqueue(buf);
		}
	}

	flush(controller: TransformStreamDefaultController<Uint8Array>) {
		const buffers = this.deflater_.finish();
		for (const buf of buffers) {
			controller.enqueue(buf);
		}
	}
}

export class CompressionStream {
	private [comContext]: Deflater;
	private [comTransform]: TransformStream<BufferSource, Uint8Array>;

	constructor(format: string) {
		if (format !== "deflate" && format !== "gzip") {
			throw new TypeError("format must be one of `deflate`, `gzip`");
		}

		this[comContext] = new Deflater({ format });
		this[comTransform] = new TransformStream(new CompressionTransformer(this[comContext]));
	}

	get readable() {
		return this[comTransform].readable;
	}

	get writable() {
		return this[comTransform].writable;
	}
}
