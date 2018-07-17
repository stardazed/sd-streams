/**
 * streams/queue-mixin - internal queue operations for stream controllers
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

import { Queue, QueueImpl } from "./queue";
import { isFiniteNonNegativeNumber } from "./shared-internals";

export const queue_ = Symbol("queue_");
export const queueTotalSize_ = Symbol("queueTotalSize_");

export interface QueueElement<V> {
	value: V;
	size: number;
}

export interface QueueContainer<V> {
	[queue_]: Queue<QueueElement<V>>;
	[queueTotalSize_]: number;
}

export interface ByteQueueContainer {
	[queue_]: Queue<{ buffer: ArrayBufferLike, byteOffset: number, byteLength: number }>;
	[queueTotalSize_]: number;
}

export function dequeueValue<V>(container: QueueContainer<V>) {
	// Assert: container has[[queue]] and[[queueTotalSize]] internal slots.
	// Assert: container.[[queue]] is not empty.
	const pair = container[queue_].shift()!;
	const newTotalSize = container[queueTotalSize_] - pair.size;
	container[queueTotalSize_] = Math.max(0, newTotalSize); // < 0 can occur due to rounding errors.
	return pair.value;
}

export function enqueueValueWithSize<V>(container: QueueContainer<V>, value: V, size: number) {
	// Assert: container has[[queue]] and[[queueTotalSize]] internal slots.
	if (! isFiniteNonNegativeNumber(size)) {
		throw new RangeError("Chunk size must be a non-negative, finite numbers");
	}
	container[queue_].push({ value, size });
	container[queueTotalSize_] += size;
}

export function peekQueueValue<V>(container: QueueContainer<V>) {
	// Assert: container has[[queue]] and[[queueTotalSize]] internal slots.
	// Assert: container.[[queue]] is not empty.
	return container[queue_].front()!.value;
}

export function resetQueue<V>(container: ByteQueueContainer | QueueContainer<V>) {
	container[queue_] = new QueueImpl<any>();
	// const q = [] as any;
	// q.front = function() { return this[0]; };
	// container[queue_] = q;

	container[queueTotalSize_] = 0;
}
