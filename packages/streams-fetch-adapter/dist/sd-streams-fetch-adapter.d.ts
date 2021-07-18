/**
 * @stardazed/streams-fetch-adapter - patch fetch and Response to work with custom stream implementations
 * Part of Stardazed
 * (c) 2018-Present by @zenmumbler
 * https://github.com/stardazed/sd-streams-fetch-adapter
 */

interface UnderlyingByteSource {
    cancel?: UnderlyingSourceCancelCallback;
    pull?: UnderlyingSourcePullCallback<ArrayBufferView>;
    start?: UnderlyingSourceStartCallback<ArrayBufferView>;
    type: "bytes";
	autoAllocateChunkSize?: number;
}

interface ByteStreamQueuingStrategy {
	highWaterMark?: number;
	size?: undefined;
}

interface ReadableStreamConstructor {
	prototype: ReadableStream;
	new(underlyingSource: UnderlyingByteSource, strategy?: ByteStreamQueuingStrategy): ReadableStream<Uint8Array>;
	new<R = any>(underlyingSource?: UnderlyingSource<R>, strategy?: QueuingStrategy<R>): ReadableStream<R>;
}

type ReadableStreamTeeFunction = (stream: ReadableStream, cloneForBranch2: boolean) => ReadableStream[];

interface ResponseConstructor {
	new(body?: Blob | BufferSource | FormData | ReadableStream<Uint8Array> | string | null, init?: ResponseInit): Response;
}

export interface AdaptedRequestInit {
	body?: Blob | BufferSource | FormData | ReadableStream<Uint8Array> | string | null;
    cache?: RequestCache;
    credentials?: RequestCredentials;
    headers?: HeadersInit;
    integrity?: string;
    keepalive?: boolean;
    method?: string;
    mode?: RequestMode;
    redirect?: RequestRedirect;
    referrer?: string;
    referrerPolicy?: ReferrerPolicy;
    signal?: AbortSignal;
    window?: any;
}
export type AdaptedFetch = (input: RequestInfo, init?: AdaptedRequestInit) => Promise<Response>;

/**
 * Create and return a fetch function that will add or patch the body property
 * of the Response returned by fetch to return your custom stream instance.
 * @param nativeFetch A reference to the browser native fetch function to patch
 * @param nativeResponse The constructor function of the browser's built in Response class
 * @param nativeReadableStream The constructor function of the browser's built in ReadableStream class, if available
 * @param customReadableStream The constructor function of your custom ReadableStream
 * @param customReadableStreamTee The `ReadableStreamTee` method implementation for the custom ReadableStream
 */
export declare function createAdaptedFetch(
	nativeFetch: WindowOrWorkerGlobalScope["fetch"],
	nativeResponse: ResponseConstructor,
	nativeReadableStream: ReadableStreamConstructor | undefined,
	customReadableStream: ReadableStreamConstructor,
	customReadableStreamTee: ReadableStreamTeeFunction
): AdaptedFetch;

/**
 * Wrap the Response constructor to add or patch handling of ReadableStream body objects.
 * @param nativeResponse The constructor function of the browser's built in Response class
 * @param nativeReadableStream The constructor function of the browser's built in ReadableStream class, if available
 * @param customReadableStream The constructor function of your custom ReadableStream
 * @param customReadableStreamTee The `ReadableStreamTee` method implementation for the custom ReadableStream
 */
export declare function createAdaptedResponse(
	nativeResponse: ResponseConstructor,
	nativeReadableStream: ReadableStreamConstructor | undefined,
	customReadableStream: ReadableStreamConstructor,
	customReadableStreamTee: ReadableStreamTeeFunction
): ResponseConstructor;
