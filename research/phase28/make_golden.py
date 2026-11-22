"""Record reference outputs of the ORIGINAL engine (oracle) for CI, which has no APK.
Each golden file keeps the settings, the shot, and every ball's exact position on every
5th frame plus the final frame. Usage: python3 make_golden.py N seed outdir"""
import json, os, random, subprocess, sys
n, seed, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
ORACLE = os.environ.get('ORACLE', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'oracle'))
os.makedirs(out, exist_ok=True)
r = random.Random(seed)
for i in range(n):
    rules = [2, 0, 1][i % 3]; P = [20, -18, 30][(i // 3) % 3]
    mode = ['pvp', 'pvc', 'single'][(i // 9) % 3]; diff = r.choice(['easy', 'normal', 'hard'])
    speed = r.randint(0, 8) if mode == 'single' else r.choice([0, 1])
    frame = r.choice([16.6667, 8.3333, 20.0, 33.3333])
    power = round(r.uniform(0.3, 1.0), 4); angle = round(r.uniform(-180, 180), 3)
    shot = f'{power}:{angle}' if i % 4 == 0 else f'{power}:{angle}:{round(r.uniform(80, 580), 2)}:{round(r.uniform(80, 1280), 2)}'
    args = [f'mode={mode}'] + ([f'diff={diff}'] if mode == 'pvc' else []) + [f'rules={rules}', f'speed={speed}', shot]
    res = subprocess.run([f'{ORACLE}/run.sh', '700', '1400', str(P), str(frame), *args], capture_output=True, text=True)
    d = json.loads(res.stdout)
    frames = d['frames']; keep = {k: frames[k] for k in range(0, len(frames), 10)}; keep[len(frames) - 1] = frames[-1]
    g = {'cfg': {'rules': rules, 'pocket': P, 'mode': mode, 'difficulty': diff, 'speed': speed},
         'shot': shot, 'frameMs': frame, 'frameCount': len(frames), 'frames': keep}
    json.dump(g, open(f'{out}/case{i:02d}.json', 'w'), separators=(',', ':'))
print('wrote', n, 'golden cases to', out)
