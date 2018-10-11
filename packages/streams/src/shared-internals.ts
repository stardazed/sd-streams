/**
 * streams/shared-internals - common types and methods for streams
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

// common stream fields

export const state_ = Symbol("state_");
export const storedError_ = Symbol("storedError_");

// ---------

/** An error can be anything, but internally we use `unknown` as we don't want to operate on error values */
export type ErrorResult = unknown;

// ---------

export type SizeAlgorithm = (this: void, chunk?: any) => number;

export interface StreamStrategy {
	size?: SizeAlgorithm;
	highWaterMark?: number;
}

// ---------

export function isInteger(value: number) {
	if (! isFinite(value)) { // covers NaN, +Infinity and -Infinity
		return false;
	}
	const absValue = Math.abs(value);
	return Math.floor(absValue) === absValue;
}

export function isFiniteNonNegativeNumber(value: unknown) {
	if (! (typeof value === "number" && isFinite(value))) { // covers NaN, +Infinity and -Infinity
		return false;
	}
	return value >= 0;
}

export function invokeOrNoop<O extends object, P extends keyof O>(o: O, p: P, args: any[]) {
	// Assert: O is not undefined.
	// Assert: IsPropertyKey(P) is true.
	// Assert: args is a List.
	const method: Function | undefined = (o as any)[p]; // tslint:disable-line:ban-types
	if (method === undefined) {
		return undefined;
	}
	return Function.prototype.apply.call(method, o, args);
}

export function cloneArrayBuffer(srcBuffer: ArrayBufferLike, srcByteOffset: number, srcLength: number, cloneConstructor: ArrayBufferConstructor | SharedArrayBufferConstructor): InstanceType<typeof cloneConstructor> {
	// this function fudges the return type but SharedArrayBuffer is disabled for a while anyway
	return srcBuffer.slice(srcByteOffset, srcByteOffset + srcLength) as InstanceType<typeof cloneConstructor>;
}

export function transferArrayBuffer(buffer: ArrayBufferLike) {
	// This would in a JS engine context detach the buffer's backing store and return
	// a new ArrayBuffer with the same backing store, invalidating `buffer`,
	// i.e. a move operation in C++ parlance.
	// Sadly ArrayBuffer.transfer is yet to be implemented by a single browser vendor.
	return buffer.slice(0); // copies instead of moves
}

export function copyDataBlockBytes(toBlock: ArrayBufferLike, toIndex: number, fromBlock: ArrayBufferLike, fromIndex: number, count: number) {
	new Uint8Array(toBlock, toIndex, count).set(new Uint8Array(fromBlock, fromIndex, count));
}

// helper memoisation map for object values
// weak so it doesn't keep memoized versions of old objects indefinitely.
const objectCloneMemo = new WeakMap<object, object>();

let sharedArrayBufferSupported_: boolean | undefined;
function supportsSharedArrayBuffer(): boolean {
	if (sharedArrayBufferSupported_ === undefined) {
		try {
			new SharedArrayBuffer(16);
			sharedArrayBufferSupported_ = true;
		}
		catch (e) {
			sharedArrayBufferSupported_ = false;
		}
	}
	return sharedArrayBufferSupported_;
}

/**
 * Implement a method of value cloning that is reasonably close to performing `StructuredSerialize(StructuredDeserialize(value))`
 * from the HTML standard. Used by the internal `readableStreamTee` method to clone values for connected implementations.
 * @see https://html.spec.whatwg.org/multipage/structured-data.html#structuredserializeinternal
 */
export function cloneValue(value: any): any {
	const valueType = typeof value;
	switch (valueType) {
		case "number":
		case "string":
		case "boolean":
		case "undefined":
		// @ts-ignore
		case "bigint":
			return value;
		case "object": {
			if (objectCloneMemo.has(value)) {
				return objectCloneMemo.get(value);
			}
			if (value === null) {
				return value;
			}
			if (value instanceof Date) {
				return new Date(value.valueOf());
			}
			if (value instanceof RegExp) {
				return new RegExp(value);
			}
			if (supportsSharedArrayBuffer() && value instanceof SharedArrayBuffer) {
				return value;
			}
			if (value instanceof ArrayBuffer) {
				const cloned = cloneArrayBuffer(value, 0, value.byteLength, ArrayBuffer);
				objectCloneMemo.set(value, cloned);
				return cloned;
			}
			if (ArrayBuffer.isView(value)) {
				const clonedBuffer = cloneValue(value.buffer) as ArrayBufferLike;
				// Use DataViewConstructor type purely for type-checking, can be a DataView or TypedArray.
				// They use the same constructor signature, only DataView has a length in bytes and TypedArrays
				// use a length in terms of elements, so we adjust for that.
				let length: number;
				if (value instanceof DataView) {
					length = value.byteLength;
				}
				else {
					length = (value as Uint8Array).length;
				}
				return new (value.constructor as DataViewConstructor)(clonedBuffer, value.byteOffset, length);
			}
			if (value instanceof Map) {
				const clonedMap = new Map();
				objectCloneMemo.set(value, clonedMap);
				value.forEach((v, k) => clonedMap.set(k, cloneValue(v)));
				return clonedMap;
			}
			if (value instanceof Set) {
				const clonedSet = new Map();
				objectCloneMemo.set(value, clonedSet);
				value.forEach((v, k) => clonedSet.set(k, cloneValue(v)));
				return clonedSet;
			}
			
			// generic object
			const clonedObj = {} as any;
			objectCloneMemo.set(value, clonedObj);
			const sourceKeys = Object.getOwnPropertyNames(value);
			for (const key of sourceKeys) {
				clonedObj[key] = cloneValue(value[key]);
			}
			return clonedObj;
		}
		case "symbol":
		case "function":
		default:
			throw new DOMException("Uncloneable value in stream", "DataCloneError");
	}
}

export function promiseCall<F extends Function>(f: F, v: object | undefined, args: any[]) { // tslint:disable-line:ban-types
	try {
		const result = Function.prototype.apply.call(f, v, args);
		return Promise.resolve(result);
	}
	catch (err) {
		return Promise.reject(err);
	}
}

export function createAlgorithmFromUnderlyingMethod<O extends object, K extends keyof O>(obj: O, methodName: K, extraArgs: any[]) {
	const method = obj[methodName];
	if (method === undefined) {
		return () => Promise.resolve(undefined);
	}
	if (typeof method !== "function") {
		throw new TypeError(`Field "${methodName}" is not a function.`);
	}
	return function(...fnArgs: any[]) {
		return promiseCall(method, obj, fnArgs.concat(extraArgs));
	};
}

/*
Deprecated for now, all usages replaced by readableStreamCreateReadResult

function createIterResultObject<T>(value: T, done: boolean): IteratorResult<T> {
	return { value, done };
}
*/

export function validateAndNormalizeHighWaterMark(hwm: unknown) {
	const highWaterMark = Number(hwm);
	if (isNaN(highWaterMark) || highWaterMark < 0) {
		throw new RangeError("highWaterMark must be a valid, non-negative integer.");
	}
	return highWaterMark;
}

export function makeSizeAlgorithmFromSizeFunction(sizeFn: undefined | ((chunk: any) => number)): SizeAlgorithm {
	if (typeof sizeFn !== "function" && typeof sizeFn !== "undefined") {
		throw new TypeError("size function must be undefined or a function");
	}
	return function(chunk: any) {
		if (typeof sizeFn === "function") {
			return sizeFn(chunk);
		}
		return 1;
	};
}

// ----

export const enum ControlledPromiseState {
	Pending,
	Resolved,
	Rejected
}

export interface ControlledPromise<V> {
	resolve(value?: V): void;
	reject(error: ErrorResult): void;
	promise: Promise<V>;
	state: ControlledPromiseState;
}

export function createControlledPromise<V>(): ControlledPromise<V> {
	const conProm = {
		state: ControlledPromiseState.Pending
	} as ControlledPromise<V>;
	conProm.promise = new Promise<V>(function(resolve, reject) {
		conProm.resolve = function(v?: V) { conProm.state = ControlledPromiseState.Resolved; resolve(v); };
		conProm.reject = function(e?: ErrorResult) { conProm.state = ControlledPromiseState.Rejected; reject(e); };
	});
	return conProm;
}
