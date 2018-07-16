Stardazed Web Streams Implementation
====================================
A fully compliant implementation of and polyfill for the
[Web Streams Standard Specification](https://streams.spec.whatwg.org).

This repository is a so-called monorepo, it contains several packages that
together make up a group of related functionality. Currently included are:

👉 [@stardazed/streams](https://www.npmjs.com/package/@stardazed/streams) —
a full implementation of the streams standard with no dependencies that works
in all (reasonably) modern browsers and in Node.

👉 [@stardazed/streams-fetch-adapter](https://www.npmjs.com/package/@stardazed/streams-fetch-adapter) —
helper functions to create custom versions of `fetch` and `Response` types
to enable any (mock) implementation of the streams standard to work directly
with `fetch`, including uploads using streams.

👉 [@stardazed/streams-polyfill](https://www.npmjs.com/package/@stardazed/streams-polyfill) —
a polyfill combining the above two packages for a seamless, drop-in integration
of stardazed streams + fetch in modern browsers and Node.

Copyright
---------
© 2018 by Arthur Langereis - [@zenmumbler](https://twitter.com/zenmumbler)

License
-------
MIT
