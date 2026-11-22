'use strict';
// Runtime for dex2js output: class model, Java semantics helpers, cooperative threads, and a
// shim registry for java.* / android.* classes. Framework classes with no shim fall back to an
// automatic placeholder whose methods return the Java default for their return type, so the
// original code can run headless (tests) while real shims are added for the browser.
(function (G) {
  const defs = new Map();    // name -> {sup, ifaces, iface, body}
  const ready = new Map();   // name -> class (initialised)
  const shims = new Map();   // name -> (C, rt) => void   (framework implementations)
  const rt = {};
  rt.stats = { autoStubCalls: new Map() };

  class JObject {}
  JObject.$name = 'Ljava/lang/Object;'; JObject.S = {}; JObject.F = {};
  JObject.prototype['<init>()V'] = function () {};
  JObject.prototype['equals(Ljava/lang/Object;)Z'] = function (o) { return this === o ? 1 : 0; };
  let hashSeq = 1;
  JObject.prototype['hashCode()I'] = function () { if (!this.$hash) this.$hash = (hashSeq = (Math.imul(hashSeq, 1103515245) + 12345) | 0) & 0x7fffffff; return this.$hash; };
  JObject.prototype['toString()Ljava/lang/String;'] = function () { return this.constructor.$name.slice(1, -1).replace(/\//g, '.') + '@' + this['hashCode()I']().toString(16); };
  JObject.prototype['getClass()Ljava/lang/Class;'] = function () { return rt.klass(this.constructor.$name); };
  JObject.prototype['notify()V'] = function () { rt.notify(this, false); };
  JObject.prototype['notifyAll()V'] = function () { rt.notify(this, true); };
  JObject.prototype['wait()V'] = function* () { yield { wait: this }; };
  JObject.prototype['wait(J)V'] = function* (ms) { yield { wait: this, ms: Number(ms) }; };
  ready.set('Ljava/lang/Object;', JObject);
  rt.JObject = JObject;

  rt.def = (name, sup, ifaces, iface, body) => { defs.set(name, { sup, ifaces, iface, body }); };
  // Forget every initialised class (fresh statics, like a new process); definitions stay.
  rt.reset = () => { for (const k of [...ready.keys()]) if (k !== 'Ljava/lang/Object;') ready.delete(k); classObjs.clear(); tasks.length = 0; };
  rt.shim = (name, sup, body, ifaces = []) => { shims.set(name, { sup, body, ifaces }); };

  function build(name) {
    const d = defs.get(name) || (shims.has(name) ? shims.get(name) : null);
    if (!d) return autoStub(name);
    const Sup = d.sup ? rt.cls(d.sup) : JObject;
    const C = { [name]: class extends Sup {} }[name];
    C.$name = name; C.$sup = Sup; C.$ifaces = (d.ifaces || []).slice(); C.S = {}; C.F = {};
    C.$iface = Boolean(d.iface);
    ready.set(name, C); // before body: recursive references during definition
    d.body(C, rt);
    if (defs.has(name) && shims.has(name)) shims.get(name).body(C, rt); // shim overrides on compiled class
    // instance field defaults are installed by alloc (own + inherited)
    let fields = {}; for (let k = C; k && k !== JObject; k = k.$sup) fields = Object.assign({}, k.F, fields);
    C.$fields = fields;
    return C;
  }
  // rt.cls: class object WITHOUT running <clinit>; rt.c: initialised class (Java semantics).
  rt.cls = name => ready.get(name) || build(name);
  rt.c = name => {
    const C = ready.get(name) || build(name);
    if (Object.prototype.hasOwnProperty.call(C, '$init')) return C; // own flag: statics are inherited in JS
    C.$init = true;
    if (C.$sup && C.$sup !== JObject) rt.c(C.$sup.$name);
    const ci = Object.prototype.hasOwnProperty.call(C, '<clinit>()V') ? C['<clinit>()V'] : null;
    if (ci) {
      try { const r = ci(); if (r && typeof r.next === 'function') rt.runSync(r); }
      catch (err) { if (rt.traceInit) rt.traceInit(name, 'error', err); throw err; } // Java: ExceptionInInitializerError
    }
    return C;
  };
  rt.alloc = name => { const C = rt.c(name); const o = Object.create(C.prototype); Object.assign(o, C.$fields); return o; };
  rt.proto = (owner, key, kind) => {
    let C = rt.cls(owner);
    if (kind === 'super') { /* invoke-super names the superclass already */ }
    for (let k = C; k; k = k.$sup) if (Object.prototype.hasOwnProperty.call(k.prototype, key)) return k.prototype[key];
    const f = C.prototype[key]; if (f) return f;
    throw new Error('no method ' + owner + '->' + key);
  };

  // ---- automatic placeholders for framework classes with no shim
  function defaultFor(desc) {
    const ret = desc.slice(desc.indexOf(')') + 1);
    if (ret === 'V') return undefined;
    if (ret === 'J') return 0n;
    if ('IZBSCFD'.includes(ret)) return 0;
    if (ret === 'Ljava/lang/String;' || ret === 'Ljava/lang/CharSequence;') return '';
    if (ret[0] === '[') return rt.newArray(ret, 0);
    // same policy as the JVM oracle's generated stubs: android.* classes -> new instance, else null
    if (ret.startsWith('Landroid/') && /^[A-Z]/.test(ret.split('/').pop().split('$').pop())) return rt.alloc(ret);
    return null;
  }
  function autoStub(name) {
    const C = { [name]: class extends JObject {} }[name];
    C.$name = name; C.$sup = JObject; C.$ifaces = []; C.F = {}; C.$fields = {}; C.$auto = true; C.$init = true;
    C.S = new Proxy({}, { get: (t, k) => (k in t ? t[k] : 0) }); // unknown framework constants read as 0
    const handler = {
      get(target, key, recv) {
        if (typeof key !== 'string' || !key.includes('(')) return Reflect.get(target, key, recv);
        const f = function () { rt.stats.autoStubCalls.set(name + '->' + key, (rt.stats.autoStubCalls.get(name + '->' + key) || 0) + 1); return defaultFor(key); };
        return f;
      },
    };
    Object.setPrototypeOf(C.prototype, new Proxy(Object.create(JObject.prototype), handler));
    // static calls
    ready.set(name, new Proxy(C, { get(t, k, r) { if (typeof k === 'string' && k.includes('(') && !(k in t)) return handler.get(t, k, r); return Reflect.get(t, k, r); } }));
    return ready.get(name);
  }

  // ---- values
  rt.nn = o => { if (o === null || o === undefined || o === 0) throw rt.npe(); return o; };
  rt.eq = (a, b) => a === b || ((a === null || a === 0 || a === undefined) && (b === null || b === 0 || b === undefined));
  rt.cmpl = (a, b) => (a > b ? 1 : a === b ? 0 : -1);              // NaN -> -1
  rt.cmpg = (a, b) => (a < b ? -1 : a === b ? 0 : 1);              // NaN -> 1
  rt.idiv = (a, b) => { if (b === 0) throw rt.exc('Ljava/lang/ArithmeticException;', 'divide by zero'); return (a / b) | 0; };
  rt.irem = (a, b) => { if (b === 0) throw rt.exc('Ljava/lang/ArithmeticException;', 'divide by zero'); return (a % b) | 0; };
  rt.ldiv = (a, b) => { if (b === 0n) throw rt.exc('Ljava/lang/ArithmeticException;', 'divide by zero'); return BigInt.asIntN(64, a / b); };
  rt.lrem = (a, b) => { if (b === 0n) throw rt.exc('Ljava/lang/ArithmeticException;', 'divide by zero'); return a % b; };
  rt.f2i = x => (x !== x ? 0 : x >= 2147483647 ? 2147483647 : x <= -2147483648 ? -2147483648 : Math.trunc(x) | 0);
  rt.f2l = x => (x !== x ? 0n : x >= 9223372036854775807 ? 9223372036854775807n : x <= -9223372036854775808 ? -9223372036854775808n : BigInt(Math.trunc(x)));

  // ---- arrays
  const TYPED = { D: Float64Array, F: Float32Array, I: Int32Array, J: BigInt64Array, B: Int8Array, S: Int16Array, C: Uint16Array, Z: Uint8Array };
  rt.newArray = (type, n) => {
    if (n < 0) throw rt.exc('Ljava/lang/NegativeArraySizeException;', String(n));
    const el = type.slice(1); const T = TYPED[el];
    const a = T ? new T(n) : new Array(n).fill(null);
    a.$type = type; return a;
  };
  rt.aget = (a, i) => { rt.nn(a); if (i < 0 || i >= a.length) throw rt.exc('Ljava/lang/ArrayIndexOutOfBoundsException;', 'length=' + a.length + '; index=' + i); return a[i]; };
  rt.aput = (a, i, v) => { rt.nn(a); if (i < 0 || i >= a.length) throw rt.exc('Ljava/lang/ArrayIndexOutOfBoundsException;', 'length=' + a.length + '; index=' + i); a[i] = v; };
  rt.filled = (type, vals) => { const a = rt.newArray(type, vals.length); vals.forEach((v, i) => { a[i] = v; }); return a; };
  rt.fill = (a, width, vals) => {
    const dv = new DataView(new ArrayBuffer(8));
    vals.forEach((s, i) => {
      let n = BigInt(s);
      if (a instanceof Float64Array) { dv.setBigInt64(0, BigInt.asIntN(64, n)); a[i] = dv.getFloat64(0); }
      else if (a instanceof Float32Array) { dv.setInt32(0, Number(BigInt.asIntN(32, n))); a[i] = dv.getFloat32(0); }
      else if (a instanceof BigInt64Array) a[i] = BigInt.asIntN(64, n);
      else a[i] = Number(BigInt.asIntN(width * 8, n));
    });
  };

  // ---- types
  function implementsName(C, name) {
    for (let k = C; k; k = k.$sup) {
      if (k.$name === name) return true;
      for (const i of k.$ifaces || []) if (i === name || implementsName(rt.cls(i), name)) return true;
    }
    return false;
  }
  rt.isInst = (o, name) => {
    if (o === null || o === undefined || o === 0) return false;
    if (name === 'Ljava/lang/Object;') return true;
    if (typeof o === 'string') return ['Ljava/lang/String;', 'Ljava/lang/CharSequence;', 'Ljava/lang/Comparable;', 'Ljava/io/Serializable;'].includes(name);
    if (name[0] === '[') return o.$type === name || (Array.isArray(o) && name.startsWith('[L'));
    const C = o.constructor; if (!C || !C.$name) return false;
    if (Object.prototype.hasOwnProperty.call(C, '$auto') || (G.Proxy && C.$autoProxy)) return true; // placeholders accept any cast
    return implementsName(C, name);
  };
  rt.cast = (o, name) => { if (o !== null && o !== undefined && o !== 0 && !rt.isInst(o, name)) throw rt.exc('Ljava/lang/ClassCastException;', String(o && o.constructor && o.constructor.$name) + ' -> ' + name); };
  const classObjs = new Map();
  rt.klass = name => { if (!classObjs.has(name)) { const k = rt.alloc('Ljava/lang/Class;'); k.$of = name; classObjs.set(name, k); } return classObjs.get(name); };

  // ---- exceptions
  rt.exc = (name, msg) => { const e = rt.alloc(name); e.$msg = msg ?? null; e.$stack = new Error(name + ': ' + msg).stack; return e; };
  rt.npe = () => rt.exc('Ljava/lang/NullPointerException;', null);
  rt.jerr = err => {
    if (err && err.constructor && err.constructor.$name) return err;
    if (err instanceof TypeError) { const e = rt.npe(); e.$js = err; return e; }
    if (err instanceof RangeError) { const e = rt.exc('Ljava/lang/StackOverflowError;', err.message); e.$js = err; return e; }
    if (err && err.$jsYield) return err;
    const e = rt.exc('Ljava/lang/RuntimeException;', String(err && err.message)); e.$js = err; return e;
  };
  rt.handler = (list, err) => {
    if (!list) return null;
    const e = rt.jerr(err);
    for (const [type, label] of list) if (type === null || rt.isInst(e, type)) return [label, e];
    return null;
  };

  // ---- cooperative threads (generators)
  rt.co = function* (x) { if (x && typeof x.next === 'function' && typeof x[Symbol.iterator] === 'function') return yield* x; return x; };
  rt.runSync = gen => { // run to completion without real waiting (static init / tests)
    let r = gen.next();
    while (!r.done) r = gen.next();
    return r.value;
  };
  const tasks = [];
  rt.now = () => (G.performance ? G.performance.now() : Date.now());
  rt.spawn = (gen, label) => { const t = { gen, label, wakeAt: 0, waiting: null, done: false }; tasks.push(t); return t; };
  rt.notify = (obj, all) => { for (const t of tasks) if (t.waiting === obj) { t.waiting = null; t.wakeAt = 0; if (!all) break; } };
  rt.pump = (budgetMs = 8) => { // run runnable tasks until they block; called from the frame loop
    const end = rt.now() + budgetMs;
    let progressed = true;
    while (progressed && rt.now() < end) {
      progressed = false;
      for (const t of tasks) {
        if (t.done || t.waiting || t.wakeAt > rt.now()) continue;
        try {
          const r = t.gen.next();
          progressed = true;
          if (r.done) { t.done = true; continue; }
          const y = r.value || {};
          if (y.sleep !== undefined) t.wakeAt = rt.now() + y.sleep;
          if (y.wait) { t.waiting = y.wait; if (y.ms) t.wakeAt = rt.now() + y.ms; }
        } catch (err) { t.done = true; rt.onUncaught(err, t); }
      }
      for (let i = tasks.length - 1; i >= 0; i--) if (tasks[i].done) tasks.splice(i, 1);
    }
  };
  rt.onUncaught = (err, t) => { console.error('uncaught in', t && t.label, err && (err.$stack || err.stack || err)); };
  rt.tasks = tasks;

  G.DexRT = rt;
})(typeof globalThis !== 'undefined' ? globalThis : this);
