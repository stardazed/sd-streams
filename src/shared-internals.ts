export type SizeAlgorithm = (this: void, chunk?: any) => number;

export interface StreamStrategy {
	size?: SizeAlgorithm;
	highWaterMark?: number;
}

// shared symbol private keys
export const state_ = Symbol("state_");
export const closedPromise_ = Symbol("closedPromise_");

// ---------

export function isInteger(value: number) {
	if (! isFinite(value)) { // covers NaN, +Infinity and -Infinity
		return false;
	}
	const absValue = Math.abs(value);
	return Math.floor(absValue) === absValue;
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

export function promiseCall<F extends Function>(f: F, v: object | undefined, args: any[]) { // tslint:disable-line:ban-types
	try {
		const result = Function.prototype.apply.call(f, v, args);
		return Promise.resolve(result);
	}
	catch (err) {
		return Promise.reject(err);
	}
}

export function createAlgorithmFromFunction(func: Function | undefined, extraArgs: any[]) { // tslint:disable-line:ban-types
	if (func === undefined) {
		return () => Promise.resolve(undefined);
	}
	return function(...fnArgs: any[]) {
		return promiseCall(func, undefined, fnArgs.concat(extraArgs));
	};
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
	if (typeof hwm !== "number" || isNaN(hwm) || hwm < 0) {
		throw new RangeError("highWaterMark must be a valid, non-negative integer.");
	}
	return hwm;
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
