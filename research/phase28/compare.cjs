'use strict';
// Differential test: run one shot in native-engine.js and compare every frame with the
// original engine's output (oracle JSON). Usage: node compare.cjs oracle.json power:angle[:cueX:cueY] frameMs '{"rules":2,"pocket":20,"mode":"pvp","difficulty":"normal","speed":1}' [bundle.json]
// The JS side builds the game ONLY from the exported bundle + settings, as the HTML does.
const fs = require('fs');
const E = require('./native-engine.js');
// FDLIBM=1: run on the reference JVM's maths (V8 already matches fdlibm for sin/cos/atan2/log;
// only pow differs), so any remaining difference must be in the translated logic itself.
if (process.env.FDLIBM === '1') E.JM.pow = require('./fdlibm_pow.js');
const [file, shot, frameMs, cfgJson, bundleFile] = process.argv.slice(2);
const cfg = JSON.parse(cfgJson);
const bundle = JSON.parse(fs.readFileSync(bundleFile || require('path').join(__dirname, 'geometry-700x1400.json'), 'utf8'));
const [power, angle, cx, cy] = shot.split(':').map(Number);
const ref = JSON.parse(fs.readFileSync(file, 'utf8'));
const view = E.newGame(bundle, cfg);
E.k7.J = Number(frameMs) * 0.006375;
if (cx !== undefined && !Number.isNaN(cx)) view.f.p_(cx, cy);
E.strike(view, power, angle);
let worst = 0, firstDiv = -1, f = 0, firstAny = -1, firstAnyMag = 0;
for (; f < ref.frames.length; f++) {
  E.physicsFrame(view);
  const row = ref.frames[f];
  for (let i = 0; i < view.a.length; i++) {
    const b = view.a[i], o = i * 4;
    if (row[o] !== b.z) throw new Error(`frame ${f}: ball order differs`);
    const err = Math.max(Math.abs(row[o + 1] - b.c), Math.abs(row[o + 2] - b.d));
    if ((row[o + 3] === 1) !== b.n) { if (firstDiv < 0) firstDiv = f; worst = Infinity; }
    if (err > 0 && firstAny < 0) { firstAny = f; firstAnyMag = err; }
    if (err > worst) worst = err;
    if (err > 1e-6 && firstDiv < 0) firstDiv = f;
  }
}
const stillMoving = view.a.some(b => b.k !== 0 && !b.n);
// A divergence that STARTS at rounding size (<1e-9 px) can only come from a transcendental
// libm result (sin/cos/pow/atan2/log) differing by an ulp; a logic error shows up larger.
const libmUlp = worst > 1e-6 && Number.isFinite(worst) && firstAnyMag < 1e-9;
console.log(JSON.stringify({ frames: ref.frames.length, worstAbsError: worst, firstDivergentFrame: firstDiv, firstAnyDiffFrame: firstAny, firstAnyDiffMagnitude: firstAnyMag, libmUlp, jsStillMovingAtEnd: stillMoving, pocketed: view.a.filter(b => b.n).map(b => b.z) }));
process.exit(worst <= 1e-6 && !stillMoving ? 0 : libmUlp && !stillMoving ? 2 : 1);
