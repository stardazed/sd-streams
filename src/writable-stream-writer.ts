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

		const readyPromise = ws.createControlledPromise<void>();
		const closedPromise = ws.createControlledPromise<void>();
		this[ws.readyPromise_] = readyPromise;
		this[ws.closedPromise_] = closedPromise;

		const state = stream[ws.state_];
		if (state === "writable") {
			if (! ws.writableStreamCloseQueuedOrInFlight(stream) && stream[ws.backpressure_]) {
				// OK Set this.[[readyPromise]] to a new promise.
			}
			else {
				readyPromise.resolve(undefined);
			}
			// OK Set this.[[closedPromise]] to a new promise.
		}
		else if (state === "erroring") {
			readyPromise.reject(stream[ws.storedError_]);
			// OK Set this.[[closedPromise]] to a new promise.
		}
		else if (state === "closed") {
			readyPromise.resolve(undefined);
			closedPromise.resolve(undefined);
		}
		else {
			// Assert: state is "errored".
			const storedError = stream[ws.storedError_];
			readyPromise.reject(storedError);
			closedPromise.reject(storedError);
		}
	}

	abort(reason: any): Promise<void> {
		if (this[ws.ownerWritableStream_] === undefined) {
			return Promise.reject(new TypeError("Writer is not connected to a stream"));
		}
		return ws.writableStreamDefaultWriterAbort(this, reason);
	}

	close(): Promise<void> {
		const stream = this[ws.ownerWritableStream_];
		if (stream === undefined) {
			return Promise.reject(new TypeError("Writer is not connected to a stream"));
		}
		if (ws.writableStreamCloseQueuedOrInFlight(stream)) {
			return Promise.reject(new TypeError());
		}
		return ws.writableStreamDefaultWriterClose(this);
	}

	releaseLock(): void {
		const stream = this[ws.ownerWritableStream_];
		if (stream === undefined) {
			return;
		}
		// Assert: stream.[[writer]] is not undefined.
		ws.writableStreamDefaultWriterRelease(this);
	}

	write(chunk: any): Promise<void> {
		if (this[ws.ownerWritableStream_] === undefined) {
			return Promise.reject(new TypeError("Writer is not connected to a stream"));
		}
		return ws.writableStreamDefaultWriterWrite(this, chunk);
	}

	get closed(): Promise<void> {
		return this[ws.closedPromise_].promise;
	}

	get desiredSize(): number | null {
		if (this[ws.ownerWritableStream_] === undefined) {
			throw new TypeError("Writer is not connected to stream");
		}
		return ws.writableStreamDefaultWriterGetDesiredSize(this);
	}

	get ready(): Promise<void> {
		return this[ws.readyPromise_].promise;
	}
}
