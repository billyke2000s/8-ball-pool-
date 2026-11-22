// Phase 28 bridge: the verified native engine (native-engine.js) becomes the physics of the
// HTML port. It owns ball positions, collisions, pocketing and the pocket-slide animation.
// The v23 rules code still runs on top and is fed from the engine's real events.
// Source of truth: engine during a shot; v23 balls between shots (ball in hand, respots,
// Pyramid removals) are written back into the engine before every strike.
const NE = NativeEngine;
NE.JM.pow = fdlibmPow; // reference-JVM pow (see research/phase28/README.md)
let nativeView = null, nativeGamesThisSession = 0, nativeBreakCounter = 0, nativeBreakSign = 1;
const NATIVE_RULES = { free: 0, combo: 1, blackball: 2 };
const NATIVE_MODE = { local: 'pvp', cpu: 'pvc', solo: 'single' };
// t40.Q for this app version: Small = -18 (10 only applied to versionCode 19 installs).
const nativePocketSetting = v => (Number(v) === 30 ? 30 : Number(v) === 20 ? 20 : -18);
function nativeConfig() {
  return { rules: NATIVE_RULES[ballSet] ?? 2, pocket: nativePocketSetting(settings.pocketSize),
    mode: NATIVE_MODE[playerMode] || 'pvp', difficulty: settings.difficulty, speed: Number(settings.friction) };
}
function nativeStoredInt(key, fallback = 0) { try { return Number(localStorage.getItem(key) ?? fallback) || 0; } catch (_e) { return fallback; } }
function nativeNewGame() {
  const cfg = nativeConfig();
  // wh.s(): Pool colours are mirrored when d1 % 3 == 0 and n_games_won > 0.
  cfg.mirrorColours = nativeGamesThisSession % 3 === 0 && nativeStoredInt('billiard_native_n_games_won') > 0;
  nativeView = NE.newGame(NATIVE_GEOMETRY, cfg);
  nativeGamesThisSession++;
  NE.events.length = 0;
  const m = NE.mt;
  FIELD = { left: m.P, right: m.Q, top: m.R, bottom: m.S };
  // v23 pocket order [TL, TR, ML, MR, BL, BR] from the original ei list (a = 0..5).
  const byA = {}; for (const p of nativeView.b.n) byA[p.a] = p;
  POCKETS = [[0, 'corner'], [2, 'corner'], [4, 'middle'], [1, 'middle'], [5, 'corner'], [3, 'corner']]
    .map(([a, type]) => ({ x: byA[a].b, y: byA[a].c, type, nativeA: a }));
  return nativeView;
}
function nativeColour(k) {
  if (NE.t40.p()) return k.z === 0 ? 'white' : k.A === 1 ? 'red' : k.A === 2 ? 'yellow' : 'black';
  return k.z === 0 ? 'white' : k.z === 8 ? 'black' : k.z <= 7 ? 'solids' : 'stripes';
}
function nativeBallsForUi() {
  const K = NE.k7.K;
  return nativeView.a.map(k => nativeLink({ id: k.z, x: k.c + K, y: k.d + K, vx: 0, vy: 0, active: !k.n, color: nativeColour(k) }, k));
}
// v23 -> engine: positions / pocketed state / striker before a strike.
function nativeSyncToEngine() {
  const K = NE.k7.K;
  for (const b of game.balls) {
    const k = b.k; if (!k) continue;
    if (b.active) { if (k.n || k.c !== b.x - K || k.d !== b.y - K) { k.n = false; k.b = false; k.x = false; k.w = false; k.y = []; k.v = 0; k.p_(b.x - K, b.y - K); } }
    else if (!k.n) { k.n = true; k.b = true; k.x = true; k.w = false; }
    k.t_(0, 0); k.t = null; k.s = -1; k.u = 0; k.l = NE.k7.V; k.q = false;
  }
  // ha.f(k7): striker flag follows the selected striker.
  for (const k of nativeView.a) k.m = false;
  const striker = nativeView.a.find(k => k.z === (game.strikerId ?? 0)) || nativeView.a[0];
  striker.m = true; nativeView.f = striker;
  // Player state used by pocket capture (k7.n) and k7.q(): current player = d0.
  const v = nativeView, cur = game.turn === 0 ? v.b0 : v.c0, other = game.turn === 0 ? v.c0 : v.b0;
  v.d0 = cur; v.e0 = other;
  for (const [h, p] of [[cur, game.turn], [other, 1 - game.turn]]) {
    const g = game.groups[p];
    h.m = g === 'a' ? 1 : g === 'b' ? 2 : 0; h.n = Boolean(g);
    if (h.m) { h.a = v.b.o(h.m, false); if (h.a <= 0) h.m = 3; } else h.a = 7;
    h.f = false; h.o = false; h.p = false; h.r = false; h.s = false; h.z = false;
    h.C = game.playerMode === 'cpu' && p === 1;
  }
  v.W = false;
}
// engine -> v23 after each physics frame.
function nativeSyncFromEngine() {
  const K = NE.k7.K;
  for (const b of game.balls) { const k = b.k; if (!k) continue; b.x = k.c + K; b.y = k.d + K; b.vx = k.i; b.vy = k.j; }
}
// ia.a() break wobble for a human's first shot from the untouched break position. Called by
// fire() for LOCAL shots only; the resulting angle (degrees) is what gets sent to a peer.
function nativeShotDegrees(angleRad) {
  nativeSyncToEngine();
  const v = nativeView, cue = v.f;
  let deg = angleRad * 57.29577951308232;
  const spot = NE.mt.m0[0];
  if (!v.d0.C && v.d0.d === 0 && (deg === 0 || deg === -90) && cue.c === spot[0] && cue.d === spot[1]) {
    // App.b (very first launch) uses a fixed sequence for the first 6 breaks, else random up to +-0.9 deg.
    const firstLaunch = nativeStoredInt('billiard_native_launches') <= 1;
    if (!firstLaunch || nativeBreakCounter > 5) {
      const target = v.a[1];
      deg += ((Math.random() * 2.0) - 1.0) * Math.min(Math.atan((NE.k7.K * 0.5) / Math.sqrt(cue.d_(target.e, target.f))) * 57.29577951308232, 0.9);
    } else {
      const table = [0.02, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85];
      const jitter = (Math.random() * 0.05) + table[nativeBreakCounter % table.length];
      nativeBreakCounter++; nativeBreakSign = -nativeBreakSign;
      deg += jitter * nativeBreakSign;
    }
  }
  return deg;
}
function nativeStrike(deg, nativePower) {
  nativeSyncToEngine();
  NE.strike(nativeView, nativePower, deg);
  playSound('cue_strike', Math.min(0.8 * Math.abs(Math.sqrt(nativeView.f.k) / 140.0), 1));
}
function nativeLink(b, k) { Object.defineProperty(b, 'k', { value: k, enumerable: false, writable: true, configurable: true }); return b; }
// After a network state import: same rules table as the host, balls relinked by id.
function nativeRelink() {
  if (!nativeView || NE.t40.V !== (NATIVE_RULES[game.mode] ?? 2)) { ballSet = game.mode; nativeNewGame(); }
  for (const b of game.balls) nativeLink(b, nativeView.a.find(k => k.z === b.id));
}
let nativeLastCollideSound = 0;
function nativeHandleEvents() {
  const evs = NE.events.splice(0);
  for (const e of evs) {
    if (e.type === 'collide') {
      const now = Date.now(); // wr: at most one collision sound per 100 ms
      if (now - nativeLastCollideSound >= 100) { nativeLastCollideSound = now; playSound('balls_collide', Math.min(0.2 * e.strength, 1)); }
    } else if (e.type === 'contact') {
      if (shot && e.first && e.ball === shot.strikerId && shot.first === null) shot.first = e.other;
      const b = game.balls.find(x => x.id === e.ball); if (b) b.nativeHitLinked = true;
    } else if (e.type === 'pocket') {
      const b = game.balls.find(x => x.id === e.ball);
      if (!b) continue;
      b.nativeHitLinked = e.linked;
      const pk = POCKETS.find(p => p.nativeA === e.pocket) || POCKETS[0];
      nativePocketing = true; pocket(b, pk); nativePocketing = false;
    }
  }
}
let nativePocketing = false;
let nativeFixedFrameMs = null; // tests only: fixed frame time instead of the measured clock
function nativeFrame(ts) {
  if (!nativeView) return;
  if (nativeFixedFrameMs) NE.k7.J = nativeFixedFrameMs * 0.006375;
  else NE.frameClock(nativeView, ts);
  if (shot && !strike) {
    NE.physicsFrame(nativeView);
    nativeHandleEvents();
    nativeSyncFromEngine();
    if (!NE.busy(nativeView)) {
      for (const b of game.balls) { b.vx = 0; b.vy = 0; }
      finishShot();
    }
  }
}
const nativeMoving = () => Boolean(nativeView && shot && NE.busy(nativeView));
function nativeDrawBalls() {
  const K = NE.k7.K, d = K * 2;
  for (const b of game.balls) {
    const k = b.k; if (!k) continue;
    const at = NE.drawBall(k); if (!at) continue;
    const cx = at.x + K, cy = at.y + K;
    if (!k.n) {
      const sh = IMG.ball_shadow;
      if (sh?.complete && sh.naturalWidth) { ctx.save(); ctx.globalAlpha = .67; ctx.drawImage(sh, cx - K * .94, cy + K * .25, d * 1.05, d * .65); ctx.restore(); }
    }
    const key = game.mode === 'blackball' ? ('ball_' + b.color) : ('ball' + String(b.id).padStart(2, '0'));
    const im = IMG[key];
    ctx.save(); ctx.globalAlpha = at.alpha;
    if (im?.complete && im.naturalWidth) ctx.drawImage(im, at.x, at.y, d, d);
    else { ctx.fillStyle = b.color === 'red' ? '#cb2729' : b.color === 'yellow' ? '#e0c421' : b.color === 'black' ? '#17191b' : '#fff'; ctx.beginPath(); ctx.arc(cx, cy, K, 0, TWOPI); ctx.fill(); }
    ctx.restore();
    if (!k.n && ((game.mode === 'free' && b.id === game.strikerId && game.strikerId !== 0) || (game.selectingRemoval && b.id !== game.strikerId))) {
      ctx.save(); ctx.strokeStyle = b.id === game.strikerId ? '#f3f2ef' : '#f7d987';
      ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, K + 7, 0, TWOPI); ctx.stroke(); ctx.restore();
    }
  }
}
// Table artwork placed from the original geometry (mt: P,Q,R,S cushion lines, z rail width,
// B corner and D middle pocket sizes). Proportions keep v23's Normal-size layout; exact
// bitmap placement from mt.e() is not yet verified (see README).
function nativeTableLayout() {
  const m = NE.mt; // v23 Normal layout: z 76.12 -> 77 thick, B 126.87 -> 134 corner / 111 rail start, D 115.46 -> 122
  return { thickness: 77 * m.z / 76.12, corner: 134 * m.B / 126.87, railFrom: 111 * m.B / 126.87, middleAcross: 122 * m.D / 115.46, middleDepth: 80 * m.z / 76.12 };
}
function nativeBlackSpot() { const s = NE.mt.m0[5], K = NE.k7.K; return { x: s[0] + K, y: s[1] + K }; } // Pool rack: black at mt.m0[5]
function nativeCueSpot() { const s = NE.mt.m0[0], K = NE.k7.K; return { x: s[0] + K, y: s[1] + K }; }
// wh: n_games_won increases when the human player wins (feeds the colour mirroring above).
function nativeCountWin() {
  if (game.nativeWinCounted || !game.finished) return;
  game.nativeWinCounted = true;
  const won = game.playerMode === 'solo' ? game.soloResult === 'win' : game.winner === 0;
  if (won) try { localStorage.setItem('billiard_native_n_games_won', String(nativeStoredInt('billiard_native_n_games_won') + 1)); } catch (_e) {}
}
try { localStorage.setItem('billiard_native_launches', String(nativeStoredInt('billiard_native_launches') + 1)); } catch (_e) {}
