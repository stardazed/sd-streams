import * as rs from "./readable-internals";
import * as ws from "./writable-internals";
import { ReadableStreamDefaultReader } from "./readable-stream-default-reader";
import { WritableStreamDefaultWriter } from "./writable-stream-writer";

export function readableStreamPipeTo(source: rs.ReadableStream, dest: ws.WritableStream, _options: rs.PipeToOptions) {
	// If ! IsReadableStream(this) is false, return a promise rejected with a TypeError exception.
	// If ! IsWritableStream(dest) is false, return a promise rejected with a TypeError exception.

	// const preventClose = !!options.preventClose;
	// const preventAbort = !!options.preventAbort;
	// const preventCancel = !!options.preventCancel;

	if (rs.isReadableStreamLocked(source)) {
		return Promise.reject(new TypeError("Cannot pipe from a locked stream"));
	}
	if (ws.isWritableStreamLocked(dest)) {
		return Promise.reject(new TypeError("Cannot pipe to a locked stream"));
	}

	// If IsReadableByteStreamController(this.[[readableStreamController]]) is true, let reader be either ! AcquireReadableStreamBYOBReader(this) or ! AcquireReadableStreamDefaultReader(this), at the user agent’s discretion.
	// Otherwise, let reader be ! AcquireReadableStreamDefaultReader(this).
	const reader = new ReadableStreamDefaultReader(source);
	const writer = new WritableStreamDefaultWriter(dest);

	// let shuttingDown = false;
	// let pipeResolve: () => void;
	// let pipeReject: (error: any) => void;
	const promise = rs.createControlledPromise<void>();

	function next() {
		const input = rs.readableStreamDefaultReaderRead(reader);
		const ready = writer[ws.readyPromise_];

		Promise.all([input, ready.promise]).then(
			([{ value, done }]) => {
				if (done) {
					console.info("read stream is done");
					promise.resolve();
				}
				else {
					if (dest[ws.state_] === "writable") {
						ws.writableStreamDefaultWriterWrite(writer, value);
						next();
					}
				}
			},
			(error: any) => {
				console.error("Error during `next`", error);
				throw error;
			}
		);
	}

	next();

	return promise.promise;
}
