import * as sds from "@stardazed/streams";
import { ReadableStreamConstructor, ResponseConstructor, createAdaptedFetch, createAdaptedResponse, createAdaptedBlob, BlobConstructor } from "@stardazed/streams-fetch-adapter";
import { TextDecoderStream, TextEncoderStream } from "@stardazed/streams-text-encoding";
import { CompressionStream, DecompressionStream } from "@stardazed/streams-compression";

declare global {
	interface ReadableStreamBYOBReadValueResult {
		done: false;
		value: Uint8Array;
	}

	interface ReadableStreamBYOBReader<R = any> extends ReadableStreamGenericReader {
		read(view: ArrayBufferView): Promise<ReadableStreamBYOBReadValueResult | ReadableStreamDefaultReadDoneResult>;
		releaseLock(): void;
	}

	interface ReadableStream {
		getReader(options: { mode?: "byob" }): ReadableStreamBYOBReader;
	}
}

function getGlobal(): any | undefined {
	if (typeof globalThis !== "undefined") {
		return globalThis;
	}
	if (typeof self !== "undefined") {
		return self;
	}
	if (typeof window !== "undefined") {
		return window;
	}
	if (typeof global !== "undefined") {
		return global;
	}
	return undefined;
}

function getGlobalValue<T>(name: string): T | undefined {
	const global = getGlobal();
	let value: unknown;
	if (global !== undefined) {
		value = global[name];
	}
	return value as (T | undefined);
}

function getGlobalOrContextualValue<T>(name: string): T | undefined {
	const global = getGlobal();
	let value: unknown;
	if (global !== undefined) {
		value = global[name];
	}
	if (value === undefined) {
		try {
			// try to use contextual name resolution as final recourse
			value = eval(name); // tslint:disable-line
		}
		catch (e) {}
	}
	return value as (T | undefined);
}

function hasCompleteStreamsImplementation() {
	const rs = getGlobalValue<ReadableStreamConstructor>("ReadableStream");
	const ws = getGlobalValue<object>("WritableStream");
	const ts = getGlobalValue<object>("TransformStream");
	const blqs = getGlobalValue<object>("ByteLengthQueuingStrategy");
	const cqs = getGlobalValue<object>("CountQueuingStrategy");

	const isFunc = (f: unknown): f is Function => typeof f === "function"; // tslint:disable-line:ban-types

	if (! (isFunc(rs) && isFunc(ws) && isFunc(ts) && isFunc(blqs) && isFunc(cqs))) {
		return false;
	}

	// explicitly check for bytes/byob variant of ReadableStream
	try {
		const stream = new rs({ type: "bytes" });
		const reader = stream.getReader({ mode: "byob" });
		if (reader == null || typeof reader !== "object") {
			return false;
		}
	}
	catch (e) {
		// bytes sources or byob readers are not supported
		return false;
	}

	return true;
}

function tryCreateAdaptedBlob(blobCtor: BlobConstructor, streamCtor: ReadableStreamConstructor, override: boolean): BlobConstructor | undefined {
	const test = new blobCtor(["string"]);
	if (override || !("stream" in test)) {
		return createAdaptedBlob(blobCtor, streamCtor, override);
	}
	return undefined;
}

function installStardazedStreams() {
	const globalObject = getGlobal();
	if (! globalObject) {
		// this would be very unusual
		return false;
	}

	// fetch some core constructors
	const nativeBlob = getGlobalValue<BlobConstructor>("Blob");
	const nativeReadableStream = getGlobalValue<ReadableStreamConstructor>("ReadableStream");

	if (hasCompleteStreamsImplementation()) {
		// see if Blob needs to be patched using built-in stream (probably not)
		if (nativeBlob) {
			const adaptedBlob = tryCreateAdaptedBlob(nativeBlob, nativeReadableStream!, false);
			if (adaptedBlob) {
				globalObject["Blob"] = adaptedBlob;
			}
		}

		// this polyfill is all or nothing, if the full spec as we know it is available then bail
		return false;
	}

	// also try contextual values for fetch types to support polyfilled values in Node
	const nativeFetch = getGlobalOrContextualValue<WindowOrWorkerGlobalScope["fetch"]>("fetch");
	const nativeResponse = getGlobalOrContextualValue<ResponseConstructor>("Response");

	// only patch fetch types when they are available
	if (nativeFetch && nativeResponse) {
		const adaptedFetch = createAdaptedFetch(nativeFetch, nativeResponse, nativeReadableStream, sds.ReadableStream, sds.internal_readableStreamTee);
		const adaptedResponse = createAdaptedResponse(nativeResponse, nativeReadableStream, sds.ReadableStream, sds.internal_readableStreamTee);

		globalObject["fetch"] = adaptedFetch;
		globalObject["Response"] = adaptedResponse;
	}
	if (nativeBlob) {
		const adaptedBlob = tryCreateAdaptedBlob(nativeBlob, sds.ReadableStream, true);
		if (adaptedBlob) {
			globalObject["Blob"] = adaptedBlob;
		}
	}

	globalObject["ReadableStream"] = sds.ReadableStream;
	globalObject["WritableStream"] = sds.WritableStream;
	globalObject["TransformStream"] = sds.TransformStream;
	globalObject["ByteLengthQueuingStrategy"] = sds.ByteLengthQueuingStrategy;
	globalObject["CountQueuingStrategy"] = sds.CountQueuingStrategy;

	return true;
}

function installEncodingStreams(forceInstall: boolean) {
	// This step occurs separately from the streams install as we may need to
	// supplement a full streams implementation that does not have these types
	// In addition, if we've installed the base streams, these types MUST be
	// overwritten as well to avoid incompatibilities.
	const globalObject = getGlobal();
	if (! globalObject) {
		// this would be very unusual
		return;
	}
	const nativeTDS = getGlobalValue<TextDecoderStream>("TextDecoderStream");
	if (forceInstall || typeof nativeTDS !== "function") {
		globalObject["TextDecoderStream"] = TextDecoderStream;
	}

	const nativeTES = getGlobalValue<TextEncoderStream>("TextEncoderStream");
	if (forceInstall || typeof nativeTES !== "function") {
		globalObject["TextEncoderStream"] = TextEncoderStream;
	}
}

function installCompressionStreams(forceInstall: boolean) {
	// This step occurs separately from the streams install as we may need to
	// supplement a full streams implementation that does not have these types
	// In addition, if we've installed the base streams, these types MUST be
	// overwritten as well to avoid incompatibilities.
	const globalObject = getGlobal();
	if (!globalObject) {
		// this would be very unusual
		return;
	}
	const nativeCS = getGlobalValue<CompressionStream>("CompressionStream");
	if (forceInstall || typeof nativeCS !== "function") {
		globalObject["CompressionStream"] = CompressionStream;
	}

	const nativeDS = getGlobalValue<DecompressionStream>("DecompressionStream");
	if (forceInstall || typeof nativeDS !== "function") {
		globalObject["DecompressionStream"] = DecompressionStream;
	}
}

const overwritten = installStardazedStreams();
installEncodingStreams(overwritten);
installCompressionStreams(overwritten);
