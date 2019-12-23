@stardazed/streams-compression
==============================
This package provides am implementation of compression streams
types from the [Draft Compression Standard](https://wicg.github.io/compression/).

**⚠️ Important**: this is _NOT_ a polyfill. The classes are just normal exports.

👉 If you want an all-in-one polyfill for streams, fetch interop, text encoding and compression streams,
use the ⭐️[Stardazed streams polyfill](https://www.npmjs.com/package/@stardazed/streams-polyfill)⭐️!

Installation
------------
```
pnpm add @stardazed/streams-compression
npm install @stardazed/streams-compression
yarn add @stardazed/streams-compression
```

Usage
-----
```js
import { DecompressionStream } from "@stardazed/streams-compression";

// expand deflated data
const byteReadable = /* Get a readable stream that produces binary chunks */;
const decompressor = new DecompressionStream("deflate");
byteReadable
    .pipeThrough(decompressor)
    .pipeTo(byteWritable); /* Stream that accepts Uint8Array chunks */
```

```js
import { CompressionStream } from "@stardazed/streams-compression";

// compress arbitrary data
const byteReadable = /* Get a readable stream that produces binary chunks */;
const compressor = new CompressionStream("gzip");
byteReadable
    .pipeThrough(compressor)
    .pipeTo(byteWritable); /* Stream that accepts Uint8Array chunks */
```

Copyright
---------
© 2019-Present by Arthur Langereis - [@zenmumbler](https://twitter.com/zenmumbler)

License
-------
MIT
