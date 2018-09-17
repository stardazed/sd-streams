/**
 * streams-text-encoding/streams-types - stream types missing from TS
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

interface StreamStrategy {
	size?(chunk?: any): number;
	highWaterMark?: number;
}

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

class TransformStream {
	constructor(transformer?: Transformer, writableStrategy?: StreamStrategy, readableStrategy?: StreamStrategy);

	readonly readable: ReadableStream;
	readonly writable: WritableStream;
}

interface GenericTransformStream {
	readonly readable: ReadableStream;
	readonly writable: WritableStream;
}
