"""dex2js: compile apktool smali (Dalvik bytecode) to JavaScript, instruction by instruction.

Every Java class becomes   rt.def('Lname;', 'Lsuper;', [ifaces], (C, rt) => { ... })
  * instance fields   obj['Ldecl;.name']     (declaring class resolved at compile time)
  * static fields     rt.c('Ldecl;').S['name']
  * methods           key 'name(desc)ret' on the class (static) or prototype (instance)
  * constructors      prototype['<init>(desc)V'], static init C['<clinit>()V'] run by rt.c()
Each method body is a label state machine over basic blocks; try/catch ranges map to
blocks. Numeric semantics follow the JVM: int (|0, imul, trunc div), long (BigInt, 64-bit
wrap), float (Math.fround), saturating float->int casts, cmpl/cmpg NaN rules.
Methods that may block (Thread.sleep, Object.wait, ...) are emitted as generators; callers of
such methods are generators too and use yield*. rt runs them cooperatively.

  python3 dex2js.py SMALI_DIR OUT.js [class-list.txt]
"""
import json, os, re, struct, sys
from collections import defaultdict

SMALI = sys.argv[1]; OUT = sys.argv[2]
ONLY = set(l.strip() for l in open(sys.argv[3])) if len(sys.argv) > 3 else None

# ---------------------------------------------------------------- parsing
class Method:
    def __init__(s, cls, flags, name, desc):
        s.cls, s.flags, s.name, s.desc = cls, flags, name, desc
        s.static = 'static' in flags; s.abstract = 'abstract' in flags or 'native' in flags
        s.locals = 0; s.lines = []
    @property
    def key(s): return s.name + s.desc

class Cls:
    def __init__(s, name): s.name, s.sup, s.ifaces, s.fields, s.methods, s.iface = name, None, [], {}, [], False

def parse_types(desc):
    out, i = [], 0
    while i < len(desc):
        j = i
        while desc[j] == '[': j += 1
        if desc[j] == 'L': j = desc.index(';', j)
        out.append(desc[i:j + 1]); i = j + 1
    return out
def split_desc(desc):
    a, r = desc[1:].split(')'); return parse_types(a), r

def parse_file(path):
    c = None; m = None
    for raw in open(path, encoding='utf-8'):
        line = raw.rstrip('\n'); t = line.strip()
        if m is not None:
            if t == '.end method': c.methods.append(m); m = None; continue
            if t.startswith('.locals '): m.locals = int(t.split()[1]); continue
            if t.startswith('.registers '): m.registers = int(t.split()[1]); continue
            if not t or t.startswith('.line') or t.startswith('.param') or t.startswith('.end param') or t.startswith('.prologue') or t.startswith('.local ') or t.startswith('.end local') or t.startswith('.restart') or t.startswith('#') or t.startswith('.annotation') or t.startswith('.end annotation') or t.startswith('value =') or t.startswith('}'):
                if t.startswith('.annotation'): m.in_ann = True
                if t.startswith('.end annotation'): m.in_ann = False
                continue
            if getattr(m, 'in_ann', False): continue
            if not t.startswith('const-string'): t = re.sub(r'\s+#.*$', '', t)
            m.lines.append(t); continue
        if t.startswith('.class '):
            parts = t.split(); c = Cls(parts[-1]); c.iface = 'interface' in parts
        elif t.startswith('.super '): c.sup = t.split()[1]
        elif t.startswith('.implements '): c.ifaces.append(t.split()[1])
        elif t.startswith('.field '):
            body = t[len('.field '):].split(' = ')[0]
            parts = body.split(); nm, ty = parts[-1].split(':', 1)
            init = t.split(' = ', 1)[1] if ' = ' in t else None
            c.fields[nm] = {'type': ty, 'static': 'static' in parts[:-1], 'init': init}
        elif t.startswith('.method '):
            parts = t.split(); sig = parts[-1]; nm = sig[:sig.index('(')]
            m = Method(c, parts[1:-1], nm, sig[sig.index('('):])
    return c

classes = {}
for root, _, files in os.walk(SMALI):
    for f in files:
        if f.endswith('.smali'):
            c = parse_file(os.path.join(root, f))
            if c: classes[c.name] = c

def resolve_field(owner, name):
    k = owner
    while k in classes:
        if name in classes[k].fields: return k
        for i in classes[k].ifaces:  # interface constants
            if i in classes and name in classes[i].fields: return i
        k = classes[k].sup
    return owner  # framework field: keep the referenced owner

# ---------------------------------------------------------------- helpers
def js_str(s):
    # smali string literal (Java escapes) -> JS literal
    out, i = [], 0
    while i < len(s):
        ch = s[i]
        if ch == '\\':
            n = s[i + 1]
            if n == 'u': out.append(chr(int(s[i + 2:i + 6], 16))); i += 6; continue
            out.append({'n': '\n', 't': '\t', 'r': '\r', 'b': '\b', 'f': '\f', '"': '"', "'": "'", '\\': '\\', '0': '\0'}.get(n, n)); i += 2; continue
        out.append(ch); i += 1
    return json.dumps(''.join(out))

def lit(v):
    v = v.strip()
    neg = v.startswith('-'); v = v.lstrip('-')
    if v.endswith('L') or v.endswith('l') or v.endswith('t') or v.endswith('s'): v = v[:-1]
    n = int(v, 16) if v.startswith('0x') else int(v)
    return -n if neg else n

def bits_to_double(n): return struct.unpack('>d', struct.pack('>q', n if n < 2**63 else n - 2**64))[0]
def bits_to_float(n): return struct.unpack('>f', struct.pack('>i', n if n < 2**31 else n - 2**32))[0]
def num(x):
    if x != x: return 'NaN'
    if x in (float('inf'), float('-inf')): return 'Infinity' if x > 0 else '-Infinity'
    r = repr(x)
    if r == '-0.0': return '-0'
    return r

def regs_of(argstr):
    argstr = argstr.strip()
    if argstr.startswith('{'):
        inner = argstr[1:argstr.index('}')].strip()
        if not inner: return []
        if '..' in inner:
            a, b = [x.strip() for x in inner.split('..')]
            pa, pb = a[0], b[0]; ia, ib = int(a[1:]), int(b[1:])
            return [f'{pa}{k}' for k in range(ia, ib + 1)]
        return [x.strip() for x in inner.split(',')]
    return [x.strip() for x in argstr.split(',')]

BLOCKING = {'Ljava/lang/Thread;->sleep(J)V', 'Ljava/lang/Object;->wait()V', 'Ljava/lang/Object;->wait(J)V', 'Ljava/lang/Thread;->join()V'}

# ---------------------------------------------------------------- type inference for ambiguous constants
FLOAT_OPS = re.compile(r'^(add|sub|mul|div|rem|neg)-float|^float-to-|^cmp[lg]-float')
DOUBLE_OPS = re.compile(r'^(add|sub|mul|div|rem|neg)-double|^double-to-|^cmp[lg]-double')
LONG_OPS = re.compile(r'^(add|sub|mul|div|rem|and|or|xor|shl|shr|ushr|neg|not)-long|^long-to-|^cmp-long')

def use_type(ins, reg, m):
    """Type ('I','F','J','D','L' or None) an instruction expects for register reg, if it reads it."""
    op, _, rest = ins.partition(' ')
    args = regs_of(rest) if rest else []
    if op.startswith('invoke'):
        rs = regs_of(rest)
        ref = rest[rest.index('}') + 1:].strip(' ,')
        cls_, sig = ref.split('->'); name = sig[:sig.index('(')]
        params, _ = split_desc(sig[sig.index('('):])
        if not op.startswith('invoke-static'): params = ['L'] + params
        pos = 0
        for p in params:
            if pos < len(rs) and rs[pos] == reg: return 'L' if p[0] in 'L[' else p
            pos += 2 if p in ('J', 'D') else 1
        return None
    if not args: return None
    if op.startswith('if-'): return 'I' if op[3:] in ('eqz', 'nez', 'ltz', 'gez', 'gtz', 'lez') and args[0] == reg and False else ('IL' if args[0] == reg or (len(args) > 1 and args[1] == reg) else None)
    def reads(idx): return [a for a in args[idx:] if a.startswith(('v', 'p'))]
    if op.startswith(('iput', 'sput', 'aput')):
        if op.startswith('aput') and reg != args[0]: return 'L' if reg == args[1] else 'I'
        if args[0] == reg:
            ref = rest.split(',')[-1].strip()
            if op.startswith('aput'): return {'aput-wide': 'JD', 'aput-object': 'L', 'aput-boolean': 'I', 'aput-byte': 'I', 'aput-char': 'I', 'aput-short': 'I'}.get(op, 'IF')
            ty = ref.split(':')[-1]
            return 'L' if ty[0] in 'L[' else ty
        return 'L' if op.startswith('iput') and len(args) > 1 and args[1] == reg else None
    if op in ('return', 'return-wide', 'return-object'):
        if args[0] != reg: return None
        r = split_desc(m.desc)[1]; return 'L' if r[0] in 'L[' else r
    if '/2addr' in op or op.count('-') >= 1:
        src = args[1:] if '/2addr' not in op else args[0:2]
        if reg in src:
            if FLOAT_OPS.search(op): return 'F'
            if DOUBLE_OPS.search(op): return 'D'
            if LONG_OPS.search(op): return 'J' if not (op.startswith(('shl-long', 'shr-long', 'ushr-long')) and reg == src[-1]) else 'I'
            if op.startswith(('int-to-', 'add-int', 'sub-int', 'mul-int', 'div-int', 'rem-int', 'and-int', 'or-int', 'xor-int', 'shl-int', 'shr-int', 'ushr-int', 'neg-int', 'not-int', 'rsub-int')): return 'I'
            if op in ('array-length', 'monitor-enter', 'monitor-exit', 'throw', 'check-cast', 'instance-of'): return 'L'
            if op.startswith('aget') and reg == args[1]: return 'L'
            if op.startswith('aget') and reg == args[2]: return 'I'
            if op.startswith('iget') and reg == args[1]: return 'L'
            if op in ('new-array',) and reg == args[1]: return 'I'
            if op.startswith(('move', 'packed-switch', 'sparse-switch')): return None
    return None

def writes(ins):
    op, _, rest = ins.partition(' ')
    if not rest or op.startswith(('invoke', 'if-', 'goto', 'return', 'throw', 'monitor', 'packed-switch', 'sparse-switch', 'fill-array-data', 'iput', 'sput', 'aput')): return None
    return regs_of(rest)[0]

def infer_const(m, idx, reg, wide, depth=0):
    if depth > 8: return None
    """Follow straight-line code (and jumps) from idx to the first read of reg."""
    seen = set(); stack = [idx + 1]
    labels = {l: i for i, l in enumerate(m.lines) if l.startswith(':')}
    votes = []
    while stack and len(votes) < 6:
        i = stack.pop()
        while 0 <= i < len(m.lines):
            if i in seen: break
            seen.add(i); ins = m.lines[i]
            if ins.startswith(':') or ins.startswith('.catch') or ins.startswith('.end') or ins.startswith('.packed') or ins.startswith('.sparse') or ins.startswith('.array'): i += 1; continue
            t = use_type(ins, reg, m)
            if t and t not in ('IL',):
                votes.append(t); break
            if t == 'IL': votes.append('IL'); break
            if ins.startswith(('move-wide', 'move ', 'move/', 'move-object')):
                ar = regs_of(ins.partition(' ')[2])
                if len(ar) > 1 and ar[1] == reg:
                    votes.append(infer_const(m, i, ar[0], wide, depth + 1) or ''); break
            w = writes(ins)
            if w == reg: break
            op = ins.split()[0]
            if op.startswith('goto'): i = labels.get(ins.split()[-1], -1); continue
            if op.startswith('if-'): stack.append(labels.get(ins.split()[-1], -1))
            if op.startswith(('return', 'throw')): break
            i += 1
    for v in votes:
        if v and v != 'IL': return v[0] if v[0] != 'Z' else 'I'
    return None

# ---------------------------------------------------------------- method compiler
needs_gen = set()  # method refs 'Lc;->name(desc)' that block
gen_keys = set()

class Compiler:
    def __init__(s, m):
        s.m = m; s.out = []; s.tmp = 0
    def reg(s, r):
        if r.startswith('p'): return f'v{s.m.locals + int(r[1:])}'
        return r
    def compile(s):
        m = s.m
        params, _ = split_desc(m.desc)
        nregs = m.locals
        pregs = []
        if not m.static: pregs.append(('this', 'L'))
        for p in params: pregs.append((p, p))
        # register file
        k = m.locals; plist = []
        if not m.static: plist.append(f'v{k}'); k += 1
        for p in params:
            plist.append(f'v{k}'); k += 2 if p in ('J', 'D') else 1
        total = k
        # blocks
        lines = m.lines
        label_idx = {}
        for i, l in enumerate(lines):
            if l.startswith(':'): label_idx[l] = i
        # payloads
        payload = {}
        i = 0
        while i < len(lines):
            if lines[i].startswith(':') and i + 1 < len(lines) and lines[i + 1].startswith(('.packed-switch', '.sparse-switch', '.array-data')):
                lab = lines[i]; hdr = lines[i + 1]; j = i + 2; body = []
                while not lines[j].startswith('.end'): body.append(lines[j]); j += 1
                payload[lab] = (hdr, body); i = j + 1; continue
            i += 1
        catches = [l for l in lines if l.startswith('.catch')]
        # Basic block boundaries: labels + after branches
        code = []
        for i, l in enumerate(lines):
            if l.startswith('.catch') or l.startswith(('.packed-switch', '.sparse-switch', '.array-data', '.end packed', '.end sparse', '.end array')): continue
            code.append((i, l))
        # remove payload bodies
        inpay = set()
        for lab, (hdr, body) in payload.items():
            st = label_idx[lab]
            for q in range(st, st + len(body) + 3): inpay.add(q)
        code = [(i, l) for i, l in code if i not in inpay or l.startswith(':') and lines[i] not in payload]
        code = [(i, l) for i, l in code if not (i in inpay)]
        # catch ranges
        try_ranges = []
        for cl in catches:
            mm = re.match(r'\.catch(all)? ?(\S*) \{(\S+) \.\. (\S+)\} (\S+)', cl)
            typ = None if mm.group(1) else mm.group(2)
            try_ranges.append((label_idx[mm.group(3)], label_idx[mm.group(4)], typ, mm.group(5)))
        # emit
        body = []
        cur_label = 'B0'
        body.append("   case 'B0':")
        handlers_for = lambda i: [(t, h) for (a, b, t, h) in try_ranges if a <= i < b]
        block_handlers = {}
        cur_block_start = 0
        blocks = ['B0']; block_handlers['B0'] = handlers_for(code[0][0] if code else 0)
        prev_handlers = block_handlers['B0']
        for i, l in code:
            if l.startswith(':'):
                lab = 'L' + l[1:]
                h = handlers_for(i)
                body.append(f"    pc='{lab}';")
                body.append(f"   case '{lab}':")
                blocks.append(lab); block_handlers[lab] = h
                continue
            h = handlers_for(i)
            if h != block_handlers[blocks[-1]]:
                lab = f'T{i}'
                body.append(f"    pc='{lab}';")
                body.append(f"   case '{lab}':"); blocks.append(lab); block_handlers[lab] = h
            body.append('    ' + s.ins(l, i, payload))
        body.append("    throw new Error('fell off method end');")
        has_try = any(block_handlers[b] for b in blocks)
        decl = 'let ' + ', '.join(f'v{q}' for q in range(total)) + ', $r, $e;' if total else 'let $r, $e;'
        head = []
        args = ', '.join(plist[1:] if not m.static else plist)
        head.append(decl.replace('let ', 'let ', 1))
        if not m.static: head.append(f'v{m.locals} = this;')
        # params arrive as JS args a0..; assign
        pa = [p for p in plist[(0 if m.static else 1):]]
        js_params = ', '.join(f'a{q}' for q in range(len(pa)))
        for q, r in enumerate(pa): head.append(f'{r} = a{q};')
        head.append("let pc = 'B0';")
        if has_try:
            hmap = {b: block_handlers[b] for b in blocks if block_handlers[b]}
            hjs = '{' + ','.join(f"'{b}':[" + ','.join(f"[{json.dumps(t)},'L{hd[1:]}']" for t, hd in hs) + ']' for b, hs in hmap.items()) + '}'
            head.append(f'const H = {hjs};')
            loop = ['for (;;) { try { switch (pc) {'] + body + ['} } catch (err) { const h = rt.handler(H[pc], err); if (!h) throw rt.jerr(err); pc = h[0]; $e = h[1]; } }']
        else:
            loop = ['for (;;) switch (pc) {'] + body + ['}']
        return js_params, '\n'.join(['  ' + x for x in head] + ['  ' + x for x in loop])

    def ins(s, l, idx, payload):
        R = s.reg; m = s.m
        op, _, rest = l.partition(' ')
        a = regs_of(rest) if rest and not op.startswith(('invoke', 'filled-new-array')) else None
        def binop(expr_fn, kind):
            if '/2addr' in op: d, x, y = R(a[0]), R(a[0]), R(a[1])
            elif '/lit' in op: d, x, y = R(a[0]), R(a[1]), str(lit(a[2]))
            else: d, x, y = R(a[0]), R(a[1]), R(a[2])
            return f'{d} = {expr_fn(x, y)};'
        # ---- moves / consts
        if op in ('nop',): return ';'
        if op.startswith('move-result'): return f'{R(a[0])} = $r;'
        if op == 'move-exception': return f'{R(a[0])} = $e;'
        if op.startswith('move'): return f'{R(a[0])} = {R(a[1])};'
        if op in ('return-void', 'return-void-no-barrier'): return 'return;'
        if op.startswith('return'): return f'return {R(a[0])};'
        if op.startswith('const-string'): return f'{R(a[0])} = {js_str(rest.split(",", 1)[1].strip()[1:-1])};'
        if op == 'const-class': return f"{R(a[0])} = rt.klass({json.dumps(a[1])});"
        if op.startswith('const-wide'):
            v = lit(a[1])
            # apktool prints high16 constants already shifted to their full value
            v &= (1 << 64) - 1
            t = infer_const(m, idx, a[0], True)
            if t == 'J':
                sv = v - (1 << 64) if v >= 1 << 63 else v
                return f'{R(a[0])} = {sv}n;'
            return f'{R(a[0])} = {num(bits_to_double(v))};'
        if op.startswith('const'):
            v = lit(a[1])
            v &= 0xffffffff
            t = infer_const(m, idx, a[0], False)
            if t == 'F': return f'{R(a[0])} = {num(bits_to_float(v))};'
            sv = v - (1 << 32) if v >= 1 << 31 else v
            # const 0 stays numeric 0 even when used as null: rt treats 0 as null everywhere
            return f'{R(a[0])} = {sv};'
        # ---- branches
        if op.startswith('goto'): return f"pc='L{rest.strip()[1:]}'; continue;"
        if op.startswith('if-'):
            cond = op[3:]; tgt = 'L' + a[-1][1:]
            if cond.endswith('z'):
                x = R(a[0])
                e = {'eqz': f'!{x}', 'nez': f'!!{x}', 'ltz': f'{x} < 0', 'gez': f'{x} >= 0', 'gtz': f'{x} > 0', 'lez': f'{x} <= 0'}[cond]
            else:
                x, y = R(a[0]), R(a[1])
                e = {'eq': f'rt.eq({x}, {y})', 'ne': f'!rt.eq({x}, {y})', 'lt': f'{x} < {y}', 'ge': f'{x} >= {y}', 'gt': f'{x} > {y}', 'le': f'{x} <= {y}'}[cond]
            return f"if ({e}) {{ pc='{tgt}'; continue; }}"
        if op in ('packed-switch', 'sparse-switch'):
            hdr, body = payload[a[1]]
            cases = []
            if op == 'packed-switch':
                base = lit(hdr.split()[1])
                for q, lb in enumerate(body): cases.append((base + q, lb))
            else:
                for b in body: k, lb = b.split('->'); cases.append((lit(k.strip()), lb.strip()))
            x = R(a[0])
            return ' '.join(f"if ({x} === {k}) {{ pc='L{lb[1:]}'; continue; }}" for k, lb in cases)
        # ---- comparisons
        if op in ('cmpl-double', 'cmpl-float'): return f'{R(a[0])} = rt.cmpl({R(a[1])}, {R(a[2])});'
        if op in ('cmpg-double', 'cmpg-float'): return f'{R(a[0])} = rt.cmpg({R(a[1])}, {R(a[2])});'
        if op == 'cmp-long': return f'{R(a[0])} = ({R(a[1])} > {R(a[2])} ? 1 : {R(a[1])} === {R(a[2])} ? 0 : -1);'
        # ---- fields
        if op.startswith(('iget', 'iput', 'sget', 'sput')):
            ref = rest.split(',')[-1].strip(); owner, fn = ref.split('->'); name, ty = fn.split(':', 1)
            decl = resolve_field(owner, name)
            fkey = json.dumps(decl + '.' + name)
            if op.startswith('iget'): return f'{R(a[0])} = rt.nn({R(a[1])})[{fkey}];'
            if op.startswith('iput'): return f'rt.nn({R(a[1])})[{fkey}] = {R(a[0])};'
            if op.startswith('sget'): return f'{R(a[0])} = rt.c({json.dumps(decl)}).S[{json.dumps(name)}];'
            return f'rt.c({json.dumps(decl)}).S[{json.dumps(name)}] = {R(a[0])};'
        # ---- arrays
        if op == 'array-length': return f'{R(a[0])} = rt.nn({R(a[1])}).length;'
        if op == 'new-array': return f'{R(a[0])} = rt.newArray({json.dumps(a[2])}, {R(a[1])});'
        if op.startswith('aget'):
            return f'{R(a[0])} = rt.aget({R(a[1])}, {R(a[2])});'
        if op.startswith('aput'):
            return f'rt.aput({R(a[1])}, {R(a[2])}, {R(a[0])});'
        if op.startswith('filled-new-array'):
            rs = regs_of(rest); ty = rest[rest.index('}') + 1:].strip(' ,')
            return f"$r = rt.filled({json.dumps(ty)}, [{', '.join(R(r) for r in rs)}]);"
        if op == 'fill-array-data':
            hdr, body = payload[a[1]]; width = int(hdr.split()[1])
            vals = [lit(b) for b in body]
            return f'rt.fill({R(a[0])}, {width}, {json.dumps([str(v) for v in vals])});'
        # ---- objects
        if op == 'new-instance': return f'{R(a[0])} = rt.alloc({json.dumps(a[1])});'
        if op == 'check-cast': return f'rt.cast({R(a[0])}, {json.dumps(a[1])});'
        if op == 'instance-of': return f'{R(a[0])} = rt.isInst({R(a[1])}, {json.dumps(a[2])}) ? 1 : 0;'
        if op == 'throw': return f'throw rt.jerr({R(a[0])});'
        if op.startswith('monitor'): return ';'
        # ---- invokes
        if op.startswith('invoke'):
            rs = regs_of(rest); ref = rest[rest.index('}') + 1:].strip(' ,')
            owner, sig = ref.split('->'); name = sig[:sig.index('(')]; desc = sig[sig.index('('):]
            params, ret = split_desc(desc)
            kind = op.split('-')[1].split('/')[0]
            jsargs = []; pos = 0 if kind == 'static' else 1
            for p in params:
                jsargs.append(R(rs[pos])); pos += 2 if p in ('J', 'D') else 1
            key = json.dumps(name + desc)
            gen = site_pausable(f'{owner}->{name}{desc}')
            argl = ', '.join(jsargs)
            if kind == 'static': call = f'rt.c({json.dumps(owner)})[{key}]({argl})'
            elif kind in ('direct', 'super'):
                call = f'rt.proto({json.dumps(owner)}, {key}, {json.dumps(kind)}).call(rt.nn({R(rs[0])}){", " if argl else ""}{argl})'
            else:
                call = f'rt.nn({R(rs[0])})[{key}]({argl})'
            # pausable callee: run it inside this generator (rt.co also accepts plain return values)
            return f'$r = yield* rt.co({call});' if gen else f'$r = {call};'
        # ---- arithmetic
        if op.startswith(('add-int', 'sub-int', 'mul-int', 'div-int', 'rem-int', 'and-int', 'or-int', 'xor-int', 'shl-int', 'shr-int', 'ushr-int', 'rsub-int')):
            base = op.split('/')[0]
            f = {'add-int': lambda x, y: f'({x} + {y}) | 0', 'sub-int': lambda x, y: f'({x} - {y}) | 0', 'mul-int': lambda x, y: f'Math.imul({x}, {y})',
                 'div-int': lambda x, y: f'rt.idiv({x}, {y})', 'rem-int': lambda x, y: f'rt.irem({x}, {y})', 'and-int': lambda x, y: f'{x} & {y}',
                 'or-int': lambda x, y: f'{x} | {y}', 'xor-int': lambda x, y: f'{x} ^ {y}', 'shl-int': lambda x, y: f'{x} << ({y} & 31)',
                 'shr-int': lambda x, y: f'{x} >> ({y} & 31)', 'ushr-int': lambda x, y: f'({x} >>> ({y} & 31)) | 0', 'rsub-int': lambda x, y: f'({y} - {x}) | 0'}[base]
            return binop(f, 'I')
        if op.startswith(('add-long', 'sub-long', 'mul-long', 'div-long', 'rem-long', 'and-long', 'or-long', 'xor-long', 'shl-long', 'shr-long', 'ushr-long')):
            base = op.split('/')[0]
            f = {'add-long': lambda x, y: f'BigInt.asIntN(64, {x} + {y})', 'sub-long': lambda x, y: f'BigInt.asIntN(64, {x} - {y})', 'mul-long': lambda x, y: f'BigInt.asIntN(64, {x} * {y})',
                 'div-long': lambda x, y: f'rt.ldiv({x}, {y})', 'rem-long': lambda x, y: f'rt.lrem({x}, {y})', 'and-long': lambda x, y: f'{x} & {y}', 'or-long': lambda x, y: f'{x} | {y}', 'xor-long': lambda x, y: f'{x} ^ {y}',
                 'shl-long': lambda x, y: f'BigInt.asIntN(64, {x} << BigInt({y} & 63))', 'shr-long': lambda x, y: f'({x} >> BigInt({y} & 63))',
                 'ushr-long': lambda x, y: f'BigInt.asIntN(64, BigInt.asUintN(64, {x}) >> BigInt({y} & 63))'}[base]
            return binop(f, 'J')
        if op.startswith(('add-float', 'sub-float', 'mul-float', 'div-float', 'rem-float')):
            sym = {'add': '+', 'sub': '-', 'mul': '*', 'div': '/', 'rem': '%'}[op[:3]]
            return binop(lambda x, y: f'Math.fround({x} {sym} {y})', 'F')
        if op.startswith(('add-double', 'sub-double', 'mul-double', 'div-double', 'rem-double')):
            sym = {'add': '+', 'sub': '-', 'mul': '*', 'div': '/', 'rem': '%'}[op[:3]]
            return binop(lambda x, y: f'{x} {sym} {y}', 'D')
        unary = {'neg-int': '(-{x}) | 0', 'not-int': '~{x}', 'neg-long': 'BigInt.asIntN(64, -{x})', 'not-long': '~{x}', 'neg-float': '-{x}', 'neg-double': '-{x}',
                 'int-to-long': 'BigInt({x})', 'int-to-float': 'Math.fround({x})', 'int-to-double': '{x}', 'long-to-int': 'Number(BigInt.asIntN(32, {x}))',
                 'long-to-float': 'Math.fround(Number({x}))', 'long-to-double': 'Number({x})', 'float-to-int': 'rt.f2i({x})', 'float-to-long': 'rt.f2l({x})',
                 'float-to-double': '{x}', 'double-to-int': 'rt.f2i({x})', 'double-to-long': 'rt.f2l({x})', 'double-to-float': 'Math.fround({x})',
                 'int-to-byte': '({x} << 24) >> 24', 'int-to-char': '{x} & 0xffff', 'int-to-short': '({x} << 16) >> 16'}
        if op in unary: return f'{R(a[0])} = {unary[op].format(x=R(a[1]))};'
        raise SystemExit(f'unsupported instruction in {m.cls.name}->{m.key}: {l}')

# ---------------------------------------------------------------- blocking analysis (fixpoint)
calls = defaultdict(set)
for c in classes.values():
    for m in c.methods:
        me = f'{c.name}->{m.key}'
        for l in m.lines:
            if l.startswith('invoke'):
                ref = l[l.index('}') + 1:].strip(' ,'); calls[me].add(ref)
# Pausable call sites are resolved through the class hierarchy (obfuscated names like a()V are
# reused by unrelated classes, so matching by name alone would mark half the app).
subs = defaultdict(set)
for c in classes.values():
    k = c.sup
    while k:
        subs[k].add(c.name)
        k = classes[k].sup if k in classes else None
    for i in c.ifaces: subs[i].add(c.name)
def ancestors(n):
    out = []
    while n in classes: out.append(n); n = classes[n].sup
    return out
def site_pausable(ref):
    if ref in BLOCKING: return True
    owner, key = ref.split('->')
    # calls declared on framework types (Object.equals, Runnable.run, ...) dispatch into the app
    # only through framework code we shim; treat them as non-pausable (threads are started by rt).
    if owner.startswith(('Ljava/', 'Landroid/', 'Ljavax/', 'Lorg/')) and owner not in classes: return False
    for cn in ancestors(owner) + sorted(subs.get(owner, ())):
        if f'{cn}->{key}' in needs_gen: return True
    return False
changed = True
while changed:
    changed = False
    for me, cs in calls.items():
        if me in needs_gen: continue
        if any(site_pausable(r) for r in cs):
            needs_gen.add(me); changed = True

# ---------------------------------------------------------------- emit
out = ['// AUTO-GENERATED by dex2js.py from the original Billiard.apk bytecode. Do not edit.',
       '(function (rt) {']
names = sorted(classes) if ONLY is None else sorted(n for n in classes if n in ONLY)
fails = []
for cn in names:
    c = classes[cn]
    parts = [f'rt.def({json.dumps(cn)}, {json.dumps(c.sup)}, {json.dumps(c.ifaces)}, {"true" if c.iface else "false"}, (C, rt) => {{']
    sf = {k: v for k, v in c.fields.items() if v['static']}
    inits = []
    for k, v in sf.items():
        t = v['type']; init = v['init']
        if init is not None and t in ('I', 'S', 'B', 'C'): val = str(lit(init) if not init.startswith("'") else ord(init[1]))
        elif init is not None and t == 'Z': val = '1' if init == 'true' else '0'
        elif init is not None and t == 'J': val = f'{lit(init)}n'
        elif init is not None and t in ('D', 'F'):
            vv = init.rstrip('fFdD'); val = num(float(vv)) if 'x' not in vv else num(float.fromhex(vv))
        elif init is not None and t == 'Ljava/lang/String;': val = js_str(init[1:-1])
        else: val = {'J': '0n', 'D': '0', 'F': '0', 'I': '0', 'Z': '0', 'B': '0', 'S': '0', 'C': '0'}.get(t, 'null')
        inits.append(f'{json.dumps(k)}: {val}')
    parts.append('  C.S = {' + ', '.join(inits) + '};')
    inst = {k: v for k, v in c.fields.items() if not v['static']}
    defaults = {k: {'J': '0n'}.get(v['type'], '0' if v['type'] in 'DFIZBSC' else 'null') for k, v in inst.items()}
    parts.append('  C.F = {' + ', '.join(f'{json.dumps(cn + "." + k)}: {v}' for k, v in defaults.items()) + '};')
    for m in c.methods:
        if m.abstract: continue
        try:
            js_params, bodyjs = Compiler(m).compile()
        except SystemExit as e:
            fails.append(str(e)); continue
        except Exception as e:
            fails.append(f'{cn}->{m.key}: {type(e).__name__} {e}'); continue
        gen = f'{cn}->{m.key}' in needs_gen
        fn = ('function* ' if gen else 'function ') + f'({js_params}) {{\n{bodyjs}\n}}'
        tgt = 'C' if m.static or m.name == '<clinit>' else 'C.prototype'
        parts.append(f'  {tgt}[{json.dumps(m.key)}] = {fn};' + (f'\n  {tgt}[{json.dumps(m.key)}].gen = true;' if gen else ''))
    parts.append('});')
    out.append('\n'.join(parts))
out.append('})(globalThis.DexRT);')
open(OUT, 'w').write('\n'.join(out))
print(f'compiled {len(names)} classes -> {OUT} ({os.path.getsize(OUT):,} bytes); {len(fails)} methods failed; {len(needs_gen)} blocking methods')
for f in fails[:25]: print('  FAIL', f)
