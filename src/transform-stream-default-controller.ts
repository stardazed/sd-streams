import * as rs from "./readable-internals";
import * as ts from "./transform-internals";

export class TransformStreamDefaultController implements ts.TransformStreamDefaultController {
	[ts.controlledTransformStream_]: ts.TransformStream;
	[ts.flushAlgorithm_]: ts.FlushAlgorithm;
	[ts.transformAlgorithm_]: ts.TransformAlgorithm;

	constructor() {
		throw new TypeError();
	}

	get desiredSize(): number | null {
		if (! ts.isTransformStreamDefaultController(this)) {
			throw new TypeError();
		}
		const readableController = this[ts.controlledTransformStream_][ts.readable_][rs.readableStreamController_] as rs.ReadableStreamDefaultController;
		return rs.readableStreamDefaultControllerGetDesiredSize(readableController);

	}

	enqueue(chunk: any): void {
		if (! ts.isTransformStreamDefaultController(this)) {
			throw new TypeError();
		}
		ts.transformStreamDefaultControllerEnqueue(this, chunk);
	}

	error(reason: any): void {
		if (! ts.isTransformStreamDefaultController(this)) {
			throw new TypeError();
		}
		ts.transformStreamDefaultControllerError(this, reason);
	}

	terminate(): void {
		if (! ts.isTransformStreamDefaultController(this)) {
			throw new TypeError();
		}
		ts.transformStreamDefaultControllerTerminate(this);
	}
}
