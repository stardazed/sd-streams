/**
 * streams/transform-stream-default-controller - TransformStreamDefaultController class implementation
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

import * as rs from "./readable-internals";
import * as ts from "./transform-internals";

export class TransformStreamDefaultController<InputType, OutputType> implements ts.TransformStreamDefaultController<InputType, OutputType> {
	[ts.controlledTransformStream_]: ts.TransformStream<InputType, OutputType>;
	[ts.flushAlgorithm_]: ts.FlushAlgorithm;
	[ts.transformAlgorithm_]: ts.TransformAlgorithm<InputType>;

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

	enqueue(chunk: OutputType): void {
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
