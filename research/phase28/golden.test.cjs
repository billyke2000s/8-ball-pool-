'use strict';
// CI check (no APK needed): native-engine.js, with the same fdlibm pow the page uses, must
// reproduce the ORIGINAL engine's recorded positions bit for bit (golden/*.json, produced
// by make_golden.py from the original bytecode). Usage: node golden.test.cjs [dir]
const fs = require('fs'), path = require('path');
const E = require('./native-engine.js');
E.JM.pow = require('./fdlibm_pow.js');
const dir = process.argv[2] || path.join(__dirname, 'golden');
const bundle = JSON.parse(fs.readFileSync(path.join(__dirname, 'geometry-700x1400.json'), 'utf8'));
let checked = 0, frames = 0;
for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.json')).sort()) {
  const g = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const view = E.newGame(bundle, g.cfg);
  E.k7.J = g.frameMs * 0.006375;
  const [power, angle, cx, cy] = g.shot.split(':').map(Number);
  if (cx !== undefined) view.f.p_(cx, cy);
  E.strike(view, power, angle);
  for (let fr = 0; fr < g.frameCount; fr++) {
    E.physicsFrame(view);
    const row = g.frames[fr];
    if (!row) continue;
    for (let i = 0; i < view.a.length; i++) {
      const b = view.a[i];
      if (row[i * 4] !== b.z || row[i * 4 + 1] !== b.c || row[i * 4 + 2] !== b.d || (row[i * 4 + 3] === 1) !== b.n)
        throw new Error(`${f}: frame ${fr} ball ${b.z} differs from the original engine`);
    }
    frames++;
  }
  if (view.a.some(b => b.k !== 0 && !b.n)) throw new Error(`${f}: still moving after the original stopped`);
  checked++;
}
console.log(`golden: ${checked} shots, ${frames} recorded frames bit-identical to the original engine`);
