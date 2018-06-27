/**
 * streams/pipe-to - pipeTo algorithm implementation
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

import * as rs from "./readable-internals";
import * as ws from "./writable-internals";
import * as shared from "./shared-internals";
import * as q from "./queue-mixin";
import { ReadableStreamDefaultReader } from "./readable-stream-default-reader";
import { WritableStreamDefaultWriter } from "./writable-stream-default-writer";

export function pipeTo(source: rs.ReadableStream, dest: ws.WritableStream, options: rs.PipeToOptions) {
	const preventClose = !!options.preventClose;
	const preventAbort = !!options.preventAbort;
	const preventCancel = !!options.preventCancel;

	let shuttingDown = false;
	const promise = shared.createControlledPromise<void>();

	// If IsReadableByteStreamController(this.[[readableStreamController]]) is true, let reader be either ! AcquireReadableStreamBYOBReader(this) or ! AcquireReadableStreamDefaultReader(this), at the user agent’s discretion.
	// Otherwise, let reader be ! AcquireReadableStreamDefaultReader(this).
	const reader = new ReadableStreamDefaultReader(source);
	const writer = new WritableStreamDefaultWriter(dest);

	reader[rs.closedPromise_].promise.then(
		_ => {
			if (! preventClose) {
				shutDown(() => ws.writableStreamDefaultWriterCloseWithErrorPropagation(writer));
			}
			else {
				shutDown();
			}
		},
		error => {
			if (! preventAbort) {
				shutDown(() => ws.writableStreamAbort(dest, error), error);
			}
			else {
				shutDown(undefined, error);
			}
		}
	);

	writer[ws.closedPromise_].promise.then(
		_ => {
			// Assert: no chunks have been read or written.
			const destClosed = new TypeError();
			if (! preventCancel) {
				shutDown(() => rs.readableStreamCancel(source, destClosed), destClosed);
			}
			else {
				shutDown(undefined, destClosed);
			}
		},
		error => {
			// If preventCancel is false, shutdown with an action of ! ReadableStreamCancel(this, dest.[[storedError]]) and with dest.[[storedError]].
			if (! preventCancel) {
				shutDown(() => rs.readableStreamCancel(source, error), error);
			}
			else {
				shutDown(undefined, error);
			}
		}
	);

	function flushRemainder() {
		if (dest[ws.state_] === "writable" && (! ws.writableStreamCloseQueuedOrInFlight(dest))) {
			const readController = source[rs.readableStreamController_] as rs.ReadableStreamDefaultController;
			const readQueue = readController[q.queue_];

			while (readQueue.length && dest[ws.state_] === "writable") {
				const chunk = q.dequeueValue(readController);
				ws.writableStreamDefaultWriterWrite(writer, chunk);
			}
			return Promise.all(dest[ws.writeRequests_]).then(_ => undefined);
		}
		else {
			return Promise.resolve();
		}
	}

	function shutDown(action?: () => Promise<void>, error?: any) {
		flushRemainder().then(_ => {
			if (! shuttingDown) {
				shuttingDown = true;
				if (action === undefined) {
					action = () => Promise.resolve();
				}
				action().then(
					_ => finalize(error),
					newError => finalize(newError)
				);
			}
		});
	}

	function finalize(error?: any) {
		ws.writableStreamDefaultWriterRelease(writer);
		rs.readableStreamReaderGenericRelease(reader);
		if (error) {
			promise.reject(error);
		}
		else {
			promise.resolve(undefined);
		}
	}

	function next() {
		const input = rs.readableStreamDefaultReaderRead(reader);
		const ready = writer[ws.readyPromise_].promise;

		Promise.all([input, ready]).then(
			([{ value, done }]) => {
				if (done) {
					shutDown();
				}
				else {
					// prevent an error if dest errored or closed during the read
					if (dest[ws.state_] === "writable") {
						ws.writableStreamDefaultWriterWrite(writer, value);
						next();
					}
				}
			},
			(error: any) => {
				shutDown(undefined, error);
			}
		);
	}

	next();

	return promise.promise;
}
