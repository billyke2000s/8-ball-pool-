#!/bin/sh
# Build the headless reference ("oracle") that runs the ORIGINAL Billiard.apk engine bytecode.
#   sh setup.sh /path/to/Billiard.apk /path/to/dex-tools-v2.4   (dex2jar 2.4 release folder)
# Needs a JDK (17+) and python3. Produces cls/ (original classes), stubcls/ (Android stand-ins)
# and hcls/ (harness). Nothing from the APK is written outside this folder.
set -e
APK=$1; D2J=$2
[ -f "$APK" ] && [ -d "$D2J" ] || { echo "usage: sh setup.sh Billiard.apk dex-tools-dir"; exit 1; }
HERE=$(cd "$(dirname "$0")" && pwd); cd "$HERE"
sh "$D2J/d2j-dex2jar.sh" -f -o orig.jar "$APK"
rm -rf cls && mkdir cls && (cd cls && unzip -qo ../orig.jar)
javap -v -p $(find cls -name '*.class') > javap.txt 2>/dev/null
sh "$HERE/build.sh"
echo "oracle ready: $HERE/run.sh 700 1400 20 16.6667 mode=pvp rules=2 speed=1 0.8:-90"
