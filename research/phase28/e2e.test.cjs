'use strict';
// End-to-end: fire a shot through the PAGE code (fire -> cue animation -> bridge -> engine)
// and compare every ball's resting position with the original engine (oracle JSON).
// Usage: node e2e.test.cjs page.html oracle.json '{"ballSet":"blackball","players":"local",...}' aimRad power frameMs
const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
const [page, oracleFile, uiJson, aimRad, power, frameMs] = process.argv.slice(2);
const html = fs.readFileSync(page, 'utf8'), ui = JSON.parse(uiJson);
const nodes = {}, store = new Map();
const ctx2d = new Proxy({ measureText: () => ({ width: 20 }) }, { get: (o, k) => k in o ? o[k] : () => {} });
const defaults = { ballSet: 'blackball', players: 'local', friction: '1', pocketSize: '20', difficulty: 'normal', pyramidPenalty: '0', firstTurn: '0', powerSide: 'left', ...ui };
function node(id) { return nodes[id] || (nodes[id] = { id, value: defaults[id] || '', checked: false, hidden: true, textContent: '', style: {}, addEventListener(n, f) { this[n] = f; }, setAttribute() {}, focus() {}, getContext: () => ctx2d, getBoundingClientRect: () => ({ left: 0, top: 0, width: 700, height: 1400 }), setPointerCapture() {} }); }
const sandbox = { console, Math, Date, JSON, Promise, Set, Map, Number, Boolean, String, Array, Object, Infinity, Uint8Array, DataView, ArrayBuffer, atob: s => Buffer.from(s, 'base64').toString('latin1'),
  document: { getElementById: node, querySelector: () => node('table'), activeElement: null, hidden: false, addEventListener() {} }, history: { pushState() {} },
  Image: class { constructor() { this.complete = true; this.naturalWidth = 96; } }, Audio: class {}, localStorage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) },
  performance: { now: () => 0 }, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, requestAnimationFrame() {}, addEventListener() {}, navigator: {} };
sandbox.window = sandbox; vm.createContext(sandbox);
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
scripts[1] = scripts[1].replace('restart();requestAnimationFrame(frame);', 'restart();window.t={get game(){return game},restart,fire,simulate,get shot(){return shot},set fixed(v){nativeFixedFrameMs=v},NativeEngine};requestAnimationFrame(frame);');
for (const s of scripts) vm.runInContext(s, sandbox);
const t = sandbox.t, ref = JSON.parse(fs.readFileSync(oracleFile, 'utf8'));
for (const [k, v] of Object.entries(ui)) node(k).value = v; // after page start-up (preferences load)
t.restart(); t.game.sound = false; t.fixed = Number(frameMs);
assert.ok(t.fire(Number(aimRad), Number(power) * 100), 'fire accepted');
let steps = 0; while (t.shot && steps++ < 20000) t.simulate(Number(frameMs) / 1000);
assert.ok(!t.shot, 'shot finished');
const last = ref.frames[ref.frames.length - 1];
let worst = 0;
for (let i = 0; i < 16; i++) {
  const id = last[i * 4], b = t.game.balls.find(x => x.id === id), k = b.k;
  const err = Math.max(Math.abs(k.c - last[i * 4 + 1]), Math.abs(k.d - last[i * 4 + 2]));
  // engine state at rest; the rules may then re-place balls (ball in hand, respots) on the UI side
  if ((last[i * 4 + 3] === 1) !== k.n) throw new Error(`ball ${id}: pocketed differs (page ${k.n}, original ${last[i * 4 + 3] === 1})`);
  if (!k.n) worst = Math.max(worst, err);
}
console.log(JSON.stringify({ pageSteps: steps, oracleFrames: ref.frames.length, worstRestingPositionError: worst, potted: t.game.balls.filter(b => b.k.n).map(b => b.id) }));
assert.equal(worst, 0, 'resting positions must be bit-identical');
