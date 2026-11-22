"""Export the ORIGINAL engine's table geometry for every setting the menus allow, by running
the original mt/ei/t40 code headless (oracle). Output: one compact JSON bundle for the HTML.

  python3 export_geometry.py WIDTH HEIGHT out.json

Keys: base["V:P"] (rules V 0/1/2, pocket size P -18/20/30) holds collision objects, rack,
pocket-mouth points and ball-size statics; pockets["V:P:diff:speed"] holds the six ei capture
circles plus guide factors. Only speeds the app can use per mode are exported (t40.y: PvP/PvC
use min(game_speed,1); 1 Player uses 0..8).
"""
import json, subprocess, sys, os, hashlib
W, H, out = sys.argv[1], sys.argv[2], sys.argv[3]
ORACLE = os.environ.get('ORACLE', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'oracle'))
def run(*args):
    r = subprocess.run([f'{ORACLE}/run.sh', W, H, *args], capture_output=True, text=True)
    return json.loads(r.stdout)
base, pockets, uniq = {}, {}, {}
combos = []
for V in (0, 1, 2):
    for P in (-18, 20, 30):
        for diff in ('easy', 'normal', 'hard'):
            for speed in (0, 1): combos.append((V, P, f'mode=pvc', f'diff={diff}', speed, diff))
        for speed in (0, 1): combos.append((V, P, 'mode=pvp', None, speed, 'pvp'))
        for speed in range(0, 9): combos.append((V, P, 'mode=single', None, speed, 'single'))
for V, P, mode, diff, speed, key in combos:
    args = [str(P), '16.6667', mode] + ([diff] if diff else []) + [f'rules={V}', f'speed={speed}']
    d = run(*args)
    bk = f'{V}:{P}'
    b = {k: d[k] for k in ('objects', 'rack', 'mouth', 'mt', 'si', 'O', 'y7z', 'x00', 'balls', 'W', 'H')}
    b['k7'] = {k: d['k7'][k] for k in ('K', 'L', 'M', 'N', 'U', 'V', 'W')}
    if bk in base and base[bk] != b: raise SystemExit(f'base geometry changed with mode/speed for {bk}')
    base[bk] = b
    p = {'pockets': d['pockets'], 'f0': d['k7']['f0'], 'g0': d['g0'], 'ei': d['ei']}
    h = hashlib.md5(json.dumps(p, sort_keys=True).encode()).hexdigest()[:10]
    uniq[h] = p
    pockets[f'{V}:{P}:{key}:{speed}'] = h
json.dump({'screen': [float(W), float(H)], 'base': base, 'pocketSets': uniq, 'pockets': pockets,
           'source': 'Exported from the original Billiard.apk bytecode (mt, ei, t40, wh.setDifficulty) run headless; see research/phase28/README.md'},
          open(out, 'w'), separators=(',', ':'))
print(out, os.path.getsize(out), 'bytes;', len(base), 'base tables;', len(uniq), 'distinct pocket sets for', len(pockets), 'settings')
