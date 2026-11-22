'use strict';
// java.* shims for dex2js output (only what the game uses; unknown members fall back to rt's
// automatic placeholders). Java Strings are JS strings: String methods live on String.prototype
// under their Java keys. Math.pow is fdlibm (see research/phase28) to match the original's JVM.
(function (rt) {
  const sh = rt.shim, O = 'Ljava/lang/Object;';
  const S = String.prototype;
  const jstr = v => (v === null || v === undefined ? 'null' : typeof v === 'string' ? v : typeof v === 'bigint' ? v.toString() : typeof v === 'number' ? String(v) : v['toString()Ljava/lang/String;']());
  rt.jstr = jstr;
  // Java Double.toString formatting (shortest repr, always with '.0' / exponent form like Java)
  rt.dstr = d => {
    if (d !== d) return 'NaN'; if (d === Infinity) return 'Infinity'; if (d === -Infinity) return '-Infinity';
    if (d === 0) return 1 / d < 0 ? '-0.0' : '0.0';
    const a = Math.abs(d);
    if (a >= 1e-3 && a < 1e7) { const s = String(d); return s.includes('.') ? s : s + '.0'; }
    let [m, e] = d.toExponential().split('e'); if (!m.includes('.')) m += '.0';
    return m + 'E' + Number(e);
  };
  rt.fstr = f => rt.dstr(Number(Math.fround(f).toPrecision(9).replace(/\.?0+e/, 'e').replace(/(\.\d*?)0+$/, '$1')));
  const def = (obj, map) => { for (const [k, v] of Object.entries(map)) Object.defineProperty(obj, k, { value: v, writable: true, configurable: true }); };
  def(S, {
    'length()I'() { return this.length; }, 'charAt(I)C'(i) { return this.charCodeAt(i); }, 'isEmpty()Z'() { return this.length === 0 ? 1 : 0; },
    'equals(Ljava/lang/Object;)Z'(o) { return typeof o === 'string' && o === String(this) ? 1 : 0; },
    'equalsIgnoreCase(Ljava/lang/String;)Z'(o) { return o != null && o.toLowerCase() === this.toLowerCase() ? 1 : 0; },
    'hashCode()I'() { let h = 0; for (let i = 0; i < this.length; i++) h = (Math.imul(31, h) + this.charCodeAt(i)) | 0; return h; },
    'toString()Ljava/lang/String;'() { return String(this); }, 'trim()Ljava/lang/String;'() { return this.replace(/^[\x00-\x20]+|[\x00-\x20]+$/g, ''); },
    'substring(I)Ljava/lang/String;'(a) { return this.substring(a); }, 'substring(II)Ljava/lang/String;'(a, b) { return this.substring(a, b); },
    'indexOf(I)I'(c) { return this.indexOf(String.fromCharCode(c)); }, 'indexOf(Ljava/lang/String;)I'(s) { return this.indexOf(s); },
    'indexOf(Ljava/lang/String;I)I'(s, i) { return this.indexOf(s, i); }, 'lastIndexOf(II)I'(c, i) { return this.lastIndexOf(String.fromCharCode(c), i); },
    'startsWith(Ljava/lang/String;)Z'(s) { return this.startsWith(s) ? 1 : 0; }, 'endsWith(Ljava/lang/String;)Z'(s) { return this.endsWith(s) ? 1 : 0; },
    'contains(Ljava/lang/CharSequence;)Z'(s) { return this.includes(jstr(s)) ? 1 : 0; }, 'concat(Ljava/lang/String;)Ljava/lang/String;'(s) { return this + s; },
    'replace(CC)Ljava/lang/String;'(a, b) { return this.split(String.fromCharCode(a)).join(String.fromCharCode(b)); },
    'replace(Ljava/lang/CharSequence;Ljava/lang/CharSequence;)Ljava/lang/String;'(a, b) { return this.split(jstr(a)).join(jstr(b)); },
    'toLowerCase()Ljava/lang/String;'() { return this.toLowerCase(); }, 'toLowerCase(Ljava/util/Locale;)Ljava/lang/String;'() { return this.toLowerCase(); },
    'toUpperCase(Ljava/util/Locale;)Ljava/lang/String;'() { return this.toUpperCase(); },
    'split(Ljava/lang/String;)[Ljava/lang/String;'(re) { const a = this.split(new RegExp(re)); while (a.length > 1 && a[a.length - 1] === '') a.pop(); return rt.filled('[Ljava/lang/String;', a); },
    'split(Ljava/lang/String;I)[Ljava/lang/String;'(re, n) { return rt.filled('[Ljava/lang/String;', this.split(new RegExp(re))); },
    'compareTo(Ljava/lang/String;)I'(o) { const n = Math.min(this.length, o.length); for (let i = 0; i < n; i++) { const d = this.charCodeAt(i) - o.charCodeAt(i); if (d) return d; } return this.length - o.length; },
    'matches(Ljava/lang/String;)Z'(re) { return new RegExp('^(?:' + re + ')$').test(this) ? 1 : 0; },
    'getBytes()[B'() { return rt.filled('[B', [...new TextEncoder().encode(String(this))].map(b => (b << 24) >> 24)); },
    'getClass()Ljava/lang/Class;'() { return rt.klass('Ljava/lang/String;'); },
    'subSequence(II)Ljava/lang/CharSequence;'(a, b) { return this.substring(a, b); },
  });
  sh('Ljava/lang/String;', null, C => {
    def(C, {
      'valueOf(Ljava/lang/Object;)Ljava/lang/String;': jstr, 'valueOf(I)Ljava/lang/String;': i => String(i), 'valueOf(J)Ljava/lang/String;': l => l.toString(),
      'valueOf(D)Ljava/lang/String;': d => rt.dstr(d), 'valueOf(Z)Ljava/lang/String;': z => (z ? 'true' : 'false'),
      'format(Ljava/lang/String;[Ljava/lang/Object;)Ljava/lang/String;': (f, a) => rt.format(f, a), 'format(Ljava/util/Locale;Ljava/lang/String;[Ljava/lang/Object;)Ljava/lang/String;': (_l, f, a) => rt.format(f, a),
    });
  });
  rt.format = (f, args) => { let i = 0; return f.replace(/%(-?\d*)(?:\.(\d+))?([dsfx%])/g, (m, w, p, t) => { if (t === '%') return '%'; const v = args[i++]; let s;
    if (t === 'd') s = typeof v === 'bigint' ? v.toString() : String(rt.unbox(v)); else if (t === 'f') s = Number(rt.unbox(v)).toFixed(p === undefined ? 6 : Number(p)); else if (t === 'x') s = (rt.unbox(v) >>> 0).toString(16); else s = jstr(v);
    const wd = Math.abs(Number(w || 0)); return w && w[0] === '-' ? s.padEnd(wd) : s.padStart(wd); }); };

  sh('Ljava/lang/StringBuilder;', O, C => {
    const P = C.prototype;
    def(P, {
      '<init>()V'() { this.$s = ''; }, '<init>(I)V'() { this.$s = ''; }, '<init>(Ljava/lang/String;)V'(s) { this.$s = s; },
      'append(Ljava/lang/String;)Ljava/lang/StringBuilder;'(s) { this.$s += jstr(s); return this; },
      'append(Ljava/lang/Object;)Ljava/lang/StringBuilder;'(s) { this.$s += jstr(s); return this; },
      'append(Ljava/lang/CharSequence;)Ljava/lang/StringBuilder;'(s) { this.$s += jstr(s); return this; },
      'append(I)Ljava/lang/StringBuilder;'(i) { this.$s += String(i); return this; }, 'append(J)Ljava/lang/StringBuilder;'(l) { this.$s += l.toString(); return this; },
      'append(D)Ljava/lang/StringBuilder;'(d) { this.$s += rt.dstr(d); return this; }, 'append(F)Ljava/lang/StringBuilder;'(f) { this.$s += rt.fstr(f); return this; },
      'append(Z)Ljava/lang/StringBuilder;'(z) { this.$s += z ? 'true' : 'false'; return this; }, 'append(C)Ljava/lang/StringBuilder;'(c) { this.$s += String.fromCharCode(c); return this; },
      'length()I'() { return this.$s.length; }, 'setLength(I)V'(n) { this.$s = this.$s.slice(0, n).padEnd(n, '\0'); },
      'deleteCharAt(I)Ljava/lang/StringBuilder;'(i) { this.$s = this.$s.slice(0, i) + this.$s.slice(i + 1); return this; },
      'delete(II)Ljava/lang/StringBuilder;'(a, b) { this.$s = this.$s.slice(0, a) + this.$s.slice(b); return this; },
      'toString()Ljava/lang/String;'() { return this.$s; },
    });
  });

  // ---- Math: Java semantics; pow = fdlibm
  sh('Ljava/lang/Math;', O, C => {
    const pow = rt.pow || Math.pow;
    def(C, {
      'abs(D)D': Math.abs, 'abs(F)F': Math.abs, 'abs(I)I': i => (i < 0 ? -i | 0 : i), 'sqrt(D)D': Math.sqrt, 'sin(D)D': x => Math.sin(x), 'cos(D)D': x => Math.cos(x), 'tan(D)D': Math.tan,
      'atan(D)D': Math.atan, 'asin(D)D': Math.asin, 'acos(D)D': Math.acos, 'atan2(DD)D': Math.atan2, 'exp(D)D': Math.exp, 'log(D)D': Math.log, 'cbrt(D)D': Math.cbrt,
      'pow(DD)D': (a, b) => (rt.pow || Math.pow)(a, b), 'hypot(DD)D': Math.hypot, 'ceil(D)D': Math.ceil, 'floor(D)D': Math.floor,
      'max(DD)D': (a, b) => (a !== a || b !== b ? NaN : Math.max(a, b)), 'min(DD)D': (a, b) => (a !== a || b !== b ? NaN : Math.min(a, b)),
      'max(FF)F': (a, b) => (a !== a || b !== b ? NaN : Math.max(a, b)), 'min(FF)F': (a, b) => (a !== a || b !== b ? NaN : Math.min(a, b)),
      'max(II)I': Math.max, 'min(II)I': Math.min, 'max(JJ)J': (a, b) => (a > b ? a : b), 'min(JJ)J': (a, b) => (a < b ? a : b),
      'round(D)J': d => (d !== d ? 0n : rt.f2l(Math.floor(d + 0.5))), 'round(F)I': f => (f !== f ? 0 : rt.f2i(Math.floor(Math.fround(f + 0.5)))),
      'random()D': () => rt.random(), 'signum(D)D': Math.sign, 'signum(F)F': Math.sign,
      'toDegrees(D)D': x => x * 57.29577951308232, 'toRadians(D)D': x => x * 0.017453292519943295, 'scalb(FI)F': (f, n) => Math.fround(f * 2 ** n),
    });
  });
  rt.random = Math.random;

  // ---- boxes
  function box(name, prim, parse) {
    sh(name, 'Ljava/lang/Number;', C => {
      const P = C.prototype;
      def(P, { [`${prim}Value()${{ int: 'I', double: 'D', float: 'F', long: 'J', boolean: 'Z', byte: 'B', short: 'S' }[prim]}`]() { return this.$v; },
        'intValue()I'() { return typeof this.$v === 'bigint' ? Number(BigInt.asIntN(32, this.$v)) : rt.f2i(this.$v); }, 'doubleValue()D'() { return Number(this.$v); },
        'floatValue()F'() { return Math.fround(Number(this.$v)); }, 'longValue()J'() { return typeof this.$v === 'bigint' ? this.$v : rt.f2l(this.$v); },
        'equals(Ljava/lang/Object;)Z'(o) { return o && o.constructor === this.constructor && o.$v === this.$v ? 1 : 0; },
        'hashCode()I'() { return typeof this.$v === 'bigint' ? Number(BigInt.asIntN(32, this.$v ^ (this.$v >> 32n))) : this.$v | 0; },
        'toString()Ljava/lang/String;'() { return prim === 'double' ? rt.dstr(this.$v) : prim === 'float' ? rt.fstr(this.$v) : prim === 'boolean' ? (this.$v ? 'true' : 'false') : String(this.$v); },
        'compareTo(Ljava/lang/Object;)I'(o) { return this.$v < o.$v ? -1 : this.$v > o.$v ? 1 : 0; } });
      const sig = { int: 'I', double: 'D', float: 'F', long: 'J', boolean: 'Z', byte: 'B', short: 'S' }[prim];
      def(C, { [`valueOf(${sig})${name}`]: v => { const o = rt.alloc(name); o.$v = v; return o; } });
      if (parse) def(C, parse);
    });
  }
  sh('Ljava/lang/Number;', O, () => {});
  box('Ljava/lang/Integer;', 'int', { 'parseInt(Ljava/lang/String;)I': s => { const n = parseInt(s, 10); if (isNaN(n)) throw rt.exc('Ljava/lang/NumberFormatException;', s); return n | 0; }, 'toString(I)Ljava/lang/String;': i => String(i), 'toHexString(I)Ljava/lang/String;': i => (i >>> 0).toString(16), 'bitCount(I)I': i => { i >>>= 0; let c = 0; while (i) { c += i & 1; i >>>= 1; } return c; } });
  box('Ljava/lang/Double;', 'double', { 'parseDouble(Ljava/lang/String;)D': s => { const d = Number(s.trim()); if (Number.isNaN(d) && s.trim() !== 'NaN') throw rt.exc('Ljava/lang/NumberFormatException;', s); return d; }, 'compare(DD)I': (a, b) => (a < b ? -1 : a > b ? 1 : 0) });
  box('Ljava/lang/Float;', 'float', { 'parseFloat(Ljava/lang/String;)F': s => Math.fround(Number(s)) });
  box('Ljava/lang/Long;', 'long', { 'parseLong(Ljava/lang/String;)J': s => BigInt(s), 'toString(J)Ljava/lang/String;': l => l.toString() });
  box('Ljava/lang/Boolean;', 'boolean', { 'parseBoolean(Ljava/lang/String;)Z': s => (s && s.toLowerCase() === 'true' ? 1 : 0), 'toString(Z)Ljava/lang/String;': z => (z ? 'true' : 'false') });
  box('Ljava/lang/Byte;', 'byte'); box('Ljava/lang/Short;', 'short');
  rt.unbox = o => (o && o.$v !== undefined ? o.$v : o);

  // ---- Throwable family
  sh('Ljava/lang/Throwable;', O, C => def(C.prototype, {
    '<init>()V'() {}, '<init>(Ljava/lang/String;)V'(m) { this.$msg = m; }, '<init>(Ljava/lang/String;Ljava/lang/Throwable;)V'(m, c) { this.$msg = m; this.$cause = c; },
    '<init>(Ljava/lang/Throwable;)V'(c) { this.$cause = c; this.$msg = c ? jstr(c) : null; }, 'getMessage()Ljava/lang/String;'() { return this.$msg ?? null; },
    'getCause()Ljava/lang/Throwable;'() { return this.$cause ?? null; }, 'printStackTrace()V'() { console.error(jstr(this)); },
    'toString()Ljava/lang/String;'() { const n = this.constructor.$name.slice(1, -1).replace(/\//g, '.'); return this.$msg != null ? n + ': ' + this.$msg : n; },
    'getStackTrace()[Ljava/lang/StackTraceElement;'() { return rt.newArray('[Ljava/lang/StackTraceElement;', 0); }, 'addSuppressed(Ljava/lang/Throwable;)V'() {},
    'initCause(Ljava/lang/Throwable;)Ljava/lang/Throwable;'(c) { this.$cause = c; return this; },
  }));
  const ex = (n, s) => sh(n, s, C => { for (const k of ['<init>()V', '<init>(Ljava/lang/String;)V', '<init>(Ljava/lang/String;Ljava/lang/Throwable;)V', '<init>(Ljava/lang/Throwable;)V']) if (!Object.prototype.hasOwnProperty.call(C.prototype, k)) def(C.prototype, { [k]: rt.cls('Ljava/lang/Throwable;').prototype[k] }); });
  ex('Ljava/lang/Exception;', 'Ljava/lang/Throwable;'); ex('Ljava/lang/Error;', 'Ljava/lang/Throwable;');
  ex('Ljava/lang/RuntimeException;', 'Ljava/lang/Exception;');
  for (const n of ['NullPointerException', 'ArithmeticException', 'ClassCastException', 'IllegalArgumentException', 'IllegalStateException', 'IndexOutOfBoundsException', 'UnsupportedOperationException', 'NegativeArraySizeException', 'ConcurrentModificationException'])
    ex(`Ljava/lang/${n};`, 'Ljava/lang/RuntimeException;');
  ex('Ljava/util/ConcurrentModificationException;', 'Ljava/lang/RuntimeException;');
  ex('Ljava/lang/ArrayIndexOutOfBoundsException;', 'Ljava/lang/IndexOutOfBoundsException;');
  ex('Ljava/lang/NumberFormatException;', 'Ljava/lang/IllegalArgumentException;');
  ex('Ljava/lang/InterruptedException;', 'Ljava/lang/Exception;'); ex('Ljava/io/IOException;', 'Ljava/lang/Exception;');
  ex('Ljava/lang/StackOverflowError;', 'Ljava/lang/Error;'); ex('Ljava/lang/OutOfMemoryError;', 'Ljava/lang/Error;');
  ex('Ljava/lang/AssertionError;', 'Ljava/lang/Error;');

  // ---- Enum (R8 may merge enum constructors into Enum.<init>)
  sh('Ljava/lang/Enum;', O, C => def(C.prototype, {
    '<init>(Ljava/lang/String;I)V'(n, o) { this.$ename = n; this.$ord = o; }, 'ordinal()I'() { return this.$ord; }, 'name()Ljava/lang/String;'() { return this.$ename; },
    'toString()Ljava/lang/String;'() { return this.$ename; }, 'compareTo(Ljava/lang/Enum;)I'(o) { return this.$ord - o.$ord; }, 'compareTo(Ljava/lang/Object;)I'(o) { return this.$ord - o.$ord; },
  }));

  // ---- System / Thread
  sh('Ljava/lang/System;', O, C => def(C, {
    'currentTimeMillis()J': () => BigInt(Math.floor(rt.wallclock ? rt.wallclock() : Date.now())), 'nanoTime()J': () => BigInt(Math.floor(rt.now() * 1e6)),
    'arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V': (s, sp, d, dp, n) => { rt.nn(s); rt.nn(d); if (sp < 0 || dp < 0 || n < 0 || sp + n > s.length || dp + n > d.length) throw rt.exc('Ljava/lang/ArrayIndexOutOfBoundsException;', 'arraycopy'); if (s === d && sp < dp) for (let i = n - 1; i >= 0; i--) d[dp + i] = s[sp + i]; else for (let i = 0; i < n; i++) d[dp + i] = s[sp + i]; },
    'identityHashCode(Ljava/lang/Object;)I': o => (o == null ? 0 : rt.JObject.prototype['hashCode()I'].call(o)), 'getProperty(Ljava/lang/String;)Ljava/lang/String;': () => null, 'exit(I)V': () => {},
  }));
  sh('Ljava/lang/Runnable;', null, () => {}, []);
  sh('Ljava/lang/Thread;', O, C => {
    def(C.prototype, {
      '<init>()V'() { this.$target = null; }, '<init>(Ljava/lang/Runnable;)V'(r) { this.$target = r; }, '<init>(Ljava/lang/Runnable;Ljava/lang/String;)V'(r, n) { this.$target = r; this.$tname = n; },
      '<init>(Ljava/lang/String;)V'(n) { this.$tname = n; }, 'run()V'() { if (this.$target) return this.$target['run()V'](); },
      'start()V'() { const self = this; this.$alive = true; rt.spawn((function* () { try { yield* rt.co(self['run()V']()); } finally { self.$alive = false; } })(), self.$tname || self.constructor.$name); },
      'isAlive()Z'() { return this.$alive ? 1 : 0; }, 'interrupt()V'() { this.$interrupted = true; }, 'isInterrupted()Z'() { return this.$interrupted ? 1 : 0; },
      'setPriority(I)V'() {}, 'setName(Ljava/lang/String;)V'(n) { this.$tname = n; }, 'getName()Ljava/lang/String;'() { return this.$tname || 'Thread'; },
      'join()V': function* () { while (this.$alive) yield { sleep: 1 }; },
    });
    def(C, { 'sleep(J)V': function* (ms) { yield { sleep: Number(ms) }; }, 'currentThread()Ljava/lang/Thread;': () => rt.mainThread || (rt.mainThread = rt.alloc('Ljava/lang/Thread;')), 'interrupted()Z': () => 0 });
  });

  // ---- collections
  sh('Ljava/util/Iterator;', null, () => {});
  sh('Ljava/util/AbstractList$Itr;', O, C => def(C.prototype, { 'hasNext()Z'() { return this.$i < this.$l.$a.length ? 1 : 0; }, 'next()Ljava/lang/Object;'() { if (this.$i >= this.$l.$a.length) throw rt.exc('Ljava/util/NoSuchElementException;'); return this.$l.$a[this.$i++]; }, 'remove()V'() { this.$l.$a.splice(--this.$i, 1); } }), ['Ljava/util/Iterator;']);
  const itr = l => { const it = rt.alloc('Ljava/util/AbstractList$Itr;'); it.$l = l; it.$i = 0; return it; };
  const eqj = (a, b) => (a === b ? true : a == null || b == null ? false : typeof a === 'string' ? a === b : !!a['equals(Ljava/lang/Object;)Z'](b));
  const listMethods = {
    '<init>()V'() { this.$a = []; }, '<init>(I)V'() { this.$a = []; }, '<init>(Ljava/util/Collection;)V'(c) { this.$a = rt.toArray(c); },
    'size()I'() { return this.$a.length; }, 'isEmpty()Z'() { return this.$a.length ? 0 : 1; },
    'get(I)Ljava/lang/Object;'(i) { if (i < 0 || i >= this.$a.length) throw rt.exc('Ljava/lang/IndexOutOfBoundsException;', 'Index: ' + i + ', Size: ' + this.$a.length); return this.$a[i]; },
    'set(ILjava/lang/Object;)Ljava/lang/Object;'(i, v) { const o = this.$a[i]; this.$a[i] = v; return o; },
    'add(Ljava/lang/Object;)Z'(v) { this.$a.push(v); return 1; }, 'add(ILjava/lang/Object;)V'(i, v) { this.$a.splice(i, 0, v); },
    'addAll(Ljava/util/Collection;)Z'(c) { const a = rt.toArray(c); this.$a.push(...a); return a.length ? 1 : 0; },
    'remove(I)Ljava/lang/Object;'(i) { if (i < 0 || i >= this.$a.length) throw rt.exc('Ljava/lang/IndexOutOfBoundsException;', String(i)); return this.$a.splice(i, 1)[0]; },
    'remove(Ljava/lang/Object;)Z'(o) { const i = this.$a.findIndex(x => eqj(o, x)); if (i < 0) return 0; this.$a.splice(i, 1); return 1; },
    'removeAll(Ljava/util/Collection;)Z'(c) { const r = rt.toArray(c); const n = this.$a.length; this.$a = this.$a.filter(x => !r.some(y => eqj(y, x))); return n !== this.$a.length ? 1 : 0; },
    'clear()V'() { this.$a.length = 0; }, 'contains(Ljava/lang/Object;)Z'(o) { return this.$a.some(x => eqj(o, x)) ? 1 : 0; },
    'indexOf(Ljava/lang/Object;)I'(o) { return this.$a.findIndex(x => eqj(o, x)); }, 'iterator()Ljava/util/Iterator;'() { return itr(this); },
    'toArray()[Ljava/lang/Object;'() { return rt.filled('[Ljava/lang/Object;', this.$a.slice()); },
    'toArray([Ljava/lang/Object;)[Ljava/lang/Object;'(t) { const r = rt.filled(t.$type, this.$a.slice()); return r; },
    'equals(Ljava/lang/Object;)Z'(o) { if (!o || !o.$a || o.$a.length !== this.$a.length) return 0; for (let i = 0; i < this.$a.length; i++) if (!eqj(this.$a[i], o.$a[i])) return 0; return 1; },
    'hashCode()I'() { let h = 1; for (const x of this.$a) h = (Math.imul(31, h) + (x == null ? 0 : typeof x === 'string' ? x['hashCode()I']() : x['hashCode()I']())) | 0; return h; },
    'sort(Ljava/util/Comparator;)V'(c) { rt.sort(this.$a, c); }, 'subList(II)Ljava/util/List;'(a, b) { const l = rt.alloc('Ljava/util/ArrayList;'); l.$a = this.$a.slice(a, b); return l; },
  };
  for (const n of ['Ljava/util/ArrayList;', 'Ljava/util/LinkedList;', 'Ljava/util/Vector;', 'Ljava/util/concurrent/CopyOnWriteArrayList;'])
    sh(n, O, C => def(C.prototype, listMethods), ['Ljava/util/List;', 'Ljava/util/Collection;', 'Ljava/lang/Iterable;', 'Ljava/util/RandomAccess;']);
  for (const n of ['Ljava/util/List;', 'Ljava/util/Collection;', 'Ljava/lang/Iterable;', 'Ljava/util/Comparator;', 'Ljava/lang/Comparable;', 'Ljava/util/Map;', 'Ljava/util/Set;']) sh(n, null, () => {});
  rt.toArray = c => (c.$a ? c.$a.slice() : c.$m ? [...c.$m.keys()] : Array.from(c));
  // TimSort-compatible ordering is stable; Java's List.sort/Collections.sort are stable too.
  rt.sort = (a, cmp) => { const s = a.map((v, i) => [v, i]).sort((x, y) => (cmp ? cmp['compare(Ljava/lang/Object;Ljava/lang/Object;)I'](x[0], y[0]) : x[0]['compareTo(Ljava/lang/Object;)I'](y[0])) || x[1] - y[1]); s.forEach((p, i) => { a[i] = p[0]; }); };
  sh('Ljava/util/Collections;', O, C => def(C, {
    'max(Ljava/util/Collection;)Ljava/lang/Object;': c => { const a = rt.toArray(c); if (!a.length) throw rt.exc('Ljava/util/NoSuchElementException;'); let m = a[0]; for (const x of a) if (x['compareTo(Ljava/lang/Object;)I'](m) > 0) m = x; return m; },
    'min(Ljava/util/Collection;)Ljava/lang/Object;': c => { const a = rt.toArray(c); let m = a[0]; for (const x of a) if (x['compareTo(Ljava/lang/Object;)I'](m) < 0) m = x; return m; },
    'sort(Ljava/util/List;)V': l => rt.sort(l.$a, null), 'sort(Ljava/util/List;Ljava/util/Comparator;)V': (l, c) => rt.sort(l.$a, c),
    'reverse(Ljava/util/List;)V': l => l.$a.reverse(), 'shuffle(Ljava/util/List;)V': l => { const a = l.$a; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rt.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } },
    'unmodifiableList(Ljava/util/List;)Ljava/util/List;': l => l, 'emptyList()Ljava/util/List;': () => { const l = rt.alloc('Ljava/util/ArrayList;'); l.$a = []; return l; },
  }));
  const mapMethods = {
    '<init>()V'() { this.$m = new Map(); }, '<init>(I)V'() { this.$m = new Map(); }, 'size()I'() { return this.$m.size; },
    'get(Ljava/lang/Object;)Ljava/lang/Object;'(k) { return this.$m.has(rt.mkey(k)) ? this.$m.get(rt.mkey(k))[1] : null; },
    'put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;'(k, v) { const kk = rt.mkey(k); const o = this.$m.has(kk) ? this.$m.get(kk)[1] : null; this.$m.set(kk, [k, v]); return o; },
    'containsKey(Ljava/lang/Object;)Z'(k) { return this.$m.has(rt.mkey(k)) ? 1 : 0; }, 'remove(Ljava/lang/Object;)Ljava/lang/Object;'(k) { const kk = rt.mkey(k); const o = this.$m.has(kk) ? this.$m.get(kk)[1] : null; this.$m.delete(kk); return o; },
    'clear()V'() { this.$m.clear(); }, 'isEmpty()Z'() { return this.$m.size ? 0 : 1; },
    'keySet()Ljava/util/Set;'() { const l = rt.alloc('Ljava/util/ArrayList;'); l.$a = [...this.$m.values()].map(e => e[0]); return l; },
    'values()Ljava/util/Collection;'() { const l = rt.alloc('Ljava/util/ArrayList;'); l.$a = [...this.$m.values()].map(e => e[1]); return l; },
  };
  rt.mkey = k => (k == null ? 'null' : typeof k === 'string' ? 's:' + k : k.$v !== undefined ? 'v:' + k.constructor.$name + k.$v : k);
  for (const n of ['Ljava/util/HashMap;', 'Ljava/util/LinkedHashMap;', 'Ljava/util/TreeMap;', 'Ljava/util/concurrent/ConcurrentHashMap;', 'Ljava/util/Hashtable;'])
    sh(n, O, C => def(C.prototype, mapMethods), ['Ljava/util/Map;']);

  // ---- Random (java.util.Random LCG, exact)
  sh('Ljava/util/Random;', O, C => def(C.prototype, {
    '<init>()V'() { this.$seed = (BigInt(Math.floor(Math.random() * 2 ** 48)) ^ 0x5DEECE66Dn) & ((1n << 48n) - 1n); },
    '<init>(J)V'(s) { this.$seed = (s ^ 0x5DEECE66Dn) & ((1n << 48n) - 1n); },
    $next(bits) { this.$seed = (this.$seed * 0x5DEECE66Dn + 0xBn) & ((1n << 48n) - 1n); return Number(BigInt.asIntN(32, this.$seed >> BigInt(48 - bits))); },
    'nextInt()I'() { return this.$next(32); },
    'nextInt(I)I'(n) { if ((n & -n) === n) return Number((BigInt(n) * BigInt(this.$next(31))) >> 31n); let bits, val; do { bits = this.$next(31); val = bits % n; } while (bits - val + (n - 1) < 0 || bits - val + (n - 1) > 2147483647); return val; },
    'nextDouble()D'() { return Number((BigInt(this.$next(26)) << 27n) + BigInt(this.$next(27))) * 2 ** -53; },
    'nextFloat()F'() { return this.$next(24) / (1 << 24); }, 'nextBoolean()Z'() { return this.$next(1); },
  }));
})(globalThis.DexRT);
