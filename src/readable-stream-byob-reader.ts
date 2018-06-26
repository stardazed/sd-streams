import * as rs from "./readable-internals";

export class ReadableStreamBYOBReader implements rs.ReadableStreamReader {
	[rs.closedPromise_]: rs.ControlledPromise<void>;
	[rs.ownerReadableStream_]: rs.ReadableStream | undefined;
	[rs.readIntoRequests_]: rs.ControlledPromise<IteratorResult<ArrayBufferView>>[];

	constructor(stream: rs.ReadableStream) {
		if (! rs.isReadableStream(stream)) {
			throw new TypeError();
		}
		if (! rs.isReadableByteStreamController(stream[rs.readableStreamController_])) {
			throw new TypeError();
		}
		if (rs.isReadableStreamLocked(stream)) {
			throw new TypeError("The stream is locked.");
		}
		rs.readableStreamReaderGenericInitialize(this, stream);
		this[rs.readIntoRequests_] = [];
	}

	get closed(): Promise<void> {
		if (! rs.isReadableStreamBYOBReader(this)) {
			return Promise.reject(new TypeError());
		}
		return this[rs.closedPromise_].promise;
	}

	cancel(reason: any): Promise<void> {
		if (! rs.isReadableStreamBYOBReader(this)) {
			return Promise.reject(new TypeError());
		}
		const stream = this[rs.ownerReadableStream_];
		if (stream === undefined) {
			return Promise.reject(new TypeError());
		}
		return rs.readableStreamCancel(stream, reason);
	}

	read(view: ArrayBufferView): Promise<IteratorResult<ArrayBufferView>> {
		if (! rs.isReadableStreamBYOBReader(this)) {
			return Promise.reject(new TypeError());
		}
		if (this[rs.ownerReadableStream_] === undefined) {
			return Promise.reject(new TypeError());
		}
		if (! ArrayBuffer.isView(view)) {
			return Promise.reject(new TypeError());
		}
		// If ! IsDetachedBuffer(view.[[ViewedArrayBuffer]]) is true, return a promise rejected with a TypeError exception.
		if (view.byteLength === 0) {
			return Promise.reject(new TypeError());
		}
		return rs.readableStreamBYOBReaderRead(this, view);
	}

	releaseLock(): void {
		if (! rs.isReadableStreamBYOBReader(this)) {
			throw new TypeError();
		}
		if (this[rs.ownerReadableStream_] === undefined) {
			throw new TypeError();
		}
		if (this[rs.readIntoRequests_].length > 0) {
			throw new TypeError();
		}
		rs.readableStreamReaderGenericRelease(this);	
	}
}
