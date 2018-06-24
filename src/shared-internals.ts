export type SizeAlgorithm = (this: void, chunk?: any) => number;

export interface StreamStrategy {
	size?: SizeAlgorithm;
	highWaterMark?: number;
}

// shared symbol private keys
export const state_ = Symbol("state_");
export const closedPromise_ = Symbol("closedPromise_");

// ---------

export function invokeOrNoop<O extends object, P extends keyof O>(o: O, p: P, args: any[]) {
	// Assert: O is not undefined.
	// Assert: IsPropertyKey(P) is true.
	// Assert: args is a List.
	const method: Function | undefined = (o as any)[p]; // tslint:disable-line:ban-types
	if (method === undefined) {
		return undefined;
	}
	return method.apply(o, args);
}

export function promiseCall<F extends Function>(f: F, v: object | undefined, args: any[]) { // tslint:disable-line:ban-types
	try {
		const result = f.apply(v, args);
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

export function validateAndNormalizeHighWaterMark(value: any) {
	const highWaterMark = parseInt(value, 10);
	if (isNaN(highWaterMark) || highWaterMark < 0) {
		throw new RangeError("highWaterMark must be a valid, positive integer.");
	}
	return highWaterMark;
}

export function makeSizeAlgorithmFromSizeFunction(sizeFn: undefined | ((chunk: any) => number)): SizeAlgorithm {
	return function(chunk: any) {
		if (typeof sizeFn === "function") {
			return sizeFn(chunk);
		}
		return 1;
	};
}

// ----

export interface ControlledPromise<V> {
	resolve(value?: V): void;
	reject(error: any): void;
	promise: Promise<V>;
}

export function createControlledPromise<V>(): ControlledPromise<V> {
	const conProm = {} as ControlledPromise<V>;
	conProm.promise = new Promise<V>(function(resolve, reject) {
		conProm.resolve = resolve;
		conProm.reject = reject;
	});
	return conProm;
}
