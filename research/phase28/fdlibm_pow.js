'use strict';
// JavaScript port of fdlibm e_pow.c (__ieee754_pow), the algorithm behind java.lang.StrictMath.pow
// and HotSpot's non-intrinsic Math.pow. Test-only: lets the differential test run the engine on
// the same pow as the reference JVM. Validated bit-for-bit against StrictMath (see pow_check).
const buf = new DataView(new ArrayBuffer(8));
const hi = x => { buf.setFloat64(0, x); return buf.getInt32(0); };
const lo = x => { buf.setFloat64(0, x); return buf.getInt32(4); };
const make = (h, l) => { buf.setInt32(0, h); buf.setInt32(4, l); return buf.getFloat64(0); };
const setLo0 = x => make(hi(x), 0);

const bp = [1.0, 1.5], dp_h = [0.0, 5.84962487220764160156e-01], dp_l = [0.0, 1.35003920212974897128e-08];
const two53 = 9007199254740992.0, huge = 1.0e300, tiny = 1.0e-300;
const L1 = 5.99999999999994648725e-01, L2 = 4.28571428578550184252e-01, L3 = 3.33333329818377432918e-01,
  L4 = 2.72728123808534006489e-01, L5 = 2.30660745775561754067e-01, L6 = 2.06975017800338417784e-01,
  P1 = 1.66666666666666019037e-01, P2 = -2.77777777770155933842e-03, P3 = 6.61375632143793436117e-05,
  P4 = -1.65339022054652515390e-06, P5 = 4.13813679705723846039e-08,
  lg2 = 6.93147180559945286227e-01, lg2_h = 6.93147182464599609375e-01, lg2_l = -1.90465429995776804525e-09,
  ovt = 8.0085662595372944372e-17, cp = 9.61796693925975554329e-01, cp_h = 9.61796700954437255859e-01,
  cp_l = -7.02846165095275826516e-09, ivln2 = 1.44269504088896338700e+00,
  ivln2_h = 1.44269502162933349609e+00, ivln2_l = 1.92596299112661746887e-08;

function scalbn(x, n) { // fdlibm s_scalbn.c (only the range pow needs)
  const twom54 = 5.55111512312578270212e-17, two54 = 1.80143985094819840000e+16;
  let k = (hi(x) & 0x7ff00000) >> 20;
  if (k === 0) { if (((hi(x) & 0x7fffffff) | lo(x)) === 0) return x; x *= two54; k = ((hi(x) & 0x7ff00000) >> 20) - 54; }
  if (k === 0x7ff) return x + x;
  k = k + n;
  if (k > 0x7fe) return huge * (x < 0 ? -huge : huge);
  if (k > 0) return make((hi(x) & 0x800fffff) | (k << 20), lo(x));
  if (k <= -54) return tiny * (x < 0 ? -tiny : tiny);
  k += 54;
  return make((hi(x) & 0x800fffff) | (k << 20), lo(x)) * twom54;
}

function pow(x, y) {
  let z, ax, z_h, z_l, p_h, p_l, y1, t1, t2, r, s, t, u, v, w;
  let i, j, k, yisint, n, hx, hy, ix, iy, lx, ly;
  hx = hi(x); lx = lo(x) >>> 0; hy = hi(y); ly = lo(y) >>> 0;
  ix = hx & 0x7fffffff; iy = hy & 0x7fffffff;
  if ((iy | ly) === 0) return 1.0;
  if (ix > 0x7ff00000 || (ix === 0x7ff00000 && lx !== 0) || iy > 0x7ff00000 || (iy === 0x7ff00000 && ly !== 0)) return x + y;
  yisint = 0;
  if (hx < 0) {
    if (iy >= 0x43400000) yisint = 2;
    else if (iy >= 0x3ff00000) {
      k = (iy >> 20) - 0x3ff;
      if (k > 20) { j = ly >>> (52 - k); if (((j << (52 - k)) >>> 0) === ly) yisint = 2 - (j & 1); }
      else if (ly === 0) { j = iy >> (20 - k); if ((j << (20 - k)) === iy) yisint = 2 - (j & 1); }
    }
  }
  if (ly === 0) {
    if (iy === 0x7ff00000) {
      if (((ix - 0x3ff00000) | lx) === 0) return y - y;
      else if (ix >= 0x3ff00000) return (hy >= 0) ? y : 0.0;
      else return (hy < 0) ? -y : 0.0;
    }
    if (iy === 0x3ff00000) return hy < 0 ? 1 / x : x;
    if (hy === 0x40000000) return x * x;
    if (hy === 0x3fe00000) { if (hx >= 0) return Math.sqrt(x); }
  }
  ax = Math.abs(x);
  if (lx === 0) {
    if (ix === 0x7ff00000 || ix === 0 || ix === 0x3ff00000) {
      z = ax;
      if (hy < 0) z = 1.0 / z;
      if (hx < 0) {
        if (((ix - 0x3ff00000) | yisint) === 0) z = (z - z) / (z - z);
        else if (yisint === 1) z = -z;
      }
      return z;
    }
  }
  n = (hx >> 31) + 1;
  if ((n | yisint) === 0) return (x - x) / (x - x);
  s = 1.0;
  if ((n | (yisint - 1)) === 0) s = -1.0;
  if (iy > 0x41e00000) {
    if (iy > 0x43f00000) {
      if (ix <= 0x3fefffff) return (hy < 0) ? huge * huge : tiny * tiny;
      if (ix >= 0x3ff00000) return (hy > 0) ? huge * huge : tiny * tiny;
    }
    if (ix < 0x3fefffff) return (hy < 0) ? s * huge * huge : s * tiny * tiny;
    if (ix > 0x3ff00000) return (hy > 0) ? s * huge * huge : s * tiny * tiny;
    t = ax - 1.0;
    w = (t * t) * (0.5 - t * (0.3333333333333333333333 - t * 0.25));
    u = ivln2_h * t;
    v = t * ivln2_l - w * ivln2;
    t1 = setLo0(u + v);
    t2 = v - (t1 - u);
  } else {
    let ss, s2, s_h, s_l, t_h, t_l;
    n = 0;
    if (ix < 0x00100000) { ax *= two53; n -= 53; ix = hi(ax); }
    n += ((ix) >> 20) - 0x3ff;
    j = ix & 0x000fffff;
    ix = j | 0x3ff00000;
    if (j <= 0x3988E) k = 0;
    else if (j < 0xBB67A) k = 1;
    else { k = 0; n += 1; ix -= 0x00100000; }
    ax = make(ix, lo(ax));
    u = ax - bp[k];
    v = 1.0 / (ax + bp[k]);
    ss = u * v;
    s_h = setLo0(ss);
    t_h = make(((ix >> 1) | 0x20000000) + 0x00080000 + (k << 18), 0);
    t_l = ax - (t_h - bp[k]);
    s_l = v * ((u - s_h * t_h) - s_h * t_l);
    s2 = ss * ss;
    r = s2 * s2 * (L1 + s2 * (L2 + s2 * (L3 + s2 * (L4 + s2 * (L5 + s2 * L6)))));
    r += s_l * (s_h + ss);
    s2 = s_h * s_h;
    t_h = setLo0(3.0 + s2 + r);
    t_l = r - ((t_h - 3.0) - s2);
    u = s_h * t_h;
    v = s_l * t_h + t_l * ss;
    p_h = setLo0(u + v);
    p_l = v - (p_h - u);
    const z_h0 = cp_h * p_h;
    const z_l0 = cp_l * p_h + p_l * cp + dp_l[k];
    t = n;
    t1 = setLo0(((z_h0 + z_l0) + dp_h[k]) + t);
    t2 = z_l0 - (((t1 - t) - dp_h[k]) - z_h0);
  }
  y1 = setLo0(y);
  p_l = (y - y1) * t1 + y * t2;
  p_h = y1 * t1;
  z = p_l + p_h;
  j = hi(z); i = lo(z) >>> 0;
  if (j >= 0x40900000) {
    if (((j - 0x40900000) | i) !== 0) return s * huge * huge;
    else if (p_l + ovt > z - p_h) return s * huge * huge;
  } else if ((j & 0x7fffffff) >= 0x4090cc00) {
    if (((j - 0xc090cc00) | i) !== 0) return s * tiny * tiny;
    else if (p_l <= z - p_h) return s * tiny * tiny;
  }
  i = j & 0x7fffffff;
  k = (i >> 20) - 0x3ff;
  n = 0;
  if (i > 0x3fe00000) {
    n = j + (0x00100000 >> (k + 1));
    k = ((n & 0x7fffffff) >> 20) - 0x3ff;
    t = make(n & ~(0x000fffff >> k), 0);
    n = ((n & 0x000fffff) | 0x00100000) >> (20 - k);
    if (j < 0) n = -n;
    p_h -= t;
  }
  t = setLo0(p_l + p_h);
  u = t * lg2_h;
  v = (p_l - (t - p_h)) * lg2 + t * lg2_l;
  z = u + v;
  w = v - (z - u);
  t = z * z;
  t1 = z - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))));
  r = (z * t1) / (t1 - 2.0) - (w + z * w);
  z = 1.0 - (r - z);
  j = hi(z);
  j += (n << 20);
  if ((j >> 20) <= 0) z = scalbn(z, n);
  else z = make(j, lo(z));
  return s * z;
}
module.exports = pow;
