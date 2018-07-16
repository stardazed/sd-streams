/**
 * @stardazed/streams-fetch-adapter - patch fetch and Response to work with custom stream implementations
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams-fetch-adapter
 */

interface ReadableStreamReader {
	cancel(reason: any): Promise<void>;
	releaseLock(): void;
	readonly closed: Promise<void>;
}

interface ReadableStreamDefaultReader extends ReadableStreamReader {
	read(): Promise<IteratorResult<any>>;
}

interface ReadableStream {
	cancel(reason?: any): Promise<void>;
	getReader(options?: any): ReadableStreamDefaultReader;
	tee(): ReadableStream[];
	readonly locked: boolean;
}

interface ReadableStreamConstructor {
	// exact types of these params is irrelevant in the context of these public types
	new(source?: any, strategy?: any): ReadableStream;
}

interface ResponseConstructor {
	new(body?: Blob | BufferSource | FormData | ReadableStream | string | null, init?: ResponseInit): Response;
}

export interface AdaptedRequestInit {
	body?: Blob | BufferSource | FormData | ReadableStream | string | null;
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
export type AdaptedFetch = (input?: Request | string, init?: RequestInit) => Promise<Response>;

/**
 * Create and return a fetch function that will add or patch the body property
 * of the Response returned by fetch to return your custom stream instance.
 * @param nativeFetch A reference to the browser native fetch function to patch
 * @param customReadableStream The constructor function of your custom ReadableStream
 */
export declare function createAdaptedFetch(nativeFetch: GlobalFetch["fetch"], nativeReadableStream: ReadableStreamConstructor | undefined, customReadableStream: ReadableStreamConstructor): AdaptedFetch

/**
 * Wrap the Response constructor to add or patch handling of ReadableStream
 * body objects.
 * @param nativeResponse The constructor function of the browser's built in Response class
 * @param nativeReadableStream The constructor function of the browser's built in ReadableStream class, if available
 * @param customReadableStream The constructor function of your custom ReadableStream
 */
export declare function createAdaptedResponse(nativeResponse: ResponseConstructor, nativeReadableStream: ReadableStreamConstructor | undefined, customReadableStream: ReadableStreamConstructor): ResponseConstructor;
