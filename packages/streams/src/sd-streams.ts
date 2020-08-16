/**
 * @stardazed/streams - implementation of the web streams standard
 * Part of Stardazed
 * (c) 2018-Present by @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

export { SDReadableStream as ReadableStream } from "./readable-stream";
export { WritableStream } from "./writable-stream";
export { TransformStream } from "./transform-stream";
export { ByteLengthQueuingStrategy, CountQueuingStrategy } from "./strategies";

// only for linked web standard implementations
export {
	createReadableStream as internal_createReadableStream,
	createReadableByteStream as internal_createReadableByteStream,
	readableStreamTee as internal_readableStreamTee
} from "./readable-stream";
