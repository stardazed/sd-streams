Stardazed Web Streams Implementation
====================================
A fully compliant implementation of and polyfill for the
[Web Streams Standard Specification](https://streams.spec.whatwg.org) plus related types
from the [Encoding Standard](https://encoding.spec.whatwg.org).

This repository is a so-called monorepo, it contains several packages that
together make up a group of related functionality. Currently included are:

👉 [@stardazed/streams](https://www.npmjs.com/package/@stardazed/streams) —
a full implementation of the streams standard with no dependencies that works
in all (reasonably) modern browsers and in Node.

👉 [@stardazed/streams-fetch-adapter](https://www.npmjs.com/package/@stardazed/streams-fetch-adapter) —
helper functions to create custom versions of `fetch` and `Response` types
to enable any (mock) implementation of the streams standard to work directly
with `fetch`, including uploads using streams.

👉 [@stardazed/streams-text-encoding](https://www.npmjs.com/package/@stardazed/streams-text-encoding) —
an implementation of the `TextDecoderStream` and `TextEncoderStream` from the
Encoding standard, linking the two standards for best compatibility and reusability.

👉 [@stardazed/streams-polyfill](https://www.npmjs.com/package/@stardazed/streams-polyfill) —
a polyfill combining the above three packages for a seamless, drop-in integration
of stardazed streams + fetch + encoding in modern browsers and Node.

Usage with TypeScript
---------------------
Every package comes complete with type declarations and can be used directly in a TS project.
As of v2.0.0 of the `streams` package, its types and the ones for `streams-polyfill` differ in
that the `streams` package uses parameterized types for the chunks going in and/or out where
the polyfill types treat all chunks as `any`.

Reason for this is that the polyfill is meant to supplement the built-in types from the TS
standard lib, which are unparameterized. There is no such limitation for the types of the
`streams` package and I like types of a stream chain to be checked as well, so there you go.

If you do not like this you may opt to install v1.0.7 of the `streams` package instead which
is the last version with non-parameterized stream types:

`(p)npm install @stardazed/streams@1.0.7`

Or use the `streams-polyfill` package instead.

### Example types
```ts
// a readable stream whose reader will yield strings
const readable: ReadableStream<string> = ...;

// transforms strings to Uint8Arrays
const transform: TransformStream<string, Uint8Array> = ...;

// a writable stream that accepts any ArrayBufferView
const writable: WritableStream<ArrayBufferView> = ...;

// compiles
readable.pipeThrough(transform).pipeTo(writable);
```

Copyright
---------
© 2018 by Arthur Langereis - [@zenmumbler](https://twitter.com/zenmumbler)

License
-------
MIT
