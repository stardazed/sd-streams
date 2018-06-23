import * as rs from "./readable-internals";

export class ReadableStreamDefaultController implements rs.ReadableStreamDefaultController {
	[rs.controlledReadableStream_]: rs.ReadableStream;
	[rs.pullAlgorithm_]: rs.PullAlgorithm;
	[rs.cancelAlgorithm_]: rs.CancelAlgorithm;
	[rs.strategySizeAlgorithm_]: rs.SizeAlgorithm;
	[rs.strategyHWM_]: number;

	[rs.queue_]!: any[];
	[rs.queueTotalSize_]!: number;

	[rs.started_]: boolean;
	[rs.closeRequested_]: boolean;
	[rs.pullAgain_]: boolean;
	[rs.pulling_]: boolean;

	[rs.state_]: rs.ReadableStreamControllerState;

	constructor(stream: rs.ReadableStream, source: rs.ReadableStreamSource, highWaterMark: number, sizeAlgorithm: rs.SizeAlgorithm) {
		this[rs.controlledReadableStream_] = stream;
		rs.resetQueue(this);

		this[rs.started_] = false;
		this[rs.closeRequested_] = false;
		this[rs.pullAgain_] = false;
		this[rs.pulling_] = false;

		this[rs.strategySizeAlgorithm_] = sizeAlgorithm;
		this[rs.strategyHWM_] = highWaterMark;

		this[rs.pullAlgorithm_] = rs.createAlgorithmFromUnderlyingMethod(source, "pull", [this]);
		this[rs.cancelAlgorithm_] = rs.createAlgorithmFromUnderlyingMethod(source, "cancel", []);

		const startResult = source.start ? source.start(this) : undefined;
		Promise.resolve(startResult).then(
			_ => {
				this[rs.started_] = true;
				rs.readableStreamDefaultControllerCallPullIfNeeded(this);
			},
			error => {
				rs.readableStreamDefaultControllerError(this, error);
			}
		);
	}

	get desiredSize() {
		return 0;
	}

	close() {
		if (! rs.readableStreamDefaultControllerCanCloseOrEnqueue(this)) {
			throw new TypeError("Cannot close, the stream is already closing or not readable");
		}
	}

	enqueue(chunk?: any) {
		if (!rs.readableStreamDefaultControllerCanCloseOrEnqueue(this)) {
			throw new TypeError("Cannot enqueue, the stream is closing or not readable");
		}

	}
	error(e?: any) {

	}
}
