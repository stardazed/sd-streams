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

interface TransformStreamDefaultController<OutputType> {
	enqueue(chunk: OutputType): void;
	error(reason: any): void;
	terminate(): void;

	readonly desiredSize: number | null;
}

interface Transformer<InputType, OutputType> {
	start?(controller: TransformStreamDefaultController<OutputType>): void | Promise<void>;
	transform?(chunk: InputType, controller: TransformStreamDefaultController<OutputType>): void | Promise<void>;
	flush?(controller: TransformStreamDefaultController<OutputType>): void | Promise<void>;
	
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
