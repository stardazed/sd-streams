# @stardazed/streams-polyfill changelog

## 2.4.0
_2021-02-09_
* Add type definitions for compression streams as they are not yet in the standard ([#7](https://github.com/stardazed/sd-streams/issues/7))

## 2.3.0
_2021-02-09_
* Settle reader.closed promise before closing/erroring read requests (spec update)

## 2.2.0
_2020-08-16_
* Fix getGlobal() so it works in Workers, thanks @manucorporat! ([#6](https://github.com/stardazed/sd-streams/pull/6))

## 2.1.0
_2019-12-22_
* Add CompressionStream and DecompressionStream polyfills

## 2.0.1
_2019-10-02_
* Always override built-in TextDecoderStream and TextEncoderStream if the main streams were polyfilled ([#4](https://github.com/stardazed/sd-streams/issues/4))
* Remove custom type annotation for signal, which is now in the default lib.

## 2.0.0
_2019-01-16_
* BREAKING: no longer provides full types for stream types, now requires TS 3.2 or newer.
* Supports the AbortSignal `signal` field in the PipeOptions for ReadableStream's pipeTo and pipeThrough methods to manually
  abort pipe operations.
* Incorporate changes to streams spec up to 2019-01-16

## 1.0.7
_2018-10-01_
* Fetched Response bodies now correctly clone values when the Response is cloned ([#2](https://github.com/stardazed/sd-streams/issues/2))

## 1.0.6
_2018-09-19_
* Add combined TypeScript types to this package so they will be accessible when using polyfill only

## 1.0.5
_2018-09-17_
* Add TextEncoderStream and TextDecoderStream polyfills

## 1.0.4
_2018-09-10_
* Incorporate changes to streams spec up to 2018-09-10

## 1.0.3
_2018-07-23_
* Fix bug where public read request objects were marked as internal

## 1.0.2
_2018-07-22_
* Fix potential perf issue in Chrome with enormous queues. ([#1](https://github.com/stardazed/sd-streams/issues/1))
* Incorporate changes to streams spec up to 2018-07-22

## 1.0.1
_2018-07-01_
* Node is now a supported runtime (>= 7)
* Add support for fetch stream uploads

## 1.0.0
_2018-06-28_
* Initial release
