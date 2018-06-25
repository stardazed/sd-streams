/**
 * sd-streams/strategies - implementation of the built-in stream strategies
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

import { StreamStrategy } from "./shared-internals";

export class ByteLengthQueuingStrategy implements StreamStrategy {
	highWaterMark: number;

	constructor(options: { highWaterMark: number }) {
		this.highWaterMark = options.highWaterMark;
	}

	size(chunk: any) {
		return chunk.byteLength;
	} 
}

export class CountQueuingStrategy implements StreamStrategy {
	highWaterMark: number;

	constructor(options: { highWaterMark: number }) {
		this.highWaterMark = options.highWaterMark;
	}

	size() {
		return 1;
	} 
}
