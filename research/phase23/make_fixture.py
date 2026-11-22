from pathlib import Path
import re,json,base64,io,sys
if len(sys.argv)!=3: raise SystemExit("Usage: make_fixture.py INPUT.html OUTPUT.html")
from PIL import Image
s=Path(sys.argv[1]).read_text()
m=re.search(r'const ORIGINAL_ASSETS = (\{.*?\});',s,re.S)
a=json.loads(m[1]);clean={}
for name,url in a.items():
 if not url.startswith('data:image/'): continue
 im=Image.open(io.BytesIO(base64.b64decode(url.split(',')[1])))
 w,h=im.size
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}"><rect width="100%" height="100%" fill="#777"/></svg>'
 clean[name]='data:image/svg+xml;base64,'+base64.b64encode(svg.encode()).decode()
s=s[:m.start(1)]+json.dumps(clean,separators=(',',':'))+s[m.end(1):]
s=s.replace('/* Assets below are lossless base64 of images/sounds from the user-supplied Billiard.apk; no external files required. */','/* HEADLESS TEST FIXTURE ONLY: dimension-matched solid SVG placeholders; no APK artwork or sound. */')
s=s.replace('<title>', '<title>TEST FIXTURE — ')
Path(sys.argv[2]).write_text(s)
print(len(s),'bytes;',len(clean),'placeholder images; original artwork/audio stripped')
