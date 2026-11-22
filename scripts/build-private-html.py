"""Rebuild the private, playable HTML (original art + sounds + music) from the public
placeholder fixture in this repo and the user's own copy of Billiard.apk.

  python3 scripts/build-private-html.py /path/to/Billiard.apk Billiards.html [fixture.html]

The fixture defaults to research/phase23/fixture.html (always the latest version).
Nothing from the APK is written into the repository; only the output file contains it.
"""
import base64, hashlib, io, json, re, sys, zipfile
from pathlib import Path

EXPECTED_SHA256 = 'd91843d6675d0787e65c4b089edca7e159c10694eb49692380dd4a5acea69f26'
MIME = {'.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.mid': 'audio/midi'}

if len(sys.argv) not in (3, 4):
    raise SystemExit(__doc__)
apk_path, out = Path(sys.argv[1]), Path(sys.argv[2])
fixture = Path(sys.argv[3]) if len(sys.argv) == 4 else Path(__file__).resolve().parent.parent / 'research/phase23/fixture.html'
apk = apk_path.read_bytes()
digest = hashlib.sha256(apk).hexdigest()
if digest != EXPECTED_SHA256:
    print(f'WARNING: APK SHA-256 {digest} differs from the analysed build; assets may not match.', file=sys.stderr)

s = fixture.read_text()
m = re.search(r'const ORIGINAL_ASSETS = (\{.*?\});', s, re.S)
names = list(json.loads(m[1]))
audio = re.search(r"const audioKeys=\[(.*?)\];", s)[1]
names += [n.strip("'\" ") for n in audio.split(',') if n.strip("'\" ") not in names]

zf = zipfile.ZipFile(io.BytesIO(apk))
files = {Path(n).stem: n for n in zf.namelist()
         if n.startswith(('res/drawable-nodpi-v4/', 'res/raw/')) and Path(n).suffix in MIME}
assets = {}
for name in names:
    if name not in files:
        raise SystemExit(f'Asset {name!r} not found in APK')
    entry = files[name]
    assets[name] = f'data:{MIME[Path(entry).suffix]};base64,' + base64.b64encode(zf.read(entry)).decode()

s = s[:m.start(1)] + json.dumps(assets, separators=(',', ':')) + s[m.end(1):]
s = s.replace('/* HEADLESS TEST FIXTURE ONLY: dimension-matched solid SVG placeholders; no APK artwork or sound. */',
              '/* Assets below are lossless base64 of images/sounds from the user-supplied Billiard.apk; no external files required. */')
s = s.replace('<title>TEST FIXTURE — ', '<title>')
out.write_text(s)
print(f'{out}: {len(s):,} bytes, {len(assets)} original assets embedded')
