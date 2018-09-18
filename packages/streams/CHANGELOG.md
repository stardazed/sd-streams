# @stardazed/streams changelog

## 1.0.6
_2018-09-18_
* Fix broken URLs

## 1.0.5
_2018-09-10_
* Incorporate changes to streams spec up to 2018-09-10

## 1.0.4
_2018-07-23_
* Fix bug where public read request objects were marked as internal

## 1.0.3
_2018-07-22_
* Fix potential perf issue in Chrome with enormous queues. ([#1](https://github.com/stardazed/sd-streams/issues/1))
* Incorporate changes to streams spec up to 2018-07-22
* Merge adapter and polyfill into streams repo
* Switch to pnpm for package mgmt and builds

## 1.0.2
_2018-07-01_
* Add UMD output, mapped to main, browser and module entry points remain ESM
* Node is now a supported runtime (>= 7)

## 1.0.1
_2018-06-28_
* Now passes all current web platform tests for streams.
* Fully compliant save for the detached buffers bit, because reality is cold like winter.

## 1.0.0
_2018-06-28_
* Initial release
