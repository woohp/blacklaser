#!/usr/bin/env sh
set -eu

sh scripts/vendor-assets.sh

if [ -d docs ]; then
    find docs -mindepth 1 -maxdepth 1 -exec rm -rf {} +
else
    mkdir -p docs
fi
