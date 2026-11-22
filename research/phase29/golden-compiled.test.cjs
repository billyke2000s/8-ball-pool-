'use strict';
// The ORIGINAL classes, compiled by dex2js, replay the phase-28 golden shots (recorded from the
// original bytecode on the JVM). Setup mirrors research/phase28/oracle/src/Oracle.java step by
// step, but every game method that runs is compiled original code: mt's table constructor,
// wh.setDifficulty, t40.v/y, k7/l30/ex/ea/ei/ho. Usage: node golden-compiled.test.cjs game.js
const fs = require('fs'), path = require('path');
require('./rt.js');
const rt = globalThis.DexRT;
rt.pow = require('../phase28/fdlibm_pow.js');
require('./jdk.js'); require('./android-headless.js');
require(path.resolve(process.argv[2] || '/tmp/all.js'));
const S = n => rt.c(n).S;
const F = (o, cls, f, v) => { if (v !== undefined) o[cls + '.' + f] = v; return o[cls + '.' + f]; };
const list = () => { const l = rt.alloc('Ljava/util/ArrayList;'); l['<init>()V'](); return l; };
const dir = path.join(__dirname, '..', 'phase28', 'golden');
let shots = 0, frames = 0;
for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
  const g = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  // fresh statics for each game: reload the compiled classes
  for (const k of Object.keys(require.cache)) if (k.endsWith('all.js') || k === path.resolve(process.argv[2] || '/tmp/all.js')) delete require.cache[k];
  rt.reset && rt.reset();
  const W = 700, H = 1400, { rules, pocket, mode, difficulty, speed } = g.cfg;
  const y7 = S('Ly7;'), t40 = S('Lt40;');
  y7.c = W; y7.d = H; y7.z = W >= H ? 1 : 0;
  const b = W > H ? rt.c('Lbr;')['a(DD)Lbr;'](W, H) : rt.c('Lbr;')['a(DD)Lbr;'](H, W);
  if (!(W > H)) { const t = F(b, 'Lbr;', 'a'); F(b, 'Lbr;', 'a', F(b, 'Lbr;', 'b')); F(b, 'Lbr;', 'b', t); }
  y7.b = b; y7.y = F(b, 'Lbr;', 'c');
  y7.g = 18 * y7.y; y7.h = 50 * y7.y; y7.i = 3 * y7.y; y7.j = 9 * y7.y; y7.l = 40 * y7.y; y7.m = 30 * y7.y; y7.n = y7.h;
  Object.assign(t40, { i: 1, j: 1, g: 1, V: rules, l: speed, n: 0, m: 1, o: 1, W: 0, T: 0, c: 2, S: 0, P: pocket });
  const vh = S('Lvh;'); const MODE = mode === 'single' ? vh.a : mode === 'pvc' ? vh.c : vh.b;
  const ac = S('Lac;'); const DIFF = mode === 'single' ? ac.e : mode === 'pvc' ? { easy: ac.b, normal: ac.c, hard: ac.d }[difficulty] : ac.f;
  const T40 = rt.c('Lt40;');
  T40['v(I)V'](T40['y(Lvh;)I'](MODE));
  const view = rt.alloc('Lwh;');
  const table = rt.alloc('Lmt;'); table['<init>(Lwh;)V'](view);
  F(view, 'Lwh;', 'b', table);
  const isPool = T40['p()Z']();
  const u7 = S('Lu7;');
  const nb = isPool ? u7.d.length : u7.e.length;
  const bm = rt.newArray('[Landroid/graphics/Bitmap;', nb); for (let i = 0; i < nb; i++) bm[i] = rt.bitmap(50, 50);
  F(view, 'Lwh;', 'l', bm); F(view, 'Lwh;', 'k', rt.bitmap(50, 50)); F(view, 'Lwh;', 'G', rt.alloc('Lmc;'));
  const balls = list(); F(view, 'Lwh;', 'a', balls);
  const mt = S('Lmt;');
  const newBall = (bmp, pos, i, grp) => { const k = rt.alloc('Lk7;'); k['<init>(Lwh;Landroid/graphics/Bitmap;[DII)V'](view, bmp, pos, i, grp); return k; };
  balls['add(Ljava/lang/Object;)Z'](newBall(bm[0], mt.m0[0], 0, 0));
  if (isPool) {
    const order = [1, 9, 2, 3, 8, 10, 11, 4, 12, 5, 6, 13, 14, 7, 15];
    for (let i2 = 0; i2 < 15; i2++) { const i4 = order[i2]; const grp = (i4 >= 1 && i4 <= 7) ? 1 : (i4 >= 9 && i4 <= 15) ? 2 : (i4 === 8 ? 3 : 0); balls['add(Ljava/lang/Object;)Z'](newBall(bm[u7.f[grp]], mt.m0[i2 + 1], i4, grp)); }
  } else for (let i6 = 1; i6 <= mt.m0.length - 1; i6++) balls['add(Ljava/lang/Object;)Z'](newBall(bm[i6], mt.m0[i6], i6, -300));
  const x00 = S('Lx00;');
  balls.$a = [...Array(16).keys()].map(i7 => balls.$a[x00.d[i7]]);
  for (const kk of balls.$a) F(kk, 'Lk7;', 'r', balls);
  F(view, 'Lwh;', 'f', balls.$a[0]); F(balls.$a[0], 'Lk7;', 'm', 1);
  x00.c = 1;
  const mc = F(view, 'Lwh;', 'G'); F(mc, 'Lmc;', 'a', 1); F(mc, 'Lmc;', 'd', 15.0); S('Lk7;').J = 15.0 * 0.006375;
  F(view, 'Lwh;', 'V', MODE); view['setDifficulty(Lac;)V'](DIFF);
  table['q(I)V'](T40['y(Lvh;)I'](F(view, 'Lwh;', 'V')));
  F(table, 'Lmt;', 'q', balls);
  const r = F(table, 'Lmt;', 'r'); r.$a = balls.$a.map(kk => F(kk, 'Lk7;', 'E'));
  const j = F(table, 'Lmt;', 'j').$a;
  F(table, 'Lmt;', 's').$a = j.concat(balls.$a); F(table, 'Lmt;', 't').$a = j.concat(r.$a);
  F(view, 'Lwh;', 'S', rt.alloc('Landroid/widget/TextView;')); F(view, 'Lwh;', 'T', rt.alloc('Landroid/widget/TextView;'));
  F(view, 'Lwh;', 'C', rt.alloc('Lcom/andregal/android/poolbilliard/GameActivity;'));
  const mkHo = z => { const h = rt.alloc('Lho;'); h['<init>(ZLandroid/widget/TextView;ZLjava/util/ArrayList;Lwh;)V'](0, F(view, 'Lwh;', 'S'), z, balls, view); return h; };
  const b0 = mkHo(1), c0 = mkHo(0);
  F(view, 'Lwh;', 'b0', b0); F(view, 'Lwh;', 'c0', c0); F(view, 'Lwh;', 'd0', b0); F(view, 'Lwh;', 'e0', c0); F(b0, 'Lho;', 'B', c0); F(c0, 'Lho;', 'B', b0);
  // shot
  const [power, angle, cx, cy] = g.shot.split(':').map(Number);
  if (cx !== undefined) balls.$a[0]['p(DD)V'](cx, cy);
  const ia = S('Lia;'), k7S = S('Lk7;');
  let v = rt.pow(power, 1.12) * ia.i * 400.0 * k7S.W;
  if (x00.c && ia.i < 2.0 && t40.i) v *= 1.2;
  const cue = balls.$a[0]; F(cue, 'Lk7;', 'b', 0); cue['u(DD)V'](v, angle);
  F(b0, 'Lho;', 'd', F(b0, 'Lho;', 'd') + 1); F(b0, 'Lho;', 'A', F(b0, 'Lho;', 'A') + 1); F(view, 'Lwh;', 'H', x00.c);
  k7S.J = g.frameMs * 0.006375;
  const Coll = rt.c('Ljava/util/Collections;');
  for (let fr = 0; fr < g.frameCount; fr++) {
    for (const kk of balls.$a) kk['k()V']();
    if (F(Coll['max(Ljava/util/Collection;)Ljava/lang/Object;'](balls), 'Lk7;', 'k') < k7S.U) for (const kk of balls.$a) kk['t(DD)V'](0, 0);
    const row = g.frames[fr]; if (!row) continue;
    balls.$a.forEach((kk, i) => {
      const got = [F(kk, 'Lk7;', 'z'), F(kk, 'Lk7;', 'c'), F(kk, 'Lk7;', 'd'), F(kk, 'Lk7;', 'n') ? 1 : 0];
      for (let q = 0; q < 4; q++) if (got[q] !== row[i * 4 + q]) throw new Error(`${file} frame ${fr} ball ${got[0]} field ${q}: compiled ${got[q]} vs original ${row[i * 4 + q]}`);
    });
    frames++;
  }
  shots++;
}
console.log(`compiled original classes: ${shots} golden shots, ${frames} recorded frames bit-identical`);
const top = [...rt.stats.autoStubCalls.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
console.log('placeholder framework calls (top):', top.map(([k, n]) => `${k} x${n}`).join('; '));
