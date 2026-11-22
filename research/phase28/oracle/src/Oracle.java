// Runs the ORIGINAL Billiard.apk engine bytecode (dex2jar of the shipped DEX) headless,
// with only Android framework classes stubbed. Prints one JSON line per scenario:
// table geometry, collision objects, pockets, rack, and per-frame ball positions.
//
// Usage: java Oracle W H gameType frameMs scenario...
//   scenario = "angleDeg:speed[:cueX:cueY]"  (speed in native k7 units per step-unit)
import java.lang.reflect.*;
import java.util.*;

public class Oracle {
  static vh MODE = vh.b; static ac DIFF = ac.f; static int RULES = 2;
  static sun.misc.Unsafe U;
  static Object alloc(Class<?> c) throws Exception { return U.allocateInstance(c); }
  static void set(Object o, String f, Object v) throws Exception {
    Class<?> c = o instanceof Class ? (Class<?>) o : o.getClass();
    Field fl = null;
    for (Class<?> k = c; k != null && fl == null; k = k.getSuperclass())
      try { fl = k.getDeclaredField(f); } catch (NoSuchFieldException e) {}
    fl.setAccessible(true);
    if (Modifier.isFinal(fl.getModifiers()) && !Modifier.isStatic(fl.getModifiers())) {
      long off = U.objectFieldOffset(fl);
      if (fl.getType() == double.class) U.putDouble(o, off, (Double) v);
      else if (fl.getType() == int.class) U.putInt(o, off, (Integer) v);
      else if (fl.getType() == boolean.class) U.putBoolean(o, off, (Boolean) v);
      else U.putObject(o, off, v);
      return;
    }
    fl.set(o instanceof Class ? null : o, v);
  }
  static StringBuilder out = new StringBuilder();
  static String arr(double[] a) { StringBuilder b = new StringBuilder("["); for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(a[i]); } return b.append(']').toString(); }

  public static void main(String[] args) throws Exception {
    Field uf = sun.misc.Unsafe.class.getDeclaredField("theUnsafe"); uf.setAccessible(true); U = (sun.misc.Unsafe) uf.get(null);
    double W = Double.parseDouble(args[0]), H = Double.parseDouble(args[1]);
    int gameType = Integer.parseInt(args[2]);          // t40.P value used by the app (see dump)
    double frameMs = Double.parseDouble(args[3]);
    int speedSetting = 1; // fresh install game_speed
    ArrayList<String> scen = new ArrayList<>();
    for (int i = 4; i < args.length; i++) { if (args[i].startsWith("mode=")) { String m = args[i].substring(5); MODE = m.equals("single") ? vh.a : m.equals("pvc") ? vh.c : vh.b; DIFF = m.equals("single") ? ac.e : m.equals("pvc") ? ac.c : ac.f; } else if (args[i].startsWith("diff=")) { String q = args[i].substring(5); DIFF = q.equals("easy") ? ac.b : q.equals("hard") ? ac.d : ac.c; } else if (args[i].startsWith("rules=")) RULES = Integer.parseInt(args[i].substring(6)); else if (args[i].startsWith("speed=")) speedSetting = Integer.parseInt(args[i].substring(6)); else scen.add(args[i]); }

    // y7.b(GameActivity): screen metrics (portrait, no insets).
    y7.c = W; y7.d = H; y7.z = W >= H;
    br b = W > H ? br.a(W, H) : br.a(H, W);
    if (!(W > H)) { double t = b.a; b.a = b.b; b.b = t; }
    y7.b = b; y7.y = b.c;
    y7.g = 18 * y7.y; y7.h = 50 * y7.y; y7.i = 3 * y7.y; y7.j = 9 * y7.y; y7.l = 40 * y7.y; y7.m = 30 * y7.y; y7.n = y7.h;
    // GameActivity.onResume defaults for a fresh install, English locale, versionCode 40.
    t40.i = true; t40.j = true; t40.g = true; t40.V = RULES; t40.l = speedSetting;
    t40.n = false; t40.m = true; t40.o = 1; t40.W = 0; t40.T = 0; t40.c = 2; t40.S = 0;
    t40.P = gameType;
    t40.v(t40.y(MODE)); // GameActivity: t40.v(t40.y(mode))

    wh view = (wh) alloc(wh.class);
    set(view, "D", null);
    mt table = new mt(view);
    set(view, "b", table);
    // wh.s(): balls, rule objects and collision lists, as the original orders them.
    int nb = t40.p() ? u7.d.length : u7.e.length;
    android.graphics.Bitmap[] bm = new android.graphics.Bitmap[nb];
    for (int i = 0; i < nb; i++) bm[i] = new android.graphics.Bitmap(50, 50);
    set(view, "l", bm); set(view, "k", new android.graphics.Bitmap(50, 50));
    set(view, "G", alloc(mc.class));
    ArrayList<k7> balls = new ArrayList<>();
    set(view, "a", balls);
    balls.add(new k7(view, bm[0], mt.m0[0], 0, 0));
    if (t40.p()) {
      int[] order = {1, 9, 2, 3, 8, 10, 11, 4, 12, 5, 6, 13, 14, 7, 15};
      for (int i2 = 0; i2 < 15; i2++) {
        int i4 = order[i2]; int grp = (i4 >= 1 && i4 <= 7) ? 1 : (i4 >= 9 && i4 <= 15) ? 2 : (i4 == 8 ? 3 : 0);
        balls.add(new k7(view, bm[u7.f[grp]], mt.m0[i2 + 1], i4, grp));
      }
    } else {
      for (int i6 = 1; i6 <= mt.m0.length - 1; i6++) balls.add(new k7(view, bm[i6], mt.m0[i6], i6, -300));
    }
    ArrayList<k7> re = new ArrayList<>();
    for (int i7 = 0; i7 < 16; i7++) re.add(balls.get(x00.d[i7]));
    balls.clear(); balls.addAll(re);
    for (k7 kk : balls) kk.r = balls;
    view.f = balls.get(0); balls.get(0).m = true; // ha.f(cue): striker flag
    x00.c = true;
    ((mc) view.G).a = 1; ((mc) view.G).d = 15.0; k7.J = 15.0 * 0.006375;
    view.V = MODE; view.setDifficulty(DIFF);
    table.q(t40.y(view.V));
    table.q = view.a; table.r.clear();
    for (k7 kk : balls) table.r.add(kk.E);
    table.s.clear(); table.s.addAll(table.j); table.s.addAll(table.q);
    table.t.clear(); table.t.addAll(table.j); table.t.addAll(table.r);
    set(view, "S", alloc(android.widget.TextView.class)); set(view, "T", alloc(android.widget.TextView.class));
    set(view, "C", alloc(com.andregal.android.poolbilliard.GameActivity.class));
    ho b0 = new ho(false, view.S, true, view.a, view);
    ho c0 = new ho(false, view.S, false, view.a, view);
    view.b0 = b0; view.c0 = c0; view.d0 = b0; view.e0 = c0; b0.B = c0; c0.B = b0;
    ArrayList<String> dump = new ArrayList<>();
    dump.add("\"mode\":\"" + MODE + "\",\"diff\":\"" + DIFF.a + "\",\"rules\":" + RULES + ",\"W\":" + W + ",\"H\":" + H + ",\"P\":" + t40.P + ",\"speedSetting\":" + speedSetting);
    dump.add("\"k7\":{\"K\":" + k7.K + ",\"L\":" + k7.L + ",\"M\":" + k7.M + ",\"N\":" + k7.N + ",\"T\":" + k7.T + ",\"U\":" + k7.U + ",\"V\":" + k7.V + ",\"W\":" + k7.W + ",\"f0\":" + k7.f0 + ",\"y7a\":" + y7.a + "}");
    dump.add("\"mt\":{\"u\":" + mt.u + ",\"v\":" + mt.v + ",\"F\":" + mt.F + ",\"G\":" + mt.G + ",\"P\":" + mt.P + ",\"Q\":" + mt.Q + ",\"R\":" + mt.R + ",\"S\":" + mt.S + ",\"z\":" + mt.z + ",\"B\":" + mt.B + ",\"D\":" + mt.D + ",\"b0\":" + mt.b0 + "}");
    StringBuilder rack = new StringBuilder("[");
    for (int i = 0; i < mt.m0.length; i++) { if (i > 0) rack.append(','); rack.append(arr(mt.m0[i])); }
    dump.add("\"rack\":" + rack + "]");
    StringBuilder pk = new StringBuilder("[");
    for (int i = 0; i < table.n.size(); i++) { ei e = (ei) table.n.get(i); if (i > 0) pk.append(','); pk.append("{\"a\":" + e.a + ",\"x\":" + e.b + ",\"y\":" + e.c + ",\"d\":" + e.d + ",\"e\":" + e.e + "}"); }
    dump.add("\"pockets\":" + pk + "]");
    dump.add("\"J\":" + k7.J);
    // Collision objects in mt.j order (ex = cushion segment, ea = jaw point).
    StringBuilder co = new StringBuilder("[");
    for (int i = 0; i < table.j.size(); i++) {
      Object o = table.j.get(i); if (i > 0) co.append(',');
      if (o instanceof ex) { ex e = (ex) o; co.append("{\"t\":\"ex\",\"id\":" + e.a + ",\"b\":" + e.b + ",\"i\":" + e.i + ",\"c\":" + e.c + ",\"d\":" + e.d + ",\"e\":" + e.e + ",\"f\":" + e.f + ",\"g\":" + e.g + ",\"h\":" + e.h + ",\"j\":" + e.j + ",\"k\":" + e.k + "}"); }
      else if (o instanceof ea) { ea e = (ea) o; co.append("{\"t\":\"ea\",\"id\":" + e.a + ",\"b\":" + e.b + ",\"c\":" + e.c + ",\"d\":" + e.d + "}"); }
      else co.append("{\"t\":\"" + o.getClass().getName() + "\"}");
    }
    dump.add("\"objects\":" + co + "]");
    String[] names = {"d0","e0","f0","g0","h0","i0","j0","k0","W","X","Z","a0","V","Y"};
    StringBuilder mo = new StringBuilder("{");
    for (int i = 0; i < names.length; i++) { Field f = mt.class.getField(names[i]); double[] v = (double[]) f.get(null); if (i > 0) mo.append(','); mo.append("\"" + names[i] + "\":" + (v == null ? "null" : arr(v))); }
    dump.add("\"mouth\":" + mo + "}");
    dump.add("\"si\":{\"A\":" + si.A + ",\"B\":" + si.B + "},\"O\":" + k7.O + ",\"y7z\":" + y7.z + ",\"ballV\":" + balls.get(0).l + ",\"ei\":{\"f\":" + ei.f + ",\"g\":" + ei.g + ",\"h\":" + ei.h + ",\"i\":" + ei.i + ",\"k\":" + ei.k + ",\"l\":" + ei.l + "},\"g0\":" + k7.g0);
    StringBuilder ord = new StringBuilder("[");
    for (int i = 0; i < balls.size(); i++) { if (i > 0) ord.append(','); ord.append("[" + balls.get(i).z + "," + balls.get(i).A + "," + balls.get(i).c + "," + balls.get(i).d + "]"); }
    dump.add("\"balls\":" + ord + "]");
    dump.add("\"x00\":{\"d\":" + Arrays.toString(x00.d) + ",\"g\":" + Arrays.toString(x00.g) + ",\"h\":" + Arrays.toString(x00.h) + ",\"i\":" + Arrays.toString(x00.i) + ",\"j\":" + Arrays.toString(x00.j) + ",\"e\":" + Arrays.deepToString(x00.e) + ",\"f\":" + Arrays.deepToString(x00.f) + "}");
    // One shot: "power:angleDeg" -> ia.a velocity formula, cue ball at its rack spot (no break jitter).
    StringBuilder fr = new StringBuilder("[");
    if (!scen.isEmpty()) {
      String[] sc = scen.get(0).split(":");
      double power = Double.parseDouble(sc[0]), angle = Double.parseDouble(sc[1]);
      if (sc.length >= 4) { balls.get(0).p(Double.parseDouble(sc[2]), Double.parseDouble(sc[3])); }
      double v = Math.pow(power, 1.12) * ia.i * 400.0 * k7.W;
      if (x00.c && ia.i < 2.0 && t40.i) v *= 1.2;
      k7 cue = balls.get(0); cue.b = false; cue.u(v, angle);
      b0.d++; b0.A++; view.H = x00.c;
      k7.J = frameMs * 0.006375;
      String trace = System.getenv("TRACE_FRAME");
      int traceFrame = trace == null ? -1 : Integer.parseInt(trace);
      for (int f = 0; f < 3000; f++) {
        for (k7 kk : balls) {
          kk.k();
          if (f == traceFrame) {
            StringBuilder t = new StringBuilder("TRACE after " + kk.z + ":");
            for (k7 q : balls) t.append(" ").append(q.z).append("=").append(Long.toHexString(Double.doubleToRawLongBits(q.c))).append(",").append(Long.toHexString(Double.doubleToRawLongBits(q.d))).append(",").append(Long.toHexString(Double.doubleToRawLongBits(q.i))).append(",").append(Long.toHexString(Double.doubleToRawLongBits(q.j))).append(",").append(Long.toHexString(Double.doubleToRawLongBits(q.u)));
            System.err.println(t);
          }
        }
        if (((k7) java.util.Collections.max(balls)).k < k7.U) for (k7 kk : balls) kk.t(0, 0);
        if (f > 0) fr.append(',');
        fr.append('[');
        for (int i = 0; i < balls.size(); i++) { k7 kk = balls.get(i); if (i > 0) fr.append(','); fr.append(kk.z + "," + kk.c + "," + kk.d + "," + (kk.n ? 1 : 0)); }
        fr.append(']');
        boolean moving = false; for (k7 kk : balls) if (kk.k != 0 && !kk.n) moving = true;
        if (!moving) break;
      }
    }
    dump.add("\"frames\":" + fr + "]");
    System.out.println("{" + String.join(",", dump) + "}");
  }
}
