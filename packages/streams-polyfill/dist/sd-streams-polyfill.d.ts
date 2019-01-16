/**
 * @stardazed/streams-polyfill - drop-in polyfill for Web Streams with fetch and encoding integration
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams
 */

// extend PipeOptions interface with signal
declare global {
	interface PipeOptions {
		signal?: AbortSignal;
	}
}
