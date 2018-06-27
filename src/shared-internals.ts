/**
 * streams/shared-internals - common types and methods for streams
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

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

export function isFiniteNonNegativeNumber(value: any) {
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

export function createIterResultObject(value: any, done: boolean) {
	return { value, done };
}

export function validateAndNormalizeHighWaterMark(hwm: any) {
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
	reject(error: any): void;
	promise: Promise<V>;
	state: ControlledPromiseState;
}

export function createControlledPromise<V>(): ControlledPromise<V> {
	const conProm = {
		state: ControlledPromiseState.Pending
	} as ControlledPromise<V>;
	conProm.promise = new Promise<V>(function(resolve, reject) {
		conProm.resolve = function(v?: V) { conProm.state = ControlledPromiseState.Resolved; resolve(v); };
		conProm.reject = function(e?: any) { conProm.state = ControlledPromiseState.Rejected; reject(e); };
	});
	return conProm;
}
