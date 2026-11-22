"""Phase 27: v22 -> v23. Native game-type/difficulty choosers, quit dialog, Android back
semantics, result-OK restart and original music (entertainer.mid). Usage:
  python3 apply_to_v22.py v22.html v23.html [path/to/res/raw/entertainer.mid]
The optional MIDI path embeds the original music in private builds. Without it the page
still works; music is simply unavailable (public test fixtures)."""
from pathlib import Path
import base64, sys
if len(sys.argv) not in (3, 4): raise SystemExit(__doc__)
s = Path(sys.argv[1]).read_text()
here = Path(__file__).parent
def edit(old, new):
    global s
    if s.count(old) != 1: raise SystemExit('Missing/ambiguous target: ' + old[:80])
    s = s.replace(old, new, 1)

if len(sys.argv) == 4:
    midi = 'data:audio/midi;base64,' + base64.b64encode(Path(sys.argv[3]).read_bytes()).decode()
    edit('const ORIGINAL_ASSETS = {', 'const ORIGINAL_ASSETS = {"entertainer":"' + midi + '",')
# entertainer is audio, never an <img>.
edit("const audioKeys=['cue_strike','balls_collide','ball_in_pocket','applause'];",
     "const audioKeys=['cue_strike','balls_collide','ball_in_pocket','applause','entertainer'];")
modules = (here / 'music.js').read_text() + '\n' + (here / 'screens.js').read_text()
edit('function frame(ts){', modules + '\nfunction frame(ts){')
edit("appModal=null;$('recordsModal').hidden=true;$('resultModal').hidden=true;",
     "appModal=null;$('recordsModal').hidden=true;$('resultModal').hidden=true;hideNavigationModals();")
# Menu-started games keep the native mode in step with the Players selector.
edit("ballSet=$('ballSet').value;playerMode=$('players').value;",
     "ballSet=$('ballSet').value;playerMode=$('players').value;\n nativeMode={solo:'single',cpu:'pvc',local:'pvp'}[playerMode]||'pvp';")
# oh/xb(1): result OK restarts.
edit("$('closeRecords').onclick=closeAppModal;$('closeResult').onclick=closeAppModal;",
     "$('closeRecords').onclick=closeAppModal;$('closeResult').onclick=resultOk;\n"
     "$('chooseMode1').onclick=()=>chooseNative(1);$('chooseMode2').onclick=()=>chooseNative(2);$('chooseMode3').onclick=()=>chooseNative(3);\n"
     "$('quitYes').onclick=quitYes;$('quitNo').onclick=closeAppModal;$('quitRestart').onclick=quitRestart;\n"
     "$('musicToggle').onclick=()=>{setMusicEnabled(!music.enabled);savePreferences();};")
# Escape = Android back.
edit("if(appModal){if(e.key==='Escape')closeAppModal();return;}",
     "if(appModal){if(e.key==='Escape')nativeBack();return;}\n if(e.key==='Escape'&&!$('screenOverlay').hidden){setMenu(false);return;}")
edit("}else if(e.key==='Escape')setMenu(!$('screenOverlay').hidden);",
     "}else if(e.key==='Escape')nativeBack();")
# Music preference (default off, as t40 music_track "off").
edit("loseIfScratchOnBlack:$('loseIfScratchOnBlack').checked\n }));",
     "loseIfScratchOnBlack:$('loseIfScratchOnBlack').checked,\n  music:music.enabled\n }));")
edit("if(typeof v.loseIfScratchOnBlack==='boolean')$('loseIfScratchOnBlack').checked=v.loseIfScratchOnBlack;",
     "if(typeof v.loseIfScratchOnBlack==='boolean')$('loseIfScratchOnBlack').checked=v.loseIfScratchOnBlack;\n"
     "  if(typeof v.music==='boolean')music.enabled=v.music;")
edit("$('soundToggle').textContent='Sound: '+(settings.sound?'on':'off');\nrestart();requestAnimationFrame(frame);",
     "$('soundToggle').textContent='Sound: '+(settings.sound?'on':'off');\n"
     "$('musicToggle').textContent='Music: '+(music.enabled?'on':'off');\n"
     "restart();requestAnimationFrame(frame);\n"
     "// GameActivity starts in vh.UNKNOWN; onResume shows the game-type chooser.\n"
     "showGameTypeChooser();armBackGuard();")
edit('<button id="soundToggle">Sound: on</button>',
     '<button id="soundToggle">Sound: on</button><button id="musicToggle">Music: off</button>')
edit('<div id="screenOverlay" hidden>', '''<div id="chooserModal" class="app-modal" hidden><section role="dialog" aria-modal="true" aria-labelledby="chooserTitle" class="native-chooser">
 <h2 id="chooserTitle">Select Game Type</h2>
 <button id="chooseMode1">1 Player</button><button id="chooseMode2">Human vs Computer</button><button id="chooseMode3">2 Players</button>
 </section></div>
<div id="quitModal" class="app-modal" hidden><section role="dialog" aria-modal="true" aria-label="Quit game">
 <h2>Quit this game?</h2>
 <div class="quit-buttons"><button id="quitYes">Yes</button><button id="quitNo">No</button><button id="quitRestart">Restart</button></div>
 </section></div>
<div id="screenOverlay" hidden>''')
edit('</style>', '''.native-chooser{text-align:center}.native-chooser button{display:block;width:80%;margin:12px auto;padding:14px;font-size:1.1em}
.quit-buttons{display:flex;gap:10px;justify-content:center}.quit-buttons button{flex:1;padding:12px}
</style>''')
start = s.index('<title>'); end = s.index('</title>', start)
title = s[start:end]
s = s[:start] + title.replace('v22', 'v23') + s[end:]
edit('Billiards browser port · v22</footer>', 'Billiards browser port · v23</footer>')
Path(sys.argv[2]).write_text(s)
print('wrote', sys.argv[2], len(s), 'bytes')
