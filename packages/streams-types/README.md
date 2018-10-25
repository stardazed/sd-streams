@stardazed/streams-types
========================
Provides a full set of TypeScript types for the [Web Streams Standard](https://streams.spec.whatwg.org).
This adds to and improves the predefined types and also makes the stream objects generic by
parameterizing them by their in/out chunk types.

Usage
-----

```ts
import { ReadableStream, WritableStream, TransformStream } from "@stardazed/streams-types";

let rs: ReadableStream<string>; // readable that yields strings
let ws: WritableStream<number>: // writable that accepts numbers
let ts: TransformStream<string, Uint8Array>; // transform that accepts strings and yields Uint8Arrays
```

See the d.ts file for all interfaces and classes.

Keep in mind that these are only the types and not an implementation. Most runtimes do not yet provide
a full implementation of the streams standard. Try [SD Streams](https://npmjs.com/package/@stardazed/streams)
for a normal import or [SD Streams Polyfill](https://npmjs.com/package/@stardazed/streams-polyfill)
for a polyfill including full `fetch` integration.

Copyright
---------
© 2018 by Arthur Langereis - [@zenmumbler](https://twitter.com/zenmumbler)

License
-------
MIT
