/**
 * @stardazed/streams-fetch-adapter - patch fetch and Response to work with custom stream implementations
 * Part of Stardazed
 * (c) 2018-Present by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams-fetch-adapter
 */

// Minimal declarations needed to have things compile
interface ReadableStreamConstructor {
	prototype: ReadableStream;
	new(underlyingSource: UnderlyingByteSource, strategy?: { highWaterMark?: number, size?: undefined }): ReadableStream<Uint8Array>;
	new<R = any>(underlyingSource?: UnderlyingSource<R>, strategy?: QueuingStrategy<R>): ReadableStream<R>;
}

type ReadableStreamTeeFunction = (stream: ReadableStream, cloneForBranch2: boolean) => ReadableStream[];

type FetchBody = Blob | BufferSource | FormData | ReadableStream | string | null;
type AdaptedFetch = (input: Request | string, init?: RequestInit) => Promise<Response>;

interface ResponseConstructor {
	new(body?: FetchBody, init?: ResponseInit): Response;
}

/**
 * Create a ReadableStream whose underlying source is another ReadableStream.
 * This is used to convert browser-native ReadableStream objects to custom ones
 * and vice-versa.
 * @param rs The ReadableStream to wrap
 * @param streamCtor The ReadableStream constructor to wrap rs with
 */
function wrapReadableStream(rs: ReadableStream, streamCtor: ReadableStreamConstructor) {
	let reader: ReadableStreamDefaultReader;
	return new streamCtor({
		start(controller) {
			reader = rs.getReader();
			reader.closed.catch(
				error => { controller.error(error); }
			);
		},
		pull(controller) {
			return reader.read().then(
				({value, done}) => {
					if (! done) {
						controller.enqueue(value);
					}
					else {
						controller.close();
					}
				},
				error => {
					controller.error(error);
				}
			);
		},
		cancel(reason) {
			reader.cancel(reason);
		}
	});
}

/**
 * Return the value of the Content-Type header from a value representing
 * a sequence of HTTP headers. Returns the empty string if the header
 * is not present.
 */
function getMIMETypeFromHeadersInit(headers: HeadersInit | undefined) {
	const CONTENT_TYPE = "Content-Type";

	if (headers === undefined) {
		return "";
	}
	else if (headers instanceof Headers) {
		return headers.get(CONTENT_TYPE) || "";
	}
	else if (Array.isArray(headers)) {
		const header = headers.find(pair => Array.isArray(pair) && pair.length === 2 && pair[0] === CONTENT_TYPE);
		return header ? header[1] : "";
	}
	return headers[CONTENT_TYPE] || "";
}

/**
 * If a caller of fetch tries to upload a ReadableStream, then first read the stream
 * completely and update the fetch options with the resulting Blob.
 * @param init The RequestInit options, if given, for the native fetch call
 * @param nativeReadableStream The constructor function of the browser's built in ReadableStream class, if available
 * @param customReadableStream The constructor function of your custom ReadableStream
 */
function resolveRequestInitStream(init: RequestInit | undefined, nativeReadableStream: ReadableStreamConstructor | undefined, customReadableStream: ReadableStreamConstructor): Promise<RequestInit | undefined> {
	if (init === undefined) {
		return Promise.resolve(init);
	}

	// FIXME: no browser currently supports stream uploads, but we should check for
	// support anyway so we don't downgrade upload streaming to upload-at-once
	// Add a check here once the first user agent adds support.

	const requestBody = init.body as FetchBody | undefined;
	let requestStream: ReadableStream | undefined;
	if (requestBody && typeof requestBody === "object") {
		if (nativeReadableStream && requestBody instanceof nativeReadableStream) {
			requestStream = requestBody;
		}
		else if (requestBody instanceof customReadableStream) {
			requestStream = requestBody;
		}
	}
	
	if (! requestStream) {
		return Promise.resolve(init);
	}

	const mimeType = getMIMETypeFromHeadersInit(init.headers);
	const reader = requestStream.getReader();
	return readAllBytesFromStream(reader, mimeType).then(
		blob => {
			init.body = blob;
			return init;
		}
	);
}

/**
 * Create and return a fetch function that will add or patch the body property
 * of the Response returned by fetch to return your custom stream instance.
 * @param nativeFetch A reference to the browser native fetch function to patch
 * @param nativeResponse The constructor function of the browser's built in Response class
 * @param nativeReadableStream The constructor function of the browser's built in ReadableStream class, if available
 * @param customReadableStream The constructor function of your custom ReadableStream
 * @param customReadableStreamTee The `ReadableStreamTee` method implementation for the custom ReadableStream
 */
export function createAdaptedFetch(
	nativeFetch: WindowOrWorkerGlobalScope["fetch"],
	nativeResponse: ResponseConstructor,
	nativeReadableStream: ReadableStreamConstructor | undefined,
	customReadableStream: ReadableStreamConstructor,
	customReadableStreamTee: ReadableStreamTeeFunction
): AdaptedFetch {
	return function fetch(input: Request | string, init?: RequestInit) {
		// if the body passed into the request init is a ReadableStream (either native or custom)
		// then first read it out completely before we pass it onto the native fetch as a Blob
		return resolveRequestInitStream(init, nativeReadableStream, customReadableStream).then(
			resolvedInit => nativeFetch.call(undefined, input, resolvedInit).then(
				(response: any) => {
					if (! ("body" in response)) {
						// No streams integration in Fetch at all, just add a simple
						// non-streaming stream to the Response object
						response.body = new customReadableStream({
							pull(controller) {
								return response.arrayBuffer().then(
									(ab: ArrayBuffer) => {
										controller.enqueue(new Uint8Array(ab));
										controller.close();
									},
									(error: any) => {
										controller.error(error);
									}
								);
							}
						});

						response.clone = function() {
							const [body1, body2] = customReadableStreamTee(response.body, /* cloneForBranch2: */true);
							response.body = body1;
							return createResponseProxyWithStreamBody(nativeResponse, customReadableStreamTee, body2, init);
						};
					}
					else {
						// Body is exposed as a ReadableStream, we cannot replace the
						// body property as it is non-configurable, so we wrap it in a Proxy.
						const origResponse = response;
						let wrappedBody: ReadableStream;
						let customClone: () => Response;

						response = new Proxy(origResponse, {
							get(target, prop, _receiver) {
								let value: any;
								if (prop === "body") {
									if (wrappedBody === undefined) {
										wrappedBody = wrapReadableStream(origResponse.body, customReadableStream);
									}
									value = wrappedBody;
								}
								else if (prop === "clone") {
									if (customClone === undefined) {
										// the response.body accessor here will pass through this Proxy to do the right thing
										customClone = function() {
											const [body1, body2] = customReadableStreamTee(response.body, /* cloneForBranch2: */true);
											wrappedBody = body1;
											return createResponseProxyWithStreamBody(nativeResponse, customReadableStreamTee, body2, init);
										};
									}
									value = customClone;
								}
								else {
									value = target[prop];
								}
								
								if (typeof value === "function") {
									return function(...args: any[]) {
										return value.apply(target, args);
									};
								}
								return value;
							},
						});
					}
					
					return response;
				}
			)
		);
	};
}

/**
 * Read all bytes from a ReadableStream passed as body to the constructor of
 * Response.
 * @see https://fetch.spec.whatwg.org/#concept-read-all-bytes-from-readablestream
 * @param reader The reader obtained from the Response's body
 * @param mimeType MIME type for the resulting data
 * @returns a promise to a Blob containing all the data from the stream
 */
function readAllBytesFromStream(reader: ReadableStreamDefaultReader, mimeType: string) {
	return new Promise<Blob>((resolve, reject) => {
		const byteBlocks: Uint8Array[] = [];

		function completeRead() {
			if (byteBlocks.length === 0) {
				byteBlocks.push(new Uint8Array(0));
			}
			const blob = new Blob(byteBlocks, { type: mimeType });
			resolve(blob);
		}

		function readNext() {
			reader.read().then(
				({ value, done }) => {
					if (done) {
						completeRead();
					}
					else {
						if (value instanceof Uint8Array) {
							byteBlocks.push(value);
							readNext();
						}
						else {
							reject(new TypeError("A ReadableStream body must only yield Uint8Array values"));
						}
					}
				},
				error => {
					reject(error);
				}
			);
		}				
		readNext();
	});
}

/**
 * Return a proxy Response object to add support for ReadableStream bodies.
 * Used if the native implementation of the Response class does not support
 * providing a ReadableStream as the body.
 * @param nativeResponse The constructor function of the browser's built in Response class
 * @param body The ReadableStream passed to the Response's constructor as body
 * @param init The ResponseInit options passed to the Response's constructor
 */
function createResponseProxyWithStreamBody(nativeResponse: ResponseConstructor, customReadableStreamTee: ReadableStreamTeeFunction, body: ReadableStream, init?: ResponseInit): Response {
	const tempResponse = new nativeResponse("fake", init);
	const mimeType = getMIMETypeFromHeadersInit(tempResponse.headers);
	let finalResponse: Promise<Response> | undefined;
	let bodyUsed = false;

	function getFinalResponse() {
		if (finalResponse === undefined) {
			finalResponse = new Promise<Response>((resolve, reject) => {
				bodyUsed = true;
				// consume the body - https://fetch.spec.whatwg.org/#concept-body-consume-body
				if (body.locked) {
					return reject(new TypeError("The ReadableStream is locked"));
				}
				const reader = body.getReader();
				readAllBytesFromStream(reader, mimeType).then(
					blob => {
						// let the native Response class handle the final handling of the bytes
						resolve(new nativeResponse(blob, init));
					}
				)
				.catch(error => {
					reject(error);
				});
			});
		}
		return finalResponse;
	}

	return new class Response {
		get type() { return tempResponse.type; }
		get url() { return tempResponse.url; }
		get redirected() { return tempResponse.redirected; }
		get status() { return tempResponse.status; }
		get ok() { return tempResponse.ok; }
		get statusText() { return tempResponse.statusText; }
		get headers() { return tempResponse.headers; }

		clone() {
			const [body1, body2] = customReadableStreamTee(body, /* cloneForBranch2: */true);
			body = body1;
			return createResponseProxyWithStreamBody(nativeResponse, customReadableStreamTee, body2, init);
		}

		// Body mixin
		get body() { return body as any; }
		get bodyUsed() { return bodyUsed; }

		arrayBuffer() { return getFinalResponse().then(r => r.arrayBuffer()); }
		blob() { return getFinalResponse().then(r => r.blob()); }
		formData() { return getFinalResponse().then(r => r.formData()); }
		json() { return getFinalResponse().then(r => r.json()); }
		text() { return getFinalResponse().then(r => r.text()); }
	}() as Response;
}

/**
 * Wrap the Response constructor to add or patch handling of ReadableStream
 * body objects.
 * @param nativeResponse The constructor function of the browser's built in Response class
 * @param nativeReadableStream The constructor function of the browser's built in ReadableStream class, if available
 * @param customReadableStream The constructor function of your custom ReadableStream
 * @param customReadableStreamTee The `ReadableStreamTee` method implementation for the custom ReadableStream
 */
export function createAdaptedResponse(
	nativeResponse: ResponseConstructor,
	nativeReadableStream: ReadableStreamConstructor | undefined,
	customReadableStream: ReadableStreamConstructor,
	customReadableStreamTee: ReadableStreamTeeFunction
): ResponseConstructor {
	const wrappedResponse = function(body?: any, init?: ResponseInit) {
		if (body instanceof customReadableStream) {
			if (nativeReadableStream === undefined || !("body" in nativeResponse)) {
				return createResponseProxyWithStreamBody(nativeResponse, customReadableStreamTee, body, init);
			}
			body = wrapReadableStream(body, nativeReadableStream);
		}
		return new nativeResponse(body, init);
	};
	wrappedResponse.prototype = nativeResponse.prototype;
	return wrappedResponse as any;
}
