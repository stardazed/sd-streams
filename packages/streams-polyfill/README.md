@stardazed/streams-polyfill
===========================
This package provides a full polyfill for the [Web Streams Standard](https://streams.spec.whatwg.org)
for use in browsers, including patching the built-in `fetch` and `Response` types
to support the `body` field for both downloading and uploading. It also provides the
`TextEncoderStream` and `TextDecoderStream` from the [Encoding Standard](https://encoding.spec.whatwg.org/)
and the `CompressionStream` and `DecompressionStream` from the
[Draft Compression Standard](https://wicg.github.io/compression/).

Download size: 26KiB gzipped, 114KiB uncompressed.

Usage
-----
There are two ways to use this package, as a simple `<script>` include or as an import
with side effects.

### Direct include
Use your favourite CDN supplier or host the file yourself. Make sure to have the polyfill
load _before_ any code that uses `ReadableStream`, `fetch` or `Response`. To be safe have
it load as the first script.

```html
<script src="//unpkg.com/@stardazed/streams-polyfill/dist/sd-streams-polyfill.min.js"></script>
```

### Importless import
First add this package to your project with your package manager of choice.

```
pnpm add @stardazed/streams-polyfill
npm install @stardazed/streams-polyfill
yarn add @stardazed/streams-polyfill
```

Then import it in your index.js/ts file, at application startup. Like with the include
method above, make sure this code runs before everything else.

```js
import "@stardazed/streams-polyfill";
```

All stream types are available globally after that point, no further actions are needed.

⚠️ For TypeScript users, you must use TypeScript 3.2 or newer to get type checking. If you
cannot upgrade to 3.2, you can use the older v2.0.0 version of this package that provides
a custom set of types.

API Usage
---------
See the following resources for more info on using the Streams standard.

* The [Web Streams Standard Specification](https://streams.spec.whatwg.org) for documentation,
examples, etc.
* Mozilla's [Streams API site](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)
for a guide through the APIs with examples.

Supported Environments
----------------------
The core streams functionality requires ES6 classes, `Symbol`, `Promise` and
typed arrays to be implemented. Testing has only been done on current browsers but it
should work with Safari 9+, Edge 13+, Firefox 45+ and Chrome 42+. IE is not supported.

Adapting `fetch` to work with streams requires that the browser has native `fetch` and
`Proxy` objects. This comes down to: Safari 10.1+ (iOS 10.3+), Edge 14+, Firefox 52+
and Chrome 54+.

I have not tested older browsers with a `fetch` polyfill. It may work, it may not.
If you try it out, ensure the `fetch` polyfill loads before this one.

The text encoding streams require a compliant `TextEncoder` and `TextDecoder` to be present
either natively or through a polyfill. Browser support: Safari 10.1+, (iOS 10.3+),
Firefox 19+, Chrome 38+. Edge currently does NOT support these interfaces.

The `pipeTo` and `pipeThrough` methods of `ReadableStream` now support a `signal` field
of type `AbortSignal` to abort on ongoing pipe operation. This is fully supported but
requires a native or polyfilled implementation to be present.
Browser support: Safari 11.1+ (iOS 11.1+), Firefox 57+, Chrome 66+, Edge 16+.

### Node
Node (as of January 2019) has no built-in fetch or web streams support. I did not do extensive
tests but this polyfill, when `require()`d, will install all streams types in Node's
`global` object and they then work as expected. Like with browsers, cooperation with any
`fetch` polyfills available has not been tested.

In general, polyfills are not used in Node. If you want to use web streams in Node, consider
using the [Stardazed streams](https://www.npmjs.com/package/@stardazed/streams)
package directly and optionally wrapping any `fetch` implementations you use with the
[streams fetch adapter](https://www.npmjs.com/package/@stardazed/streams-fetch-adapter).

Node versions >= 7 should be sufficient.

Implementation
--------------
This polyfill uses the fully compliant [Stardazed streams](https://www.npmjs.com/package/@stardazed/streams),
[text encoding streams](https://www.npmjs.com/package/@stardazed/streams-text-encoding)
and [compression streams](https://www.npmjs.com/package/@stardazed/streams-compression)
implementations, and the [streams fetch adapter](https://www.npmjs.com/package/@stardazed/streams-fetch-adapter)
to connect the implementations to the current environment.

💡 **NB:** if you have your own `ReadableStream` replacement — including mocks or modifications
of the built-in type — and want to use it with `fetch`, you can use the fetch adapter
to have your code work with `fetch` transparently.


Copyright
---------
© 2018-Present by [@zenmumbler](https://twitter.com/zenmumbler)

License
-------
MIT
