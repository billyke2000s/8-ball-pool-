// Phase 28 — line-by-line JavaScript translation of the original Billiard.apk ball engine.
// Class, field and method names are the original obfuscated ones so each line can be checked
// against the decompiled source: k7 (ball), s8 (collision body), ex (cushion segment),
// ea (jaw point), ei (pocket), gm (contact result), mt (table), ho (player rules state),
// wh (game view state), m7.c (one physics step per drawn frame).
// l30.m (contact search) is machine-translated from bytecode: see l30_m.js.
// Table geometry is not re-derived here: it is exported from the original mt constructor
// (run headless by research/phase28/oracle) for the reference screen, see geometry.json.
'use strict';

const TO_DEG = 57.29577951308232;   // java.lang.Math.toDegrees constant
const TO_RAD = 0.017453292519943295; // java.lang.Math.toRadians constant
// Transcendental functions go through JM so tests can swap in fdlibm (what the reference JVM
// uses) and prove that any remaining difference is the maths library, not the translation.
const JM = { sin: Math.sin, cos: Math.cos, pow: Math.pow, atan2: Math.atan2, log: Math.log };

// ---- statics -------------------------------------------------------------------------
const y7 = { a: 0.9, z: false };
const t40 = { V: 2, P: 20, i: true, m: true, n: false, o: 1, W: 0, l: 1,
  p() { return this.V === 2; }, q() { return this.V === 0 || this.V === 1; } };
const x00 = { c: true, d: null, e: null, f: null, g: null, h: null, i: null, j: null,
  has(arr, v) { for (const x of arr) if (x === v) return true; return false; } };
const si = { A: 0, B: 0,
  i(d2, d3, d4, d5, d6, d7) {
    const d8 = d4 - d2, d9 = d5 - d3, d10 = d6 - d2, d11 = d7 - d3;
    return (d9 * d9) + (d8 * d8) >= k7.N && (d11 * d11) + (d10 * d10) >= k7.N;
  } };
const t00 = { warnings: 0, S(_tag, _msg) { this.warnings++; },
  b(d2, d3) { return JM.atan2(d3, d2) * TO_DEG; },
  z(d2, d3) { return Math.sqrt((d3 * d3) + (d2 * d2)); } };
const events = []; // sound / UI side effects, for the HTML layer

class GM { init(a, b) { this.a = a; this.b = b; return this; } }
GM.c = new GM().init(Infinity, null);
const gm = GM;
class SB { init(s) { this.s = String(s); } append(x) { this.s += String(x); return this; } toString() { return this.s; } }

// ---- s8 -------------------------------------------------------------------------------
class s8 {
  constructor() { this.a = -100; this.b = false; }
  static c(d, d2, d3) {
    if (d <= 0.0 ? d2 <= 0.0 || d3 >= 0.0 : d2 >= 0.0 || d3 <= 0.0) return null;
    const d4 = (d2 * d2) - ((4.0 * d) * d3);
    if (d4 < 0.0) return null;
    const dSqrt = Math.sqrt(d4), d5 = -d2, d6 = d * 2.0;
    return [(d5 + dSqrt) / d6, (d5 - dSqrt) / d6];
  }
}

// ---- ex: cushion segment --------------------------------------------------------------
class ex extends s8 {
  static from(o) { const e = Object.create(ex.prototype); Object.assign(e, { a: o.id, b: o.b, i: o.i, c: o.c, d: o.d, e: o.e, f: o.f, g: o.g, h: o.h, j: o.j, k: o.k }); return e; }
  static d(d) { return d > 0.0 && d < 1.0; }
  a_(k) {
    const d = ((this.k * k.j) + (this.j * k.i)) * 2.0;
    const d2 = k.i - (this.j * d), d3 = k.j - (d * this.k), d4 = y7.a;
    k.t_(d2 * d4, d3 * d4);
  }
  b_(k) {
    const d = (k.i * this.d) - (k.j * this.c);
    if (d === 0.0) return null;
    const dE = this.e_(k, d, this.e, this.g), dE2 = this.e_(k, d, this.f, this.h);
    if (dE === Infinity && dE2 === Infinity) return null;
    return [dE, dE2];
  }
  e_(k, d, d2, d3) {
    const d4 = d2 - k.e, d5 = d3 - k.f;
    const d6 = ((this.d * d4) - (this.c * d5)) / d;
    if (d6 < 0.0) return Infinity;
    const d7 = k.i, d8 = k.j, d9 = this.c, d10 = this.d;
    if (d9 === 0.0) { if (!ex.d(((d8 * d6) + (-d5)) / d10)) return Infinity; }
    else if (d10 === 0.0) { if (!ex.d(((d7 * d6) + (-d4)) / d9)) return Infinity; }
    else {
      const d11 = ((d8 * d6) + (-d5)) / d10;
      if (!ex.d(((d7 * d6) + (-d4)) / d9) || !ex.d(d11)) return Infinity;
    }
    return d6;
  }
}

// ---- ea: jaw point --------------------------------------------------------------------
class ea extends s8 {
  static from(o) { const e = Object.create(ea.prototype); Object.assign(e, { a: o.id, b: o.b, c: o.c, d: o.d }); return e; }
  a_(k) {
    const d = k.e, d2 = k.f, d3 = k.i, d4 = k.j;
    const d5 = d - this.c, d6 = d2 - this.d;
    const d7 = ((((d4 - 0.0) * d6) + ((d3 - 0.0) * d5)) / ((d6 * d6) + (d5 * d5))) * 2.0;
    const d8 = d3 - (d5 * d7), d9 = y7.a;
    k.t_(d8 * d9, (d4 - (d7 * d6)) * d9);
  }
  b_(k) {
    const d3 = k.e - this.c, d4 = k.f - this.d;
    return s8.c(k.k, 2.0 * ((k.j * d4) + (k.i * d3)), ((d4 * d4) + (d3 * d3)) - k7.N);
  }
}

// ---- ei: pocket ------------------------------------------------------------------------
class ei { constructor(o) { this.a = o.a; this.b = o.x; this.c = o.y; this.d = o.d; this.e = o.e; } }

// ---- mt: table -------------------------------------------------------------------------
const mt = { P: 0, Q: 0, R: 0, S: 0, m0: null, d0: null, e0: null, f0: null, g0: null, h0: null, i0: null, j0: null, k0: null, W: null, X: null, Z: null, a0: null,
  j(d, d2) { return d >= mt.P && d + k7.L <= mt.Q && d2 >= mt.R && d2 + k7.L <= mt.S; } };
class Table {
  constructor(geo) {
    this.j = geo.objects.map(o => o.t === 'ex' ? ex.from(o) : ea.from(o));
    this.n = geo.pockets.map(p => new ei(p));
    this.q = []; this.r = []; this.s = []; this.t = [];
  }
  o(i, z2) { let n = 0; for (const b of this.k.a) if (b.n === z2 && b.A === i) n++; return n; }
}

const HO_U = [-1118482, -65536, -256]; // ho.U
// ---- ho: one player's rule state (fields used by the engine) ----------------------------
class ho {
  constructor(C, J, view) {
    // field initialisers as in ho: a = 7, k = -100, Q = R = U[0]
    Object.assign(this, { C, J, M: view, K: view.b, m: 0, a: 7, b: 0, c: 0, d: 0, e: 0, k: -100, A: 0, i: 0, j: 0,
      f: false, g: false, h: false, n: false, o: false, p: false, q: false, r: false, s: false, y: 0, z: false, Q: HO_U[0], R: HO_U[0], B: null });
  }
  c_() { return this.m !== 0; }
  g_() { return this.a <= 0; }
  h_() {
    let i;
    this.j = this.i;
    if (t40.p()) i = 7 - this.a;
    else if (t40.W === 0) i = (this.b + this.c) - this.e;
    else i = this.B.e + this.b + this.c;
    this.i = i;
  }
}


// ---- k7: ball --------------------------------------------------------------------------
class k7 extends s8 {
  constructor(view, pos, i, i2) {
    super();
    Object.assign(this, { m: false, n: false, q: false, s: -1, v: 0, w: false, x: false, y: [],
      H: view, I: view.b, c: pos[0], d: pos[1], z: i, a: i, B: i === 8 && t40.p(), A: i2,
      e: 0, f: 0, i: 0, j: 0, k: 0, l: 0, o: null, t: null, u: 0, b: false, C: false, F: null, r: null });
    this.s_(); this.l = k7.V; this.F = this;
    this.D = k7.ghost(this); this.E = k7.ghost(this);
  }
  static ghost(src) { // k7(k7): guide-line copy
    const g = Object.create(k7.prototype);
    Object.assign(g, { a: src.z, b: false, m: false, n: false, q: false, s: -1, v: 0, w: false, x: false, y: [],
      H: src.H, I: src.I, z: src.z, B: src.B, A: src.A, C: true, F: src, e: 0, f: 0, i: 0, j: 0, k: 0, l: 0, o: null, t: null, u: 0, r: null });
    g.D = g; g.E = g; g.g_(); return g;
  }
  g_() { if (this.C) { const k = this.F; this.t_(0, 0); this.c = k.c; this.d = k.d; this.m = k.m; this.r = k.r; this.s_(); this.n = k.n; this.b = this.n; this.t = k.t; } }
  static l_(d, d2, d3) { return JM.pow(k7.h0, JM.log((((k7.h0 - 1.0) * t00.z(d, d2)) / (k7.J * d3)) + 1.0) / k7.i0) * d3; }

  a_(k) { // collision response when THIS is hit by moving ball k (s8.a)
    let z, dR;
    if (k.C || !x00.c || (!y7.z ? this.d !== mt.m0[1][1] : this.c !== mt.m0[1][0])) {
      z = false; dR = this.r_(k);
    } else {
      const arrayList = this.H.a, d2 = k.k;
      dR = Math.sqrt(d2);
      this.r_(k);
      let dB = t00.b(this.c - k.c, this.d - k.d);
      if (!y7.z) dB += 90.0;
      z = false;
      const dAbs = 2.0 / ((Math.abs(JM.pow(((-30.0) + dB) / 12.0, 3.0)) * 0.06) + 1.0);
      const dAbs2 = 2.0 / ((Math.abs(JM.pow((dB + 30.0) / 12.0, 3.0)) * 0.06) + 1.0);
      const iMin = Math.min(16, arrayList.length);
      for (let i = 2; i < iMin; i++) {
        const k2 = arrayList[i], i2 = x00.d[i];
        let d;
        if (y7.z) d = x00.has(x00.g, i2) ? dAbs2 : x00.has(x00.h, i2) ? dAbs : 1.0;
        else d = x00.has(x00.j, i2) ? dAbs2 : x00.has(x00.i, i2) ? dAbs : 1.0;
        const dArr = x00.e;
        // Bytecode order is d * ((e[i2][1] * dR) * 0.1); JADX printed it without the parentheses.
        k2.u_(d * ((dArr[i2][1] * dR) * 0.1), y7.z ? dArr[i2][0] : x00.f[i2][0]);
        k2.t = k2;
      }
      const d3 = d2 - k.k;
      let d4 = 0.0;
      for (const k3 of arrayList) if (k3 !== k) d4 += k3.k;
      const dSqrt = 1.0 / Math.sqrt(d4 / d3);
      for (const k4 of arrayList) if (k4 !== k) k4.t_(k4.i * dSqrt, k4.j * dSqrt);
    }
    if (k.C) return;
    events.push({ type: 'collide', strength: Math.abs(dR / 140.0) });
    x00.c = z;
  }
  b_(k) { // time of contact between moving k and this (s8.b)
    const d = this.c - k.c, d2 = this.d - k.d;
    return s8.c(k.k, (-2.0) * ((k.j * d2) + (k.i * d)), ((d2 * d2) + (d * d)) - k7.M);
  }
  d_(d, d2) { const d3 = this.e - d, d4 = this.f - d2; return (d4 * d4) + (d3 * d3); }
  e_(k, k2) {
    if (!k.C) events.push({ type: 'contact', ball: k.z, other: k2.z, first: k.t === null }); // observation only
    if (k.t === null) {
      k.t = k2; k.s = k2.A;
      if (k.m && !k.C) {
        const v = this.H; v.d0.z = true;
        if (t40.p()) {
          const zC = v.d0.c_(), k3 = v.f;
          if (!zC ? k3.s === 3 : !(k3.s === v.d0.m || v.d0.n)) v.m_(true);
        }
      }
    }
    k.t = k2;
  }
  k_() { // one frame of motion: k7.k()
    if (this.n || this.k === 0.0) return;
    if (this.k < this.l) { this.t_(0.0, 0.0); return; }
    const table = this.I;
    const list = sameList(this.r, table.q) ? table.s : table.t;
    const d = k7.J, d2 = (this.i * d) + this.c, d3 = (this.j * d) + this.d;
    const g = l30_m(this, d, list);
    if (GM.c === g) this.p_(d2, d3);
    else { const d4 = g.a; this.p_((this.i * d4) + this.c, (d4 * this.j) + this.d); g.b.a_(this); }
    let pocket = null;
    for (const e of table.n) {
      if (this.d_(e.b, e.c) <= e.e || (this.d_(e.b, e.c) <= e.d && this.t !== null && this.n_(this.H.d0) && (!this.m || !t40.p()))) { pocket = e; break; }
    }
    if (pocket === null) { const d5 = k7.T; this.t_(this.i * d5, this.j * d5); }
    else { this.n = true; this.b = this.n; this.o = pocket; this.q_(); }
  }
  m_(d, d2) { // overlap with another unpocketed ball at (d, d2): k7.m(double,double)
    for (const k of this.r) {
      if (this.z !== k.z && !k.n) { const d3 = d - k.c, d4 = d2 - k.d; if ((d4 * d4) + (d3 * d3) < k7.M) return true; }
    }
    return false;
  }
  n_(h) {
    if (h === null) return false;
    if (t40.q()) return true;
    if (this.B) return h.g_();
    return !h.c_() || this.A === h.m;
  }
  p_(d, d2) { this.c = d; this.d = d2; this.s_(); }
  q_() { // pocketed: k7.q()
    if (!this.C) {
      if (this.y.length === 0) {
        // pocket-drop animation path (drawing only)
        const dSqrt = Math.sqrt(this.k);
        const avg = Math.max(this.H.G.d, 1.0);
        const iMax = Math.trunc((15.0 / avg) * (dSqrt > 5.0 ? Math.max(Math.min(Math.trunc((35.0 / dSqrt) * 20.0), 20), 10) : 20));
        const d2 = this.o.b - k7.K; let d3 = this.o.c - k7.K; const d4 = k7.K * 0.1;
        if (this.o.a === 1) d3 -= d4; else if (this.o.a === 4) d3 += d4;
        const px = Math.fround(d2), py = Math.fround(d3);
        const i = iMax + 1, d8 = (px - this.c) / i, d9 = (py - this.d) / i;
        for (let i2 = 0; i2 <= i; i2++) this.y.push([Math.fround(i2 * d8 + this.c), Math.fround(i2 * d9 + this.d)]);
        const iMax2 = Math.trunc((15.0 / avg) * 20.0);
        for (let i3 = 1; i3 <= iMax2; i3++) this.y.push([px, py]);
        this.v = 0; this.w = true;
      }
      events.push({ type: 'pocket', ball: this.z, linked: this.t !== null, pocket: this.o.a }); // observation only
      const v = this.H;
      v.K = v.now();
      if (this.t === null) v.m_(true);
      else if (t40.p()) {
        const hv = v.d0;
        if (this.m) { hv.c += 1; hv.h_(); } else { hv.b += 1; hv.h_(); }
        if (!this.m) {
          if (this.B) {
            if (v.d0.g_()) {
              if (v.f.n && t40.m) { v.d0.s = true; v.d0.p = false; v.e0.p = true; v.m_(true); }
              else { v.d0.p = true; v.d0.a = -1; v.d0.h_(); v.p_(); }
            } else if (v.H && t40.o === 1) v.d0.r = false;
            else { v.d0.r = true; v.e0.p = true; v.m_(true); }
          } else if (!v.d0.c_()) {
            if (!v.H || v.b.o(this.A, false) <= 0 || t40.n) {
              const h4 = v.d0, i4 = this.A;
              h4.m = i4; h4.Q = HO_U[i4]; h4.R = h4.Q; h4.n = true; h4.a = h4.K.o(h4.m, false); h4.h_();
              if (h4.g_()) { h4.m = 3; h4.R = -16777216; }
              const h5 = v.e0, i6 = i4 !== 1 ? (i4 === 2 ? 1 : -1) : 2;
              h5.m = i6; h5.Q = HO_U[i6]; h5.R = h5.Q; h5.n = true; h5.a = h5.K.o(h5.m, false); h5.h_();
              if (h5.g_()) { h5.m = 3; h5.R = -16777216; }
              events.push({ type: 'suit', player: v.d0, suit: i4 });
            }
            v.p_();
          } else if (this.A === v.d0.m) {
            v.d0.a--; v.d0.h_(); v.p_();
            if (v.d0.g_()) { v.d0.m = 3; v.d0.R = -16777216; }
          } else {
            v.m_(false); v.e0.a--; v.e0.h_();
            if (v.e0.g_()) { v.e0.m = 3; v.e0.R = -16777216; }
          }
        } else if (v.d0.a === -1 && t40.m) { v.d0.s = true; v.d0.p = false; v.e0.p = true; v.m_(true); }
        else v.m_(true);
      } else {
        if (this.m) { v.d0.c++; v.d0.h_(); if (t40.V === 1) v.k0 = true; }
        else if (!this.q) { v.d0.b++; v.d0.h_(); }
        v.p_();
      }
    }
    this.t_(0.0, 0.0);
  }
  r_(k) { // ball-ball impulse: k7.r()
    let dAbs;
    if (k.u === 0.0 && this.u === 0.0 && k.t === this) {
      const d = (this.e + k.e) * 0.5, d2 = (this.f + k.f) * 0.5;
      const d5 = k.i, d6 = k.j, d7 = k.e - d, d8 = k.f - d2;
      const d9 = ((((d6 - 0.0) * d8) + ((d5 - 0.0) * d7)) / ((d8 * d8) + (d7 * d7))) * 2.0;
      const d10 = y7.a;
      k.t_((d5 - (d7 * d9)) * d10, (d6 - (d9 * d8)) * d10);
      dAbs = (Math.abs(k.j) + Math.abs(k.i)) * k7.L;
    } else {
      const d11 = k.i, d12 = k.j, d13 = this.i, d14 = this.j;
      const d15 = k.c - this.c, d16 = k.d - this.d;
      const d17 = ((d12 - d14) * d16) + ((d11 - d13) * d15);
      const d18 = d17 / ((d16 * d16) + (d15 * d15));
      const d19 = d15 * d18, d20 = d18 * d16;
      k.t_((d11 - d19) * 0.99, (d12 - d20) * 0.99);
      this.t_((d13 + d19) * 0.99, (d14 + d20) * 0.99);
      dAbs = d17;
    }
    if (k.m && k.t === null && !k.C) { const d21 = this.k * 0.5; if (this.l > d21) this.l = d21; }
    this.e_(k, this); this.e_(this, k);
    return dAbs / k7.L;
  }
  s_() { this.e = this.c + k7.K; this.f = this.d + k7.K; }
  t_(d, d2) { this.i = d; this.j = d2; this.k = (this.j * this.j) + (this.i * this.i); }
  u_(d, d2) { const r = d2 * TO_RAD; this.t_(JM.cos(r) * d, JM.sin(r) * d); }
}
// Java lets a field and a method share a name (k7.t field and t() method, ho.c and c()...).
// JS does not, so methods that collide carry a trailing underscore. fallback_to_js.py applies
// the same renaming to method calls in the generated l30_m.
function sameList(a, b) { // java.util.ArrayList.equals
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

// ---- wh: game view state used by the engine ---------------------------------------------
class wh {
  constructor(geo, mode) {
    this.mode = mode; this.W = false; this.H = false; this.K = 0; this.k0 = false;
    this.G = { a: 1, b: 0, c: 0, d: 15.0 }; // mc: smoothed frame time
    this.clock = 0;
  }
  now() { return this.clock; }
  k() { return this.mode === 'pvc'; }
  m_(z) { // wh.m(boolean): foul / turn passes
    if (!this.d0.f) { const h = this.d0; h.e++; h.h_(); h.B.h_(); }
    this.d0.f = true; this.W = true;
    if (t40.p()) {
      if (!this.k() || this.d0.C || z) { this.f.p = true; this.e0.h = this.e0.C && this.d0.g; }
    }
    events.push({ type: 'foul', z });
  }
  p_() { if (!this.d0.f) this.W = false; this.d0.o = true; this.d0.y = 0; }
}

// Settings -> statics, as GameActivity/t40.v/mt.q/wh.setDifficulty set them.
//   cfg = { rules: 0 Free Pyramid | 1 Combo Pyramid | 2 Pool, pocket: -18|20|30,
//           mode: 'pvp'|'pvc'|'single', difficulty: 'easy'|'normal'|'hard', speed: 0..8 }
const ia = { i: 1 };
function effectiveSpeed(cfg) { return cfg.mode === 'single' ? cfg.speed : Math.min(cfg.speed, 1); } // t40.y
function loadGeometry(bundle, cfg) {
  const base = bundle.base[`${cfg.rules}:${cfg.pocket}`];
  if (!base) throw new Error('no geometry for ' + cfg.rules + ':' + cfg.pocket);
  const s = effectiveSpeed(cfg);
  const diffKey = cfg.mode === 'pvc' ? cfg.difficulty : cfg.mode;
  const pset = bundle.pocketSets[bundle.pockets[`${cfg.rules}:${cfg.pocket}:${diffKey}:${s}`]];
  if (!pset) throw new Error('no pocket set for ' + JSON.stringify(cfg));
  t40.V = cfg.rules; t40.P = cfg.pocket; t40.l = cfg.speed;
  Object.assign(k7, base.k7, { O: base.O, f0: pset.f0, g0: pset.g0 });
  // t40.v(i): friction and cue-speed factor
  k7.T = JM.pow(0.995 - (0.001 * s), 1.75); k7.h0 = 1.0 / k7.T; k7.i0 = JM.log(k7.h0);
  k7.c0 = s <= 2 ? 5 : 0; ia.i = JM.pow(2.0, s - 1.0);
  y7.a = s <= 2 ? 0.9 : 0.99; y7.z = base.y7z;            // mt.q(i)
  Object.assign(mt, { P: base.mt.P, Q: base.mt.Q, R: base.mt.R, S: base.mt.S, z: base.mt.z, B: base.mt.B, D: base.mt.D, m0: base.rack });
  for (const [k, v] of Object.entries(base.mouth)) mt[k] = v;
  si.A = base.si.A; si.B = base.si.B;
  Object.assign(x00, { d: base.x00.d, e: base.x00.e, f: base.x00.f, g: base.x00.g, h: base.x00.h, i: base.x00.i, j: base.x00.j });
  return { objects: base.objects, pockets: pset.pockets };
}
function newGame(bundle, cfg) {
  const geo = loadGeometry(bundle, cfg);
  const view = new wh(geo, cfg.mode);
  const table = new Table(geo); table.k = view; view.b = table;
  view.a = [];
  view.a.push(new k7(view, mt.m0[0], 0, 0));
  if (t40.p()) {
    const order = [1, 9, 2, 3, 8, 10, 11, 4, 12, 5, 6, 13, 14, 7, 15];
    // wh.s(): every third game (d1 % 3 == 0) after the first (O > 0) mirrors the colours.
    const mirror = Boolean(cfg.mirrorColours);
    for (let i2 = 0; i2 < 15; i2++) {
      let i4 = order[i2];
      if (mirror && i4 !== 8) i4 = 16 - i4;
      const grp = (i4 >= 1 && i4 <= 7) ? 1 : (i4 >= 9 && i4 <= 15) ? 2 : (i4 === 8 ? 3 : 0);
      view.a.push(new k7(view, mt.m0[i2 + 1], i4, grp));
    }
  } else {
    for (let i6 = 1; i6 <= mt.m0.length - 1; i6++) view.a.push(new k7(view, mt.m0[i6], i6, -300));
  }
  if (view.a.length >= 16) { const re = []; for (let i7 = 0; i7 < 16; i7++) re.push(view.a[x00.d[i7]]); view.a = re; }
  for (const b of view.a) b.r = view.a;
  view.f = view.a[0]; view.f.m = true;
  x00.c = true;
  view.G = { a: 1, b: 0, c: 0, d: 15.0 }; k7.J = view.G.d * 0.006375;
  table.q = view.a; table.r = view.a.map(b => b.E);
  table.s = table.j.concat(table.q); table.t = table.j.concat(table.r);
  view.b0 = new ho(false, true, view); view.c0 = new ho(view.k(), false, view);
  view.d0 = view.b0; view.e0 = view.c0; view.b0.B = view.c0; view.c0.B = view.b0;
  return view;
}
// ia.a(): cue velocity for strength ko.J (0..1) and angle in degrees (no break wobble here).
function strike(view, power, angleDeg) {
  let v = JM.pow(power, 1.12) * ia.i * 400.0 * k7.W;
  if (x00.c && ia.i < 2.0 && t40.i) v *= 1.2;
  view.f.b = false; view.f.u_(v, angleDeg);
  view.d0.d++; view.d0.A++; view.H = x00.c;
}
// m7.c(): one physics iteration per drawn frame. Returns wh.f(): true while any ball has
// speed or is still sliding into a pocket (k7.w, cleared by the pocket animation in drawBall).
function physicsFrame(view) {
  for (const b of view.a) b.k_();
  let max = view.a[0]; for (const b of view.a) if (b.k > max.k) max = b; // Collections.max by k
  if (max.k < k7.U) for (const b of view.a) b.t_(0.0, 0.0);
  return busy(view);
}
function busy(view) { for (const b of view.a) if (b.k !== 0.0 || b.w) return true; return false; } // wh.f()
// k7.h(): where to draw a ball this frame, advancing its pocket-slide path (one point per draw).
// Returns null when not drawn, else { x, y, alpha } with x/y the bitmap's top-left corner.
function drawBall(b) {
  if (b.x) return null;
  if (!b.n || !b.w || b.y.length === 0) return b.n ? null : { x: b.c, y: b.d, alpha: 1 };
  let alpha = 1;
  if (b.v >= b.y.length - k7.c0) alpha = Math.trunc(((b.y.length - b.v) * 255.0) / k7.c0) / 255;
  const pt = b.y[b.v];
  b.v++;
  if (b.v >= b.y.length) { b.x = true; b.w = false; }
  return { x: pt[0], y: pt[1], alpha };
}
// wh.onDraw(): frame-time smoothing that sets the step length k7.J.
function frameClock(view, nowMs) {
  const mc = view.G, d = mc.c - mc.b;
  if (d > 0.0 && d < 50.0) { mc.d = (((mc.a - 1) * mc.d) + d) / mc.a; k7.J = mc.d * 0.006375; }
  mc.a = Math.min(mc.a + 1, 40); mc.b = mc.c; mc.c = nowMs; view.clock = nowMs;
}
const NativeEngine = { busy, drawBall, JM, ia, effectiveSpeed, k7, ex, ea, ei, mt, ho, wh, y7, t40, x00, si, t00, GM, events, newGame, strike, physicsFrame, frameClock, loadGeometry };
if (typeof module !== 'undefined') module.exports = NativeEngine;
