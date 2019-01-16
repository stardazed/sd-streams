Stardazed Web Streams Implementation
====================================
A fully compliant implementation of and polyfill for the
[Web Streams Standard Specification](https://streams.spec.whatwg.org) plus related types
from the [Encoding Standard](https://encoding.spec.whatwg.org).

The implementation is currently fully compliant with all standard updates up to January 2019.

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
As of v3.2, TypeScript has full support for the streams standard types in its
standard library. v3.0.0 of the main streams package and v2.0.0 of the polyfill use
these built-in types and no longer export custom type definitions.

If you have to use older versions of the TypeScript compiler, install version 2.0.0
of the of main streams package or v1.0.7 of the polyfill, they still provide custom
type definitions, which differ slightly from the new official types, but are generally
interchangeable.

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
© 2018-Present by Arthur Langereis - [@zenmumbler](https://twitter.com/zenmumbler)

License
-------
MIT
