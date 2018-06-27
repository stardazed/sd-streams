/**
 * streams/pipe-to - pipeTo algorithm implementation
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

import * as rs from "./readable-internals";
import * as ws from "./writable-internals";
import * as shared from "./shared-internals";
import { ReadableStreamDefaultReader } from "./readable-stream-default-reader";
import { WritableStreamDefaultWriter } from "./writable-stream-default-writer";

export function pipeTo(source: rs.ReadableStream, dest: ws.WritableStream, _options: rs.PipeToOptions) {
	// const preventClose = !!options.preventClose;
	// const preventAbort = !!options.preventAbort;
	// const preventCancel = !!options.preventCancel;

	// If IsReadableByteStreamController(this.[[readableStreamController]]) is true, let reader be either ! AcquireReadableStreamBYOBReader(this) or ! AcquireReadableStreamDefaultReader(this), at the user agent’s discretion.
	// Otherwise, let reader be ! AcquireReadableStreamDefaultReader(this).
	const reader = new ReadableStreamDefaultReader(source);
	const writer = new WritableStreamDefaultWriter(dest);

	// let shuttingDown = false;
	// let pipeResolve: () => void;
	// let pipeReject: (error: any) => void;
	const promise = shared.createControlledPromise<void>();

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
