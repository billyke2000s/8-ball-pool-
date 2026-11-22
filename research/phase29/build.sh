#!/bin/sh
# Compile the original game (apktool smali of the user's Billiard.apk) to JavaScript.
#   sh build.sh /path/to/apktool-output/smali  [out.js]
# The output contains the app's own code, so it is written outside the repo by default.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
python3 "$HERE/dex2js.py" "$1" "${2:-/tmp/billiard-compiled.js}"
node --check "${2:-/tmp/billiard-compiled.js}" && echo "syntax ok"
