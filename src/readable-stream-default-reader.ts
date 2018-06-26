import * as rs from "./readable-internals";

export class ReadableStreamDefaultReader implements rs.ReadableStreamReader {
	[rs.closedPromise_]: rs.ControlledPromise<void>;
	[rs.ownerReadableStream_]: rs.ReadableStream | undefined;
	[rs.readRequests_]: rs.ControlledPromise<IteratorResult<any>>[];

	constructor(stream: rs.ReadableStream) {
		if (! rs.isReadableStream(stream)) {
			throw new TypeError();
		}
		if (rs.isReadableStreamLocked(stream)) {
			throw new TypeError("The stream is locked.");
		}
		rs.readableStreamReaderGenericInitialize(this, stream);
		this[rs.readRequests_] = [];
	}

	get closed(): Promise<void> {
		if (! rs.isReadableStreamDefaultReader(this)) {
			return Promise.reject(new TypeError());
		}
		return this[rs.closedPromise_].promise;
	}

	cancel(reason: any): Promise<void> {
		if (! rs.isReadableStreamDefaultReader(this)) {
			return Promise.reject(new TypeError());
		}
		const stream = this[rs.ownerReadableStream_];
		if (stream === undefined) {
			return Promise.reject(new TypeError("Reader is not associated with a stream"));
		}
		return rs.readableStreamCancel(stream, reason);
	}

	read(): Promise<IteratorResult<any>> {
		if (! rs.isReadableStreamDefaultReader(this)) {
			return Promise.reject(new TypeError());
		}
		if (this[rs.ownerReadableStream_] === undefined) {
			return Promise.reject(new TypeError("Reader is not associated with a stream"));
		}
		return rs.readableStreamDefaultReaderRead(this);
	}

	releaseLock() {
		if (! rs.isReadableStreamDefaultReader(this)) {
			throw new TypeError();
		}
		if (this[rs.ownerReadableStream_] === undefined) {
			return;
		}
		if (this[rs.readRequests_].length !== 0) {
			throw new TypeError("Cannot release a stream with pending read requests");
		}
		rs.readableStreamReaderGenericRelease(this);
	}
}
