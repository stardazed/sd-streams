# sd-streams changelog

## Unreleased
* [streams] fix potential perf issue in Chrome with enormous queues. ([#1](https://github.com/stardazed/sd-streams/issues/1))
* Merge adapter and polyfill into streams repo
* Switch to pnpm for package mgmt and builds

## 1.0.2
_2018-07-01_
* [streams, adapter] Add UMD output, mapped to main, browser and module entry points remain ESM
* [streams] Node is now a supported runtime (>= 7)
* [adapter] add support for fetch stream uploads

## 1.0.1
_2018-06-28_
* [streams] Now passes all current web platform tests for streams.
* [streams] Fully compliant save for the detached buffers bit, because reality is cold like winter.
* [adapter, polyfill] Initial release

## 1.0.0
_2018-06-28_
* [streams] Initial release
