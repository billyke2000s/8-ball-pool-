// AUTO-GENERATED from JADX fallback output of l30.m() by fallback_to_js.py. Do not edit.
function isZ(v) { return v === 0 || v === null || v === false || v === undefined; }
function l30_m(r13, r14, r16) {
  let r0, r1, r2, r3, r4, r5, r17, r19, r21, r23, r25, r27, r29, r31, r33, r35, r37, r39, r40, r41, r42, r43, r44, r45, r46, r47;
  let pc = 'start';
  for (;;) switch (pc) {
   case 'start':
    r0 = gm.c;
    r45 = r0;
    r0 = r16;
    r0 = r0.length;
    r40 = r0;
    r0 = 0;
    r44 = r0;
    r0 = (Infinity);
    r19 = r0;
    r0 = 0;
    r39 = r0;
   case 'L16':
    r0 = r39;
    r1 = r40;
    if (r0 >= r1) { pc='Le5'; continue; }
    r0 = r16;
    r1 = r39;
    r0 = r0[r1];
    r46 = r0;
    r39 = r39 + 1;
    r0 = r46;
    r0 = r0;
    r46 = r0;
    r0 = r13;
    r0 = r0.a;
    r1 = r46;
    r1 = r1.a;
    if (r0 != r1) { pc='L3e'; continue; }
   case 'L3b':
    pc='Le2'; continue;
   case 'L3e':
    r0 = r46;
    r0 = r0.b;
    if (isZ(r0)) { pc='L49'; continue; }
    pc='L3b'; continue;
   case 'L49':
    r0 = r46;
    r1 = r13;
    r0 = r0.b_(r1);
    r47 = r0;
    r0 = r47;
    if (!isZ(r0)) { pc='L5e'; continue; }
    r0 = (Infinity);
    r17 = r0;
    pc='La2'; continue;
   case 'L5e':
    r0 = r47;
    r1 = 0;
    r0 = r0[r1];
    r1 = r47;
    r2 = 1;
    r1 = r1[r2];
    r0 = Math.min(r0, r1);
    r21 = r0;
    r0 = r21;
    r1 = 0;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L7a'; continue; }
    r0 = (Infinity);
    r17 = r0;
    pc='La2'; continue;
   case 'L7a':
    r0 = r21;
    r1 = (1.0E-10);
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L89'; continue; }
    r0 = 0;
    r17 = r0;
    pc='La2'; continue;
   case 'L89':
    r0 = r13;
    r0 = r0.C;
    if (isZ(r0)) { pc='L96'; continue; }
    r0 = (1.0);
    r17 = r0;
    pc='L9b'; continue;
   case 'L96':
    r0 = (0.9999);
    r17 = r0;
   case 'L9b':
    r0 = r21;
    r1 = r17;
    r0 = r0 * r1;
    r17 = r0;
   case 'La2':
    r0 = r17;
    r1 = (Infinity);
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (!isZ(r0)) { pc='Lae'; continue; }
    pc='Le2'; continue;
   case 'Lae':
    r0 = r17;
    r1 = 0;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (!isZ(r0)) { pc='Lc8'; continue; }
    r0 = r13;
    r1 = 0;
    r0.u = r1;
    r0 = new GM();
    r1 = r0;
    r2 = 0;
    r3 = r46;
    r1.init(r2, r3);
    r16 = r0;
    pc='L10e'; continue;
   case 'Lc8':
    r0 = r17;
    r1 = r14;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 > 0) { pc='Le2'; continue; }
    r0 = r17;
    r1 = r19;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='Le2'; continue; }
    r0 = r46;
    r44 = r0;
    r0 = r17;
    r19 = r0;
    pc='L16'; continue;
   case 'Le2':
    pc='L16'; continue;
   case 'Le5':
    r0 = r44;
    if (isZ(r0)) { pc='L10b'; continue; }
    r0 = r19;
    r1 = (Infinity);
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (!isZ(r0)) { pc='Lf6'; continue; }
    pc='L10b'; continue;
   case 'Lf6':
    r0 = r13;
    r1 = r19;
    r0.u = r1;
    r0 = new GM();
    r1 = r0;
    r2 = r19;
    r3 = r44;
    r1.init(r2, r3);
    r16 = r0;
    pc='L10e'; continue;
   case 'L10b':
    r0 = r45;
    r16 = r0;
   case 'L10e':
    r0 = 1;
    r40 = r0;
    r0 = 0;
    r39 = r0;
    r0 = r13;
    r0 = r0.C;
    if (!isZ(r0)) { pc='L7cf'; continue; }
    r0 = r16;
    r1 = r45;
    if (r0 == r1) { pc='L7cf'; continue; }
    r0 = r16;
    r0 = r0.a;
    r14 = r0;
    r0 = r14;
    r1 = 0;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 <= 0) { pc='L7cf'; continue; }
    r0 = 0;
    r43 = r0;
   case 'L12f':
    r0 = r43;
    r1 = 10;
    if (r0 >= r1) { pc='L7c8'; continue; }
    r0 = r13;
    r0 = r0.c;
    r17 = r0;
    r0 = r13;
    r0 = r0.i;
    r1 = r14;
    r0 = r0 * r1;
    r1 = r17;
    r0 = r0 + r1;
    r17 = r0;
    r0 = r13;
    r0 = r0.d;
    r19 = r0;
    r0 = r13;
    r0 = r0.j;
    r1 = r14;
    r0 = r0 * r1;
    r1 = r19;
    r0 = r0 + r1;
    r19 = r0;
    r0 = r17;
    r1 = r19;
    r0 = mt.j(r0, r1);
    if (!isZ(r0)) { pc='L788'; continue; }
    r0 = si.B;
    r23 = r0;
    r0 = k7.O;
    r21 = r0;
    r0 = mt.d0;
    r44 = r0;
    r0 = r44;
    r1 = r39;
    r0 = r0[r1];
    r25 = r0;
    r0 = r44;
    r1 = r40;
    r0 = r0[r1];
    r29 = r0;
    r0 = mt.e0;
    r44 = r0;
    r0 = r44;
    r1 = r39;
    r0 = r0[r1];
    r27 = r0;
    r0 = r44;
    r1 = r40;
    r0 = r0[r1];
    r31 = r0;
    r0 = k7.K;
    r33 = r0;
    r0 = r17;
    r1 = r33;
    r0 = r0 + r1;
    r33 = r0;
    r0 = r19;
    r1 = k7.K;
    r0 = r0 + r1;
    r37 = r0;
    r0 = r37;
    r1 = r33;
    r2 = r29;
    r1 = r1 + r2;
    r2 = r25;
    r1 = r1 - r2;
    r2 = r21;
    r1 = r1 - r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 > 0) { pc='L1f4'; continue; }
    r0 = r37;
    r1 = r33;
    r2 = r31;
    r1 = r1 + r2;
    r2 = r27;
    r1 = r1 - r2;
    r2 = r21;
    r1 = r1 + r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 < 0) { pc='L1f4'; continue; }
    r0 = r33;
    r0 = -r0;
    r1 = r25;
    r0 = r0 + r1;
    r1 = r29;
    r0 = r0 + r1;
    r35 = r0;
    r0 = r37;
    r1 = r35;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 > 0) { pc='L1f4'; continue; }
    r0 = r37;
    r1 = r35;
    r2 = r23;
    r3 = (2.0);
    r2 = r2 * r3;
    r1 = r1 - r2;
    r2 = r21;
    r1 = r1 + r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 < 0) { pc='L1f4'; continue; }
    r0 = r40;
    r41 = r0;
    pc='L23b'; continue;
   case 'L1f4':
    r0 = r33;
    r1 = r25;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 <= 0) { pc='L237'; continue; }
    r0 = r33;
    r1 = r27;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L237'; continue; }
    r0 = r37;
    r1 = r29;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L237'; continue; }
    r0 = r37;
    r1 = r31;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 <= 0) { pc='L237'; continue; }
    r0 = r37;
    r1 = r33;
    r1 = -r1;
    r2 = r25;
    r1 = r1 + r2;
    r2 = r29;
    r1 = r1 + r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 < 0) { pc='L237'; continue; }
    r0 = r33;
    r1 = r37;
    r2 = r25;
    r3 = r29;
    r4 = r27;
    r5 = r31;
    r0 = si.i(r0, r1, r2, r3, r4, r5);
    r41 = r0;
    pc='L23b'; continue;
   case 'L237':
    r0 = r39;
    r41 = r0;
   case 'L23b':
    r0 = r41;
    if (!isZ(r0)) { pc='L785'; continue; }
    r0 = si.B;
    r31 = r0;
    r0 = k7.O;
    r25 = r0;
    r0 = mt.f0;
    r44 = r0;
    r0 = r44;
    r1 = r39;
    r0 = r0[r1];
    r21 = r0;
    r0 = r44;
    r1 = r40;
    r0 = r0[r1];
    r29 = r0;
    r0 = mt.g0;
    r44 = r0;
    r0 = r44;
    r1 = r39;
    r0 = r0[r1];
    r23 = r0;
    r0 = r44;
    r1 = r40;
    r0 = r0[r1];
    r35 = r0;
    r0 = r17;
    r1 = k7.K;
    r0 = r0 + r1;
    r27 = r0;
    r0 = r19;
    r1 = k7.K;
    r0 = r0 + r1;
    r33 = r0;
    r0 = r40;
    r41 = r0;
    r0 = r27;
    r0 = -r0;
    r37 = r0;
    r0 = r33;
    r1 = r37;
    r2 = r21;
    r1 = r1 + r2;
    r2 = r29;
    r1 = r1 + r2;
    r2 = r25;
    r1 = r1 - r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 > 0) { pc='L2d6'; continue; }
    r0 = r33;
    r1 = r37;
    r2 = r23;
    r1 = r1 + r2;
    r2 = r35;
    r1 = r1 + r2;
    r2 = r25;
    r1 = r1 + r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 < 0) { pc='L2d6'; continue; }
    r0 = r27;
    r1 = r21;
    r0 = r0 - r1;
    r1 = r29;
    r0 = r0 + r1;
    r37 = r0;
    r0 = r33;
    r1 = r37;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 > 0) { pc='L2d6'; continue; }
    r0 = r33;
    r1 = r37;
    r2 = r31;
    r3 = (2.0);
    r2 = r2 * r3;
    r1 = r1 - r2;
    r2 = r25;
    r1 = r1 + r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 < 0) { pc='L2d6'; continue; }
    r0 = r41;
    r42 = r0;
    pc='L31c'; continue;
   case 'L2d6':
    r0 = r27;
    r1 = r23;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 <= 0) { pc='L318'; continue; }
    r0 = r27;
    r1 = r21;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L318'; continue; }
    r0 = r33;
    r1 = r29;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L318'; continue; }
    r0 = r33;
    r1 = r35;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 <= 0) { pc='L318'; continue; }
    r0 = r33;
    r1 = r27;
    r2 = r21;
    r1 = r1 - r2;
    r2 = r29;
    r1 = r1 + r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 < 0) { pc='L318'; continue; }
    r0 = r27;
    r1 = r33;
    r2 = r21;
    r3 = r29;
    r4 = r23;
    r5 = r35;
    r0 = si.i(r0, r1, r2, r3, r4, r5);
    r42 = r0;
    pc='L31c'; continue;
   case 'L318':
    r0 = r39;
    r42 = r0;
   case 'L31c':
    r0 = r42;
    if (!isZ(r0)) { pc='L77e'; continue; }
    r0 = si.B;
    r31 = r0;
    r0 = k7.O;
    r37 = r0;
    r0 = mt.h0;
    r44 = r0;
    r0 = r44;
    r1 = r39;
    r0 = r0[r1];
    r27 = r0;
    r0 = r44;
    r1 = r41;
    r0 = r0[r1];
    r25 = r0;
    r0 = mt.i0;
    r44 = r0;
    r0 = r44;
    r1 = r39;
    r0 = r0[r1];
    r21 = r0;
    r0 = r44;
    r1 = r41;
    r0 = r0[r1];
    r23 = r0;
    r0 = r17;
    r1 = k7.K;
    r0 = r0 + r1;
    r29 = r0;
    r0 = r19;
    r1 = k7.K;
    r0 = r0 + r1;
    r33 = r0;
    r0 = r33;
    r1 = r29;
    r2 = r25;
    r1 = r1 + r2;
    r2 = r27;
    r1 = r1 - r2;
    r2 = r37;
    r1 = r1 - r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 > 0) { pc='L3af'; continue; }
    r0 = r33;
    r1 = r29;
    r2 = r23;
    r1 = r1 + r2;
    r2 = r21;
    r1 = r1 - r2;
    r2 = r37;
    r1 = r1 + r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 < 0) { pc='L3af'; continue; }
    r0 = r29;
    r0 = -r0;
    r1 = r27;
    r0 = r0 + r1;
    r1 = r25;
    r0 = r0 + r1;
    r35 = r0;
    r0 = r33;
    r1 = r35;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 < 0) { pc='L3af'; continue; }
    r0 = r33;
    r1 = r31;
    r2 = (2.0);
    r1 = r1 * r2;
    r2 = r35;
    r1 = r1 + r2;
    r2 = r37;
    r1 = r1 - r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 > 0) { pc='L3af'; continue; }
    r0 = r41;
    r42 = r0;
    pc='L3f6'; continue;
   case 'L3af':
    r0 = r29;
    r1 = r27;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 <= 0) { pc='L3f2'; continue; }
    r0 = r29;
    r1 = r21;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L3f2'; continue; }
    r0 = r33;
    r1 = r25;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L3f2'; continue; }
    r0 = r33;
    r1 = r23;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 <= 0) { pc='L3f2'; continue; }
    r0 = r33;
    r1 = r29;
    r1 = -r1;
    r2 = r27;
    r1 = r1 + r2;
    r2 = r25;
    r1 = r1 + r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 > 0) { pc='L3f2'; continue; }
    r0 = r29;
    r1 = r33;
    r2 = r27;
    r3 = r25;
    r4 = r21;
    r5 = r23;
    r0 = si.i(r0, r1, r2, r3, r4, r5);
    r42 = r0;
    pc='L3f6'; continue;
   case 'L3f2':
    r0 = r39;
    r42 = r0;
   case 'L3f6':
    r0 = r42;
    if (!isZ(r0)) { pc='L77e'; continue; }
    r0 = si.B;
    r23 = r0;
    r0 = k7.O;
    r29 = r0;
    r0 = mt.j0;
    r44 = r0;
    r0 = r44;
    r1 = r39;
    r0 = r0[r1];
    r21 = r0;
    r0 = r44;
    r1 = r41;
    r0 = r0[r1];
    r35 = r0;
    r0 = mt.k0;
    r44 = r0;
    r0 = r44;
    r1 = r39;
    r0 = r0[r1];
    r25 = r0;
    r0 = r44;
    r1 = r41;
    r0 = r0[r1];
    r33 = r0;
    r0 = r17;
    r1 = k7.K;
    r0 = r0 + r1;
    r27 = r0;
    r0 = r19;
    r1 = k7.K;
    r0 = r0 + r1;
    r31 = r0;
    r0 = r27;
    r0 = -r0;
    r37 = r0;
    r0 = r31;
    r1 = r37;
    r2 = r21;
    r1 = r1 + r2;
    r2 = r35;
    r1 = r1 + r2;
    r2 = r29;
    r1 = r1 - r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 > 0) { pc='L48d'; continue; }
    r0 = r31;
    r1 = r37;
    r2 = r25;
    r1 = r1 + r2;
    r2 = r33;
    r1 = r1 + r2;
    r2 = r29;
    r1 = r1 + r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 < 0) { pc='L48d'; continue; }
    r0 = r27;
    r1 = r21;
    r0 = r0 - r1;
    r1 = r35;
    r0 = r0 + r1;
    r37 = r0;
    r0 = r31;
    r1 = r37;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 < 0) { pc='L48d'; continue; }
    r0 = r31;
    r1 = r23;
    r2 = (2.0);
    r1 = r1 * r2;
    r2 = r37;
    r1 = r1 + r2;
    r2 = r29;
    r1 = r1 - r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 > 0) { pc='L48d'; continue; }
    r0 = r41;
    r42 = r0;
    pc='L4d3'; continue;
   case 'L48d':
    r0 = r27;
    r1 = r25;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 <= 0) { pc='L4cf'; continue; }
    r0 = r27;
    r1 = r21;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L4cf'; continue; }
    r0 = r31;
    r1 = r35;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L4cf'; continue; }
    r0 = r31;
    r1 = r33;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 <= 0) { pc='L4cf'; continue; }
    r0 = r31;
    r1 = r27;
    r2 = r21;
    r1 = r1 - r2;
    r2 = r35;
    r1 = r1 + r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 > 0) { pc='L4cf'; continue; }
    r0 = r27;
    r1 = r31;
    r2 = r21;
    r3 = r35;
    r4 = r25;
    r5 = r33;
    r0 = si.i(r0, r1, r2, r3, r4, r5);
    r42 = r0;
    pc='L4d3'; continue;
   case 'L4cf':
    r0 = r39;
    r42 = r0;
   case 'L4d3':
    r0 = r42;
    if (!isZ(r0)) { pc='L77e'; continue; }
    r0 = y7.z;
    if (isZ(r0)) { pc='L58a'; continue; }
    r0 = mt.W;
    r44 = r0;
    r0 = r44;
    r1 = r39;
    r0 = r0[r1];
    r27 = r0;
    r0 = r44;
    r1 = r41;
    r0 = r0[r1];
    r25 = r0;
    r0 = mt.X;
    r44 = r0;
    r0 = r44;
    r1 = r39;
    r0 = r0[r1];
    r23 = r0;
    r0 = r44;
    r1 = r41;
    r0 = r0[r1];
    r21 = r0;
    r0 = r17;
    r1 = k7.K;
    r0 = r0 + r1;
    r29 = r0;
    r0 = r19;
    r1 = k7.K;
    r0 = r0 + r1;
    r31 = r0;
    r0 = r29;
    r1 = r27;
    r2 = k7.K;
    r1 = r1 + r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 <= 0) { pc='L54b'; continue; }
    r0 = r29;
    r1 = r23;
    r2 = k7.K;
    r1 = r1 - r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L54b'; continue; }
    r0 = r31;
    r1 = r25;
    r2 = si.A;
    r1 = r1 - r2;
    r2 = k7.K;
    r1 = r1 + r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 <= 0) { pc='L54b'; continue; }
    r0 = r31;
    r1 = r25;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L54b'; continue; }
   case 'L544':
    r0 = r41;
    r42 = r0;
    pc='L628'; continue;
   case 'L54b':
    r0 = r29;
    r1 = r27;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 <= 0) { pc='L583'; continue; }
    r0 = r29;
    r1 = r23;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L583'; continue; }
    r0 = r31;
    r1 = r25;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 < 0) { pc='L583'; continue; }
    r0 = r31;
    r1 = r25;
    r2 = k7.K;
    r1 = r1 + r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 > 0) { pc='L583'; continue; }
    r0 = r29;
    r1 = r31;
    r2 = r27;
    r3 = r25;
    r4 = r23;
    r5 = r21;
    r0 = si.i(r0, r1, r2, r3, r4, r5);
    r42 = r0;
    pc='L628'; continue;
   case 'L583':
    r0 = r39;
    r42 = r0;
    pc='L628'; continue;
   case 'L58a':
    r0 = mt.W;
    r44 = r0;
    r0 = r44;
    r1 = r39;
    r0 = r0[r1];
    r29 = r0;
    r0 = r44;
    r1 = r41;
    r0 = r0[r1];
    r27 = r0;
    r0 = mt.X;
    r44 = r0;
    r0 = r44;
    r1 = r39;
    r0 = r0[r1];
    r21 = r0;
    r0 = r44;
    r1 = r41;
    r0 = r0[r1];
    r31 = r0;
    r0 = r17;
    r1 = k7.K;
    r0 = r0 + r1;
    r25 = r0;
    r0 = r19;
    r1 = k7.K;
    r0 = r0 + r1;
    r23 = r0;
    r0 = r25;
    r1 = r29;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 <= 0) { pc='L5f3'; continue; }
    r0 = r25;
    r1 = r29;
    r2 = si.A;
    r1 = r1 + r2;
    r2 = k7.K;
    r1 = r1 - r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L5f3'; continue; }
    r0 = r23;
    r1 = r27;
    r2 = k7.K;
    r1 = r1 + r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 <= 0) { pc='L5f3'; continue; }
    r0 = r23;
    r1 = r31;
    r2 = k7.K;
    r1 = r1 - r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L5f3'; continue; }
    pc='L544'; continue;
   case 'L5f3':
    r0 = r25;
    r1 = r29;
    r2 = k7.K;
    r1 = r1 - r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 < 0) { pc='L583'; continue; }
    r0 = r25;
    r1 = r29;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 > 0) { pc='L583'; continue; }
    r0 = r23;
    r1 = r27;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 <= 0) { pc='L583'; continue; }
    r0 = r23;
    r1 = r31;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L583'; continue; }
    r0 = r25;
    r1 = r23;
    r2 = r29;
    r3 = r27;
    r4 = r21;
    r5 = r31;
    r0 = si.i(r0, r1, r2, r3, r4, r5);
    r42 = r0;
   case 'L628':
    r0 = r42;
    if (!isZ(r0)) { pc='L77e'; continue; }
    r0 = y7.z;
    if (isZ(r0)) { pc='L6db'; continue; }
    r0 = mt.Z;
    r44 = r0;
    r0 = r44;
    r1 = r39;
    r0 = r0[r1];
    r21 = r0;
    r0 = r44;
    r1 = r41;
    r0 = r0[r1];
    r23 = r0;
    r0 = mt.a0;
    r44 = r0;
    r0 = r44;
    r1 = r39;
    r0 = r0[r1];
    r25 = r0;
    r0 = r44;
    r1 = r41;
    r0 = r0[r1];
    r29 = r0;
    r0 = r17;
    r1 = k7.K;
    r0 = r0 + r1;
    r31 = r0;
    r0 = r19;
    r1 = k7.K;
    r0 = r0 + r1;
    r27 = r0;
    r0 = r31;
    r1 = r21;
    r2 = k7.K;
    r1 = r1 + r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 <= 0) { pc='L69c'; continue; }
    r0 = r31;
    r1 = r25;
    r2 = k7.K;
    r1 = r1 - r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L69c'; continue; }
    r0 = r27;
    r1 = r23;
    r2 = si.A;
    r1 = r1 + r2;
    r2 = k7.K;
    r1 = r1 - r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L69c'; continue; }
    r0 = r27;
    r1 = r23;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 <= 0) { pc='L69c'; continue; }
   case 'L699':
    pc='L779'; continue;
   case 'L69c':
    r0 = r31;
    r1 = r21;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 <= 0) { pc='L6d4'; continue; }
    r0 = r31;
    r1 = r25;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L6d4'; continue; }
    r0 = r27;
    r1 = r23;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 > 0) { pc='L6d4'; continue; }
    r0 = r27;
    r1 = r23;
    r2 = k7.K;
    r1 = r1 - r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 < 0) { pc='L6d4'; continue; }
    r0 = r31;
    r1 = r27;
    r2 = r21;
    r3 = r23;
    r4 = r25;
    r5 = r29;
    r0 = si.i(r0, r1, r2, r3, r4, r5);
    r41 = r0;
    pc='L779'; continue;
   case 'L6d4':
    r0 = r39;
    r41 = r0;
    pc='L779'; continue;
   case 'L6db':
    r0 = mt.Z;
    r44 = r0;
    r0 = r44;
    r1 = r39;
    r0 = r0[r1];
    r29 = r0;
    r0 = r44;
    r1 = r41;
    r0 = r0[r1];
    r31 = r0;
    r0 = mt.a0;
    r44 = r0;
    r0 = r44;
    r1 = r39;
    r0 = r0[r1];
    r21 = r0;
    r0 = r44;
    r1 = r41;
    r0 = r0[r1];
    r23 = r0;
    r0 = r17;
    r1 = k7.K;
    r0 = r0 + r1;
    r27 = r0;
    r0 = r19;
    r1 = k7.K;
    r0 = r0 + r1;
    r25 = r0;
    r0 = r27;
    r1 = r29;
    r2 = si.A;
    r1 = r1 - r2;
    r2 = k7.K;
    r1 = r1 + r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 <= 0) { pc='L744'; continue; }
    r0 = r27;
    r1 = r29;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L744'; continue; }
    r0 = r25;
    r1 = r31;
    r2 = k7.K;
    r1 = r1 + r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 <= 0) { pc='L744'; continue; }
    r0 = r25;
    r1 = r23;
    r2 = k7.K;
    r1 = r1 - r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L744'; continue; }
    pc='L699'; continue;
   case 'L744':
    r0 = r27;
    r1 = r29;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 < 0) { pc='L6d4'; continue; }
    r0 = r27;
    r1 = r29;
    r2 = k7.K;
    r1 = r1 + r2;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 > 0) { pc='L6d4'; continue; }
    r0 = r25;
    r1 = r31;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 <= 0) { pc='L6d4'; continue; }
    r0 = r25;
    r1 = r23;
    r0 = (r0 > r1 ? 1 : (r0 == r1 ? 0 : -1));
    if (r0 >= 0) { pc='L6d4'; continue; }
    r0 = r27;
    r1 = r25;
    r2 = r29;
    r3 = r31;
    r4 = r21;
    r5 = r23;
    r0 = si.i(r0, r1, r2, r3, r4, r5);
    r41 = r0;
   case 'L779':
    r0 = r41;
    if (isZ(r0)) { pc='L79e'; continue; }
   case 'L77e':
    r0 = r40;
    r41 = r0;
    pc='L78c'; continue;
   case 'L785':
    pc='L77e'; continue;
   case 'L788':
    r0 = r40;
    r41 = r0;
   case 'L78c':
    r0 = r40;
    r41 = r0;
    r0 = r13;
    r1 = r17;
    r2 = r19;
    r0 = r0.m_(r1, r2);
    if (!isZ(r0)) { pc='L79e'; continue; }
    pc='L7ca'; continue;
   case 'L79e':
    r0 = new SB();
    r1 = r0;
    r2 = "w31";
    r1.init(r2);
    r44 = r0;
    r0 = r44;
    r1 = r14;
    r0 = r0.append(r1);
    r0 = "BilliardApp";
    r1 = r44;
    r1 = r1.toString();
    t00.S(r0, r1);
    r0 = r14;
    r1 = (0.99);
    r0 = r0 * r1;
    r14 = r0;
    r43 = r43 + 1;
    pc='L12f'; continue;
   case 'L7c8':
    r0 = 0;
    r14 = r0;
   case 'L7ca':
    r0 = r16;
    r1 = r14;
    r0.a = r1;
   case 'L7cf':
    r0 = r16;
    return r0;
    throw new Error('fell off end');
  }
}
