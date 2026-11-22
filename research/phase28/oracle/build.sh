#!/bin/sh
# Regenerate Android stand-ins from javap.txt and compile them plus the harness.
set -e
HERE=$(cd "$(dirname "$0")" && pwd); cd "$HERE"
rm -rf stubs stubcls hcls && python3 genstubs.py >/dev/null
find stubs stubs_manual -name '*.java' > stubfiles.txt
mkdir -p stubcls hcls
javac -nowarn -d stubcls @stubfiles.txt 2>&1 | grep -v "Picked up\|^Note" || true
javac -nowarn -XDignore.symbol.file -cp cls:stubcls -d hcls src/*.java 2>&1 | grep -v "Picked up\|^Note\|warning\|Unsafe\|^ *\^\|^[0-9] warnings" || true
