sd-streams
==========
This library provides a full implementation of the web streams standard. It has
no dependencies and can be used as a streams testing bed or polyfill in browsers without
(full) support for the streams standard.

It also provides a full set of TypeScript types for the library as an improvement
over the incomplete typings in the TS standard library.

### Compliance
This implementation passes all tests (as specified by late June 2018) in the
[web platform tests](https://github.com/web-platform-tests/wpt/tree/master/streams)
except for the detached buffer tests as explained below.

While this is nice, a number of tests in the suite are aimed mainly at browser engine
internals or ordering of instructions strictly to the letter of the spec.
This implementation may at any point deviate from certain spec tests for legibility or
optimization purposes, but only if it's deemed worthwhile. (Actual browser implementations
already do this as well.)

### Limitations
While the full streams API is implemented, this library's code lives in the client space
and cannot directly be used with other built-in APIs. This includes calling `getReader` on
the `body` of a `fetch` call, which may either not be implemented at all or return a browser
internal `ReadableStream`. Due to implementation details of streams, you cannot mix and
match the types in this implementation with those provided by the browser.

In addition, while the BYOB variant of `ReadableStream` is implemented, buffers are copied
and not transferred as no browser has implemented detached buffers yet, let alone exposed
them to client-level code.

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
