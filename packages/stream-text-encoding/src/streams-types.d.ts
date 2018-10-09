/**
 * streams-text-encoding/streams-types - stream types missing from TS
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

interface StreamStrategy {
	size?(chunk?: unknown): number;
	highWaterMark?: number;
}

interface TransformStreamDefaultController<ChunkType> {
	enqueue(chunk: ChunkType): void;
	error(reason: any): void;
	terminate(): void;

	readonly desiredSize: number | null;
}

interface Transformer<TIn, TOut> {
	start?(controller: TransformStreamDefaultController<TOut>): void | Promise<void>;
	transform?(chunk: TIn, controller: TransformStreamDefaultController<TOut>): void | Promise<void>;
	flush?(controller: TransformStreamDefaultController<TOut>): void | Promise<void>;
	
	readableType?: undefined; // for future spec changes
	writableType?: undefined; // for future spec changes
}

class TransformStream<TIn, TOut> {
	constructor(transformer?: Transformer<TIn, TOut>, writableStrategy?: StreamStrategy, readableStrategy?: StreamStrategy);

	readonly readable: ReadableStream;
	readonly writable: WritableStream;
}

interface GenericTransformStream {
	readonly readable: ReadableStream;
	readonly writable: WritableStream;
}
