/*
streams-compression/decompression-stream - transform stream expanding compressed data
Part of Stardazed
(c) 2019-Present by Arthur Langereis - @zenmumbler
https://github.com/stardazed/sd-streams
*/

import { Inflater } from "@stardazed/zlib";

const decContext = Symbol("decContext");
const decTransform = Symbol("decTransform");

class DecompressionTransformer implements Transformer<BufferSource, Uint8Array> {
	private inflater_: Inflater;

	constructor(inflater: Inflater) {
		this.inflater_ = inflater;
	}

	transform(chunk: BufferSource, controller: TransformStreamDefaultController<Uint8Array>) {
		if (!(chunk instanceof ArrayBuffer || ArrayBuffer.isView(chunk))) {
			throw new TypeError("Input data must be a BufferSource");
		}
		const buffers = this.inflater_.append(chunk);
		for (const buf of buffers) {
			controller.enqueue(buf);
		}
	}

	flush(_controller: TransformStreamDefaultController<Uint8Array>) {
		const result = this.inflater_.finish();
		if (! result.success) {
			if (! result.complete) {
				throw new Error("Unexpected EOF during decompression");
			}
			if (result.checksum === "mismatch") {
				throw new Error("Data integrity check failed");
			}
			if (result.fileSize === "mismatch") {
				throw new Error("Data size check failed");
			}
			throw new Error("Decompression error");
		}
	}
}

export class DecompressionStream {
	private [decContext]: Inflater;
	private [decTransform]: TransformStream<BufferSource, Uint8Array>;

	constructor(format: string) {
		if (format !== "deflate" && format !== "gzip") {
			throw new TypeError("format must be one of `deflate`, `gzip`");
		}

		this[decContext] = new Inflater();
		this[decTransform] = new TransformStream(new DecompressionTransformer(this[decContext]));
	}

	get readable() {
		return this[decTransform].readable;
	}

	get writable() {
		return this[decTransform].writable;
	}
}
