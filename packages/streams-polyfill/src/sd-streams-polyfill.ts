import * as sds from "@stardazed/streams";
import { ReadableStreamConstructor, ResponseConstructor, createAdaptedFetch, createAdaptedResponse } from "@stardazed/streams-fetch-adapter";
import { TextDecoderStream, TextEncoderStream } from "@stardazed/streams-text-encoding";

function getGlobal(): Record<string, unknown> | undefined {
	let self;
	if (self === undefined) {
		try {
			self = window;
		}
		catch (e) {}
		if (self === undefined) {
			try {
				// @ts-ignore
				self = global;
			}
			catch (e) {}
		}
	}
	return self;
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

function installStardazedStreams() {
	const globalObject = getGlobal();
	if (! globalObject) {
		// this would be very unusual
		return false;
	}

	if (hasCompleteStreamsImplementation()) {
		// this polyfill is all or nothing, if the full spec as we know it is available then bail
		return false;
	}

	// also try contextual values for fetch types to support polyfilled values in Node
	const nativeFetch = getGlobalOrContextualValue<WindowOrWorkerGlobalScope["fetch"]>("fetch");
	const nativeResponse = getGlobalOrContextualValue<ResponseConstructor>("Response");

	const nativeReadableStream = getGlobalValue<ReadableStreamConstructor>("ReadableStream");

	// only patch fetch types when they are available
	if (nativeFetch && nativeResponse) {
		const adaptedFetch = createAdaptedFetch(nativeFetch, nativeResponse, nativeReadableStream, sds.ReadableStream, sds.internal_readableStreamTee);
		const adaptedResponse = createAdaptedResponse(nativeResponse, nativeReadableStream, sds.ReadableStream, sds.internal_readableStreamTee);

		globalObject["fetch"] = adaptedFetch;
		globalObject["Response"] = adaptedResponse;
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

const overwritten = installStardazedStreams();
installEncodingStreams(overwritten);
