@stardazed/streams-text-encoding
================================
This package provides an implementation of the `TextEncoderStream` and `TextDecoderStream`
types from the [Encoding Standard](https://encoding.spec.whatwg.org/).

**⚠️ Important**: this is _NOT_ a polyfill. The classes are just normal exports.

👉 If you want an all-in-one polyfill for streams, fetch interop and text encoding streams,
use the ⭐️[Stardazed streams polyfill](https://www.npmjs.com/package/@stardazed/streams-polyfill)⭐️!

Installation
------------
```
npm install @stardazed/streams-text-encoding
pnpm install @stardazed/streams-text-encoding
yarn add @stardazed/streams-text-encoding
```

Usage
-----
```js
import { TextEncoderStream, TextDecoderStream } from "@stardazed/streams-text-encoding";

// encode
const textReadable = /* Get a readable stream that produces string chunks */;
textReadable
    .pipeThrough(new TextEncoderStream()) // no options available
    .pipeTo(byteWritable);

// decode
const byteReadable = /* Get a readable stream that produces binary chunks */;
const decoder = new TextDecoderStream(encoding, options);
byteReadable
    .pipeThrough(decoder)
    .pipeTo(textWritable);
```

The options passed to the TextDecoderStream are identical to those passed to the
`TextDecoder` class. See [MDN's docs](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder/TextDecoder)
for more.

Copyright
---------
© 2018 by Arthur Langereis - [@zenmumbler](https://twitter.com/zenmumbler)

License
-------
MIT
