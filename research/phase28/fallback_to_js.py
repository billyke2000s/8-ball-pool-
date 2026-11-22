"""Mechanically translate a JADX *fallback-mode* method (goto form, one statement per line)
into a JavaScript function that runs as a label state machine. Used for l30.m(), whose
structured JADX/Java output is self-contradictory. No hand edits are made to the logic.

  python3 fallback_to_js.py l30m_fallback.java l30_m > l30_m.js

Supported statement shapes are exactly the ones present in l30.m; anything else aborts.
"""
import re, sys

src, fname = sys.argv[1], sys.argv[2]
lines = [l.strip() for l in open(src).read().splitlines()]
header = lines[0]
params = re.findall(r'\b(r\d+)\b', header.split('(', 1)[1])
body = lines[1:-1] if lines[-1] == '}' else lines[1:]

def const(m):
    # 9218868437227405312(0x7ff0000000000000, double:Infinity)  -> Infinity
    kind, val = m.group(2), m.group(3)
    if kind != 'double': raise SystemExit('non-double wide constant: ' + m.group(0))
    return '(' + {'Infinity': 'Infinity', '-Infinity': '-Infinity', 'NaN': 'NaN'}.get(val, val) + ')'

out, regs, labels = [], set(params), []
STATIC_OK = {'k7', 'mt', 'si', 'y7', 'gm', 't00'}
for raw in body:
    s = raw
    if not s: continue
    s = re.sub(r'-?\d+\((0x[0-9a-f]+), (\w+):([^)]*)\)', lambda m: const(re.match(r'(0x[0-9a-f]+), (\w+):(.*)', f'{m.group(1)}, {m.group(2)}:{m.group(3)}')), s)
    m = re.fullmatch(r'(L[0-9a-f]+):', s)
    if m:
        labels.append(m[1]); out.append(f"   case '{m[1]}':"); continue
    m = re.fullmatch(r'goto (L[0-9a-f]+)', s)
    if m: out.append(f"    pc='{m[1]}'; continue;"); continue
    m = re.fullmatch(r'if \((r\d+) (==|!=|<|<=|>|>=) (r\d+|0)\) goto (L[0-9a-f]+)', s)
    if m:
        a, op, b, lab = m.groups()
        if b == '0' and op in ('==', '!='):
            # Dalvik if-eqz/if-nez test int 0, boolean false AND null references alike.
            cond = f'isZ({a})' if op == '==' else f'!isZ({a})'
        else:
            cond = f'{a} {op} {b}'
        out.append(f"    if ({cond}) {{ pc='{lab}'; continue; }}"); continue
    m = re.fullmatch(r'return (r\d+)', s)
    if m: out.append(f'    return {m[1]};'); continue
    # strip a leading Java type on declarations: "double r0 = ...", "java.lang.String r2 = ..."
    s = re.sub(r'^(?:[\w.]+(?:\[\])?) (r\d+ = )', r'\1', s)
    s = re.sub(r'^int (r\d+ = )', r'\1', s)
    for r in re.findall(r'\br\d+\b', s): regs.add(r)
    # increments
    # casts
    s = re.sub(r'\((?:s8|k7|gm)\) ', '', s)
    s = s.replace('java.lang.Math.min(', 'Math.min(')
    s = re.sub(r'(r\d+)\.size\(\)', r'\1.length', s)
    s = re.sub(r'(r\d+)\.get\((r\d+)\)', r'\1[\2]', s)
    # gm / StringBuilder construction: "rX = new gm" then "rY.<init>(a, b)"
    if re.fullmatch(r'r\d+ = new gm', s): out.append('    ' + s.replace('new gm', 'new GM()') + ';'); continue
    if re.fullmatch(r'r\d+ = new java\.lang\.StringBuilder', s): out.append('    ' + s.replace('new java.lang.StringBuilder', "new SB()") + ';'); continue
    m = re.fullmatch(r'(r\d+)\.<init>\((.*)\)', s)
    if m: out.append(f'    {m[1]}.init({m[2]});'); continue
    m = re.fullmatch(r'(r\d+) = (r\d+)\.append\((r\d+)\)', s)
    if m: out.append(f'    {m[1]} = {m[2]}.append({m[3]});'); continue
    if re.fullmatch(r'(r\d+) = (r\d+)\.toString\(\)', s): out.append('    ' + s + ';'); continue
    if re.fullmatch(r't00\.S\(r\d+, r\d+\)', s): out.append('    ' + s + ';'); continue
    # cmpl/cmpg results are printed as (a > b ? 1 : (a == b ? 0 : -1)); identical for non-NaN values.
    # instance method calls: methods carry a trailing underscore in engine.js (see there)
    s = re.sub(r'\b(r\d+)\.(\w+)\(', r'\1.\2_(', s)
    # statics must be one of the engine namespaces
    for st in re.findall(r'\b([a-z]\w*)\.\w+', s):
        if st not in STATIC_OK and not re.fullmatch(r'r\d+', st) and st not in ('Math',):
            raise SystemExit('unexpected reference: ' + raw)
    if not re.fullmatch(r'[\w.\[\]\- =+*(),\'"<>!?:]+', s): raise SystemExit('unsupported: ' + raw)
    out.append('    ' + s + ';')

regs -= set(params)
js = [f'// AUTO-GENERATED from JADX fallback output of l30.{fname.split("_")[-1]}() by fallback_to_js.py. Do not edit.',
      'function isZ(v) { return v === 0 || v === null || v === false || v === undefined; }',
      f'function {fname}({", ".join(params)}) {{',
      '  let ' + ', '.join(sorted(regs, key=lambda r: int(r[1:]))) + ';',
      "  let pc = 'start';",
      '  for (;;) switch (pc) {',
      "   case 'start':"] + out + ["    throw new Error('fell off end');", "  }", "}"]
print('\n'.join(js))
