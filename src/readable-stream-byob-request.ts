import * as rs from "./readable-internals";

export class ReadableStreamBYOBRequest {
	[rs.associatedReadableByteStreamController_]: rs.ReadableByteStreamController | undefined;
	[rs.view_]: ArrayBufferView | undefined;

	constructor() {
		throw new TypeError();
	}

	get view(): ArrayBufferView {
		if (! rs.isReadableStreamBYOBRequest(this)) {
			throw new TypeError();
		}
		return this[rs.view_]!;
	}

	respond(bytesWritten: number) {
		if (! rs.isReadableStreamBYOBRequest(this)) {
			throw new TypeError();
		}
		if (this[rs.associatedReadableByteStreamController_] === undefined) {
			throw new TypeError();
		}
		// If! IsDetachedBuffer(this.[[view]].[[ViewedArrayBuffer]]) is true, throw a TypeError exception.
		return rs.readableByteStreamControllerRespond(this[rs.associatedReadableByteStreamController_]!, bytesWritten);
	}

	respondWithNewView(view: ArrayBufferView) {
		if (! rs.isReadableStreamBYOBRequest(this)) {
			throw new TypeError();
		}
		if (this[rs.associatedReadableByteStreamController_] === undefined) {
			throw new TypeError();
		}
		if (! ArrayBuffer.isView(view)) {
			throw new TypeError("view parameter must be a TypedArray");
		}
		// If! IsDetachedBuffer(view.[[ViewedArrayBuffer]]) is true, throw a TypeError exception.
		return rs.readableByteStreamControllerRespondWithNewView(this[rs.associatedReadableByteStreamController_]!, view);
	}
}
