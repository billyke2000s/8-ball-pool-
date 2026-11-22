#!/bin/bash
# Differential fuzz of native-engine.js against the ORIGINAL engine bytecode (oracle).
# Each case: random rules / pocket size / mode / difficulty / game speed / frame time / shot.
# Usage: fuzz.sh N [seed]     ORACLE=built oracle (default ./oracle, see oracle/setup.sh)
set -u
N=${1:-50}; SEED=${2:-1}
ORACLE=${ORACLE:-$(cd "$(dirname "$0")" && pwd)/oracle}
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=$(mktemp -d)
python3 - "$N" "$SEED" > "$OUT/cases.txt" <<'PY'
import random, sys, json
n, seed = int(sys.argv[1]), int(sys.argv[2]); r = random.Random(seed)
for i in range(n):
    rules = r.choice([2, 2, 0, 1]); P = r.choice([20, 20, -18, 30])
    mode = r.choice(['pvp', 'pvc', 'single']); diff = r.choice(['easy', 'normal', 'hard'])
    speed = r.choice([1, 1, 0]) if mode != 'single' else r.randint(0, 8)
    power = round(r.uniform(0.02, 1.0), 4); angle = round(r.uniform(-180, 180), 3)
    frame = r.choice([16.6667, 16.6667, 8.3333, 11.1111, 15.0, 20.0, 33.3333])
    shot = f'{power}:{angle}' if r.random() < 0.25 else f'{power}:{angle}:{round(r.uniform(78, 590), 2)}:{round(r.uniform(78, 1290), 2)}'
    oargs = [f'mode={mode}'] + ([f'diff={diff}'] if mode == 'pvc' else []) + [f'rules={rules}', f'speed={speed}']
    cfg = json.dumps({'rules': rules, 'pocket': P, 'mode': mode, 'difficulty': diff, 'speed': speed}, separators=(',', ':'))
    print(i, P, frame, ' '.join(oargs), shot, cfg, sep='|')
PY
pass=0; fail=0; ulp=0; skip=0; pocketed=0; withpocket=0
while IFS='|' read -r i P frame oargs shot cfg; do
  "$ORACLE/run.sh" 700 1400 "$P" "$frame" $oargs "$shot" > "$OUT/$i.json" 2>&1
  if ! head -c 1 "$OUT/$i.json" | grep -q '{'; then skip=$((skip+1)); echo "case $i: oracle error: $(head -c 300 "$OUT/$i.json")"; continue; fi
  res=$(node "$HERE/compare.cjs" "$OUT/$i.json" "$shot" "$frame" "$cfg"); rc=$?
  if [ $rc -eq 0 ]; then pass=$((pass+1)); n=$(printf '%s' "$res" | python3 -c 'import json,sys;print(len(json.load(sys.stdin)["pocketed"]))'); pocketed=$((pocketed+n)); [ "$n" -gt 0 ] && withpocket=$((withpocket+1))
  elif [ $rc -eq 2 ]; then ulp=$((ulp+1)); echo "case $i libm-ulp drift: $cfg $shot $res"
  else fail=$((fail+1)); echo "case $i FAIL P=$P frame=$frame $oargs shot=$shot cfg=$cfg $res"; fi
done < "$OUT/cases.txt"
echo "fuzz: $pass bit-exact, $ulp libm-ulp drift only, $fail failed, $skip oracle errors (of $N); $withpocket shots pocketed balls ($pocketed balls total)"
rm -rf "$OUT"
[ "$fail" -eq 0 ] && [ "$skip" -eq 0 ]
