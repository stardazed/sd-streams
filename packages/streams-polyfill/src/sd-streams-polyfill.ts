import * as sds from "@stardazed/streams";
import { ReadableStreamConstructor, ResponseConstructor, createAdaptedFetch, createAdaptedResponse } from "@stardazed/streams-fetch-adapter";

function getGlobal(): Record<string, any> | undefined {
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
	let value: any;
	if (global !== undefined) {
		value = global[name];
	}
	return value as (T | undefined);
}

function getGlobalOrContextualValue<T>(name: string): T | undefined {
	const global = getGlobal();
	let value: any;
	if (global !== undefined) {
		value = global[name];
	}
	if (value === undefined) {
		try {
			// try a direct fetch of 
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

	const isFunc = (f: any): f is Function => typeof f === "function"; // tslint:disable-line:ban-types

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
		return;
	}

	if (hasCompleteStreamsImplementation()) {
		// this polyfill is all or nothing, if the full spec as we know it is available then bail
		return;
	}

	// also try contextual values for fetch types to support polyfilled values in Node
	const nativeFetch = getGlobalOrContextualValue<GlobalFetch["fetch"]>("fetch");
	const nativeResponse = getGlobalOrContextualValue<ResponseConstructor>("Response");

	const nativeReadableStream = getGlobalValue<ReadableStreamConstructor>("ReadableStream");

	// only path fetch types when they are available
	if (nativeFetch && nativeResponse) {
		const adaptedFetch = createAdaptedFetch(nativeFetch, nativeReadableStream, sds.ReadableStream);
		const adaptedResponse = createAdaptedResponse(nativeResponse, nativeReadableStream, sds.ReadableStream);

		globalObject["fetch"] = adaptedFetch;
		globalObject["Response"] = adaptedResponse;
	}

	globalObject["ReadableStream"] = sds.ReadableStream;
	globalObject["WritableStream"] = sds.WritableStream;
	globalObject["TransformStream"] = sds.TransformStream;
	globalObject["ByteLengthQueuingStrategy"] = sds.ByteLengthQueuingStrategy;
	globalObject["CountQueuingStrategy"] = sds.CountQueuingStrategy;
}

installStardazedStreams();
