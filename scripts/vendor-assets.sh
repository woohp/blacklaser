#!/usr/bin/env sh
set -eu

mkdir -p src/vendor

cp node_modules/webtorrent/dist/sw.min.js src/vendor/sw.min.js
