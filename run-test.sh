#!/usr/bin/env bash
echo "running test at $1"
THISDIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
rm $THISDIR/test-browserify.js
browserify $1 -o $THISDIR/test-browserify.js
$THISDIR/node_modules/run-headless-chromium/run-headless-chromium.js --load-and-launch-app=$THISDIR
