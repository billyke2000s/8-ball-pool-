"""Generate compile+link stubs for every android.* member the original bytecode references.
Methods return default values; overrides in stubs_manual/ replace generated files."""
import re, os, sys, collections
from pathlib import Path

txt = Path('javap.txt').read_text(errors='replace')
D = {'B': 'byte', 'C': 'char', 'D': 'double', 'F': 'float', 'I': 'int', 'J': 'long', 'S': 'short', 'Z': 'boolean', 'V': 'void'}

def parse_types(desc):
    out, i = [], 0
    while i < len(desc):
        dim = 0
        while desc[i] == '[': dim += 1; i += 1
        if desc[i] == 'L':
            j = desc.index(';', i); t = desc[i+1:j].replace('/', '.').replace('$', '.'); i = j + 1
        else:
            t = D[desc[i]]; i += 1
        out.append(t + '[]' * dim)
    return out

classes = collections.defaultdict(lambda: {'methods': set(), 'fields': set(), 'iface': False, 'super': None, 'ifaces': set()})
def isandroid(n): return n.startswith(('android/','dalvik/','org/xmlpull/','org/json/'))

for m in re.finditer(r'(invokestatic|invokevirtual|invokespecial|invokeinterface)\s+#\d+(?:,\s*\d+)?\s+// (?:Interface)?Method ([\w/$]+)\.("?<?\w+>?"?):(\(.*?\)\S+)', txt):
    kind, owner, name, desc = m.groups()
    if not isandroid(owner): continue
    classes[owner]['methods'].add((kind, name.strip('"'), desc))
    if kind == 'invokeinterface': classes[owner]['iface'] = True
for m in re.finditer(r'(getstatic|putstatic|getfield|putfield)\s+#\d+\s+// Field ([\w/$]+)\.(\w+):(\S+)', txt):
    kind, owner, name, desc = m.groups()
    if isandroid(owner): classes[owner]['fields'].add((kind in ('getstatic', 'putstatic'), name, desc))
for m in re.finditer(r'// class ([\w/$]+)', txt):
    if isandroid(m[1]): classes[m[1]]
# class headers: "public class x extends android.view.View implements ..."
for m in re.finditer(r'^(?:public |final |abstract |synthetic |\s)*(class|interface) ([\w.$]+)(?: extends ([\w.$, ]+?))?(?: implements ([\w.$, ]+))?\s*$', txt, re.M):
    kind, name, ext, impl = m.groups()
    for lst, is_impl in ((ext, kind == 'interface'), (impl, True)):
        for n in (lst or '').replace(' ', '').split(','):
            n2 = n.replace('.', '/')
            if not n or not isandroid(n2): continue
            # nested class names come as a.b.C$D in headers
            classes[n2]
            if is_impl: classes[n2]['iface'] = True
            elif kind == 'class': classes[n2]['superOf'] = True
# Known framework interfaces regardless of usage
for n in list(classes):
    if re.search(r'\$On\w+Listener$|Listener$|Callback$|Callbacks$|\$Callback$|Parcelable\$Creator|Parcelable\$ClassLoaderCreator|^android/os/IInterface$|^android/text/Spannable$|^android/text/Spanned$|^android/text/Editable$|^android/text/InputFilter$|^android/text/TextWatcher$|^android/view/Menu$|^android/view/MenuItem$|^android/view/SubMenu$|^android/widget/ListAdapter$|^android/widget/SpinnerAdapter$|^android/widget/Adapter$|^android/content/DialogInterface$|^android/content/SharedPreferences(\$Editor)?$|^android/view/ViewParent$|^android/animation/TimeInterpolator$|^android/animation/TypeEvaluator$|^android/view/WindowInsetsAnimation', n):
        if not n.endswith('Adapter') or n in ('android/widget/ListAdapter', 'android/widget/SpinnerAdapter', 'android/widget/Adapter'):
            classes[n]['iface'] = True
    if n in ('android/widget/BaseAdapter',): classes[n]['iface'] = False

def default(t):
    if t == 'void': return ''
    if t == 'boolean': return 'return false;'
    if t in ('byte', 'char', 'short', 'int', 'long', 'float', 'double'): return 'return (%s)0;' % t
    if t.endswith('[]'): return 'return null;'
    if t == 'java.lang.String' or t == 'java.lang.CharSequence': return 'return "";'
    key = t.replace('.', '/')
    # nested names were flattened with '.', try to map back to a generated class
    for cand in [key] + [key[:i] + '$' + key[i+1:] for i in range(len(key)) if key[i] == '/']:
        if cand in classes and not classes[cand]['iface'] and cand.split('/')[-1].split('$')[-1][0].isupper():
            return f'return new {t}();'
    return 'return null;'

# every android type mentioned in a descriptor or app field must exist
for m in re.finditer(r'L((?:android|dalvik|org/xmlpull|org/json)/[\w/$]+);', txt):
    classes[m[1]]
def jname(n): return n.replace('/', '.').replace('$', '.')
tops = collections.defaultdict(list)
for n in classes:
    top = n.split('$')[0]; tops[top].append(n)
manual = {str(p.relative_to('stubs_manual'))[:-5] for p in Path('stubs_manual').rglob('*.java')} if Path('stubs_manual').exists() else set()

def body(n, nested):
    c = classes[n]; simple = n.split('/')[-1].split('$')[-1]
    iface = c['iface']
    head = ('public ' + ('static ' if nested else '') + ('interface ' if iface else 'class ') + simple + ' {')
    lines = [head]
    if not iface: lines.append(f'  public {simple}() {{}}')
    seen = set()
    for static, name, desc in sorted(c['fields']):
        if name in seen: continue
        seen.add(name)
        t = parse_types(desc)[0]
        lines.append(f'  public {"static " if static else ""}{t} {name};')
    sigs = set()
    for kind, name, desc in sorted(c['methods']):
        args, ret = desc[1:].split(')')
        at = parse_types(args); rt = parse_types(ret)[0]
        key = (name, tuple(at))
        if key in sigs: continue
        sigs.add(key)
        params = ', '.join(f'{t} a{i}' for i, t in enumerate(at))
        if name == '<init>':
            if iface: continue
            if at: lines.append(f'  public {simple}({params}) {{}}')
            continue
        if iface and kind != 'invokestatic':
            lines.append(f'  default {rt} {name}({params}) {{ {default(rt)} }}')
        else:
            st = 'static ' if kind == 'invokestatic' else ''
            lines.append(f'  public {st}{rt} {name}({params}) {{ {default(rt)} }}')
    for sub in sorted(x for x in tops[n.split('$')[0]] if x.startswith(n + '$') and x.count('$') == n.count('$') + 1):
        lines += ['  ' + l for l in body(sub, True)]
    lines.append('}')
    return lines

os.makedirs('stubs', exist_ok=True)
count = 0
for top in tops:
    rel = top.replace('/', os.sep)
    if rel in manual: continue
    pkg = '.'.join(top.split('/')[:-1])
    if top not in classes: classes[top]
    p = Path('stubs') / (rel + '.java'); p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(f'package {pkg};\n@SuppressWarnings("all")\n' + '\n'.join(body(top, False)) + '\n')
    count += 1
print('stub top-level classes', count)
