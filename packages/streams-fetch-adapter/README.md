@stardazed/streams-fetch-adapter
================================
This package provides helper functions to create adapted versions of a runtime's
native `fetch` function and `Response` class to work with `ReadableStream`
implementations other than the built-in one.

If the runtime does not support `ReadableStream` at all, the provided custom
implementation will be used to add support for streams to both `fetch` and
`Response` transparently.

Support is also added to `fetch` to allow a `ReadableStream` for the `body` to
send to the server, but unlike the `fetch` spec describes, it does not send
the data incrementally to the server. Instead it reads the entire stream and
then sends it as a `Blob` body. Upload streaming must be implemented by the
user-agent and cannot be simulated.

**⚠️ Important**: this is _NOT_ a polyfill. This package only provides helper
functions that can be used to make adapted types for a streams implementation.

👉 If you want a polyfill for the [Stardazed streams](https://www.npmjs.com/package/@stardazed/streams)
implementation, use the ⭐️[Stardazed streams polyfill](https://www.npmjs.com/package/@stardazed/streams-polyfill)⭐️.

Installation
------------
Pick your preferred package provider program:

```
npm install @stardazed/streams-fetch-adapter
pnpm install @stardazed/streams-fetch-adapter
yarn add @stardazed/streams-fetch-adapter
```

Usage
-----
Use this package if you want to adapt `fetch` and `Response` to support your custom
`ReadableStream` implementation, this may be for things like mocks or modified versions
of built-in streams or for a full replacement, like [Stardazed streams](https://www.npmjs.com/package/@stardazed/streams).

You only need to adapt the `Response` class if you want to manually construct a `Response`
with your custom `ReadableStream` instance as the body. If you just want to use your
implementation for a `Response` returned from `fetch` you only need to adapt `fetch`.

```ts
import { createAdaptedFetch, createAdaptedResponse } from "@stardazed/streams-fetch-adapter";

class MyReadableStream { /* implements ReadableStream interface */ }

// create adapted types...
const myFetch = createAdaptedFetch(window.fetch, window.ReadableStream, MyReadableStream);
const myResponse = createAdaptedResponse(window.Response, window.ReadableStream, MyReadableStream);

// ...and use them like the built-in versions
myFetch("./some-resource.txt").then(resp => resp.body /* <-- is an instance of MyReadableStream */);
myFetch("some-server.com/upload", { method: "post", body: new MyReadableStream(...) }); // works
const blob = new myResponse(new MyReadableStream(...)).blob(); // works
```

Copyright
---------
© 2018 by Arthur Langereis - [@zenmumbler](https://twitter.com/zenmumbler)

License
-------
MIT
