import { StreamStrategy, state_ } from "./shared-internals";
export * from "./shared-internals";

export const backpressure_ = Symbol("backpressure_");
export const closeRequest_ = Symbol("closeRequest_");
export const inFlightWriteRequest_ = Symbol("inFlightWriteRequest_");
export const inFlightCloseRequest_ = Symbol("inFlightCloseRequest_");
export const pendingAbortRequest_ = Symbol("pendingAbortRequest_");
export const storedError_ = Symbol("storedError_");
export const writableStreamController_ = Symbol("writableStreamController_");
export const writer_ = Symbol("writer_");
export const writeRequests_ = Symbol("writeRequests_");

// ----

export interface WritableStreamController {
	readonly desiredSize: number | null;
	close(): void;
	error(e?: any): void;
}

// ----

export interface WritableStreamWriter {

}

// ----

export type StartFunction = (controller: WritableStreamController) => void | Promise<void>;

export type WritableStreamState = "writable" | "errored";

export interface WritableStreamSink {
	start?: StartFunction;
	write?(chunk: any, controller: WritableStreamController): void | Promise<void>;
	close?(): void | Promise<void>;
	abort?(reason?: any): void;

	type?: undefined; // unused, for future revisions
}

export declare class WritableStream {
	constructor(underlyingSink?: WritableStreamSink, strategy?: StreamStrategy);

	readonly locked: boolean;
	abort(reason?: any): Promise<void>;
	getWriter(): WritableStreamWriter;

	[state_]: WritableStreamState;
}

// ----------------------

