import * as ws from "./writable-internals";

export class WritableStreamDefaultWriter implements ws.WritableStreamDefaultWriter {
	[ws.ownerWritableStream_]: ws.WritableStream | undefined;
	[ws.readyPromise_]: ws.ControlledPromise<void>;
	[ws.closedPromise_]: ws.ControlledPromise<void>;

	constructor(stream: ws.WritableStream) {
		// If! IsWritableStream(stream) is false, throw a TypeError exception.
		if (ws.isWritableStreamLocked(stream)) {
			throw new TypeError("Stream is already locked");
		}
		this[ws.ownerWritableStream_] = stream;
		stream[ws.writer_] = this;

		const state = stream[ws.state_];
		if (state === "writable") {
			// If ! WritableStreamCloseQueuedOrInFlight(stream) is false and stream.[[backpressure]] is true,
				// set this.[[readyPromise]] to a new promise.
			// Otherwise, set this.[[readyPromise]] to a promise resolved with undefined.
			// Set this.[[closedPromise]] to a new promise.
		}
		else if (state === "erroring") {
			// Set this.[[readyPromise]] to a promise rejected with stream.[[storedError]].
			// Set this.[[readyPromise]].[[PromiseIsHandled]] to true.
			// Set this.[[closedPromise]] to a new promise.
		}
		else if (state === "closed") {
			// Set this.[[readyPromise]] to a promise resolved with undefined.
			// Set this.[[closedPromise]] to a promise resolved with undefined.
		}
		else {
			// Assert: state is "errored".
			// Let storedError be stream.[[storedError]].
			// Set this.[[readyPromise]] to a promise rejected with storedError.
			// Set this.[[readyPromise]].[[PromiseIsHandled]] to true.
			// Set this.[[closedPromise]] to a promise rejected with storedError.
			// Set this.[[closedPromise]].[[PromiseIsHandled]] to true.
		}
	}

	abort(reason: any): Promise<void> {

	}

	close(): Promise<void> {

	}

	releaseLock(): void {

	}

	write(chunk: any): Promise<void> {

	}

	get closed(): Promise<void> {

	}

	get desiredSize(): number {

	}

	get ready(): Promise<void> {

	}
}
