sd-streams
==========
This library provides a full implementation of the web streams standard. It has
no dependencies and can be used as a streams testing bed or polyfill in browsers without
(full) support for the streams standard.

It also provides a full set of TypeScript types for the library as an improvement
over the incomplete typings in the TS standard library.

### Limitations
While the full streams API is implemented, because it is written as a client library
it cannot directly be used with other APIs, such as calling `getReader` for the `body`
of a `fetch` call, that may either not be implemented at all or return a browser internal
`ReadableStream`. Due to implementation details of streams, you cannot mix and match
the types in this implementation with those provided by the browser.

In addition, while the BYOB variant of `ReadableStream` is implemented, buffers are copied
and not transferred as no browser has implemented detached buffers yet, let alone exposed
them client-level code.

Installation
------------
**⚠️ Important**: This package is distributed as an ES2015 module and is intended
for use in browsers, not in NodeJS per se. Browser-specific types may be used.

`npm install @stardazed/streams`<br>
`pnpm install @stardazed/streams`<br>
`yarn add @stardazed/streams`

Usage
-----
See the [Web Streams Standard Specification](https://streams.spec.whatwg.org) for
documentation, examples, etc.

Copyright
---------
© 2018 by Arthur Langereis - [@zenmumbler](https://twitter.com/zenmumbler)

License
-------
MIT
