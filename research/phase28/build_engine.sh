#!/bin/sh
# Build native-engine.js = hand translation (engine.js) + machine translation of l30.m().
set -e
cd "$(dirname "$0")"
python3 fallback_to_js.py l30m_fallback.java l30_m > l30_m.js
awk '/^\/\/ ---- s8/{while((getline line < "l30_m.js")>0) print line; print ""} {print}' engine.js > native-engine.js
node -e "require('./native-engine.js'); console.log('native-engine.js built')"
