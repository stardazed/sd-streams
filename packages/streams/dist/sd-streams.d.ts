/**
 * @stardazed/streams - implementation of the web streams standard
 * Part of Stardazed
 * (c) 2018-Present by @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

// Amend TS global types with missing properties

declare global {
	interface WritableStreamDefaultController {
		readonly abortReason: any;
		readonly signal: AbortSignal;
	}
}

export interface UnderlyingByteSource {
    cancel?: UnderlyingSourceCancelCallback;
    pull?: UnderlyingSourcePullCallback<Uint8Array>;
    start?: UnderlyingSourceStartCallback<Uint8Array>;
    type: "bytes";
	autoAllocateChunkSize?: number;
}

export interface ByteStreamQueuingStrategy {
	highWaterMark?: number;
}

// Stream Types

export declare const ReadableStream: {
	prototype: ReadableStream;
	new(underlyingSource: UnderlyingByteSource, strategy?: ByteStreamQueuingStrategy): ReadableStream<Uint8Array>;
	new<R = any>(underlyingSource?: UnderlyingSource<R>, strategy?: QueuingStrategy<R>): ReadableStream<R>;
};

export declare const WritableStream: {
	prototype: WritableStream;
	new<W = any>(underlyingSink?: UnderlyingSink<W>, strategy?: QueuingStrategy<W>): WritableStream<W>;
};

export declare const TransformStream: {
	prototype: TransformStream;
	new<I = any, O = any>(transformer?: Transformer<I, O>, writableStrategy?: QueuingStrategy<I>, readableStrategy?: QueuingStrategy<O>): TransformStream<I, O>;
};

// Built-in Strategies

export declare class ByteLengthQueuingStrategy {
	constructor(options: { highWaterMark: number });
	size(chunk: ArrayBufferView): number;
	highWaterMark: number;
}

export declare class CountQueuingStrategy {
	constructor(options: { highWaterMark: number });
	size(): number;
	highWaterMark: number;
}

// Internal helpers for other standards

/**
 * Internal function for use in other web standard implementations.
 * Don't use this unless you are implementing web standards.
 * @private
 */
export function internal_readableStreamTee<T>(stream: ReadableStream<T>, cloneForBranch2: boolean): ReadableStream<T>[];
