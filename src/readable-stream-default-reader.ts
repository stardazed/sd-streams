import * as rs from "./readable-internals";

export class ReadableStreamDefaultReader implements rs.ReadableStreamReader {
	constructor(stream: rs.ReadableStream) {
		if (rs.isReadableStreamLocked(stream)) {
			throw new TypeError("The stream is locked.");
		}
		rs.readableStreamReaderGenericInitialize(this, stream);
		this[rs.readRequests_] = [];
	}

	get closed() {
		return this[rs.closedPromise_].promise;
	}

	cancel(reason: any) {
		const stream = this[rs.ownerReadableStream_];
		if (stream === undefined) {
			throw new TypeError("Reader is not associated with a stream");
		}
		return rs.readableStreamCancel(stream, reason);
	}

	releaseLock() {
		if (this[rs.ownerReadableStream_] === undefined) {
			return;
		}
		if (this[rs.readRequests_].length !== 0) {
			throw new TypeError("Cannot release a stream with pending read requests");
		}
		rs.readableStreamReaderGenericRelease(this);
	}

	read(): Promise<IteratorResult<any>> {
		// If! IsReadableStreamDefaultReader(this) is false, return a promise rejected with a TypeError exception.
		if (this[rs.ownerReadableStream_] === undefined) {
			return Promise.reject(new TypeError("Reader is not associated with a stream"));
		}
		return rs.readableStreamDefaultReaderRead(this);
	}

	[rs.closedPromise_]: rs.ControlledPromise<void>;
	[rs.ownerReadableStream_]: rs.ReadableStream | undefined;

	[rs.readRequests_]: any[];
}

/*
export class ReadableStreamBYOBReader implements rs.ReadableStreamReader {
	constructor(stream: rs.ReadableStream);

	readonly closed: boolean;
	cancel(reason: any): void;
	releaseLock(): void;
	read(view: ArrayBuffer): Promise<void>;

	[rs.ownerReadableStream_]: rs.ReadableStream;
	[rs.closedPromise_]: rs.ControlledPromise<void>;

	[rs.readIntoRequests_]: any[];
}
*/
