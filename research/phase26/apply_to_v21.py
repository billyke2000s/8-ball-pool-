from pathlib import Path
import sys
if len(sys.argv)!=3:raise SystemExit('Usage: apply_to_v21.py INPUT.html OUTPUT.html')
s=Path(sys.argv[1]).read_text()
def edit(old,new):
 global s
 if s.count(old)!=1:raise SystemExit('Missing/ambiguous target: '+old[:80])
 s=s.replace(old,new,1)
edit('let game,aim=', "let appModal=null,resultDialogTimer=0,randomOpening=null;\nlet game,aim=")
edit("const settings={friction:2,", "const settings={firstTurn:0,powerSide:'left',friction:2,")
edit("ballSet:$('ballSet').value,players:$('players').value,", "ballSet:$('ballSet').value,players:$('players').value,firstTurn:Number($('firstTurn').value),powerSide:$('powerSide').value,")
edit("if(['local','cpu','solo'].includes(v.players))$('players').value=v.players;", "if(['local','cpu','solo'].includes(v.players))$('players').value=v.players;\n  if([0,1,2].includes(v.firstTurn))$('firstTurn').value=String(v.firstTurn);\n  if(['left','right'].includes(v.powerSide))$('powerSide').value=v.powerSide;")
edit('function restart(showToast=false){', 'function restart(showToast=false){\n clearTimeout(resultDialogTimer);resultDialogTimer=0;closeAppModal();')
edit("ballSet=$('ballSet').value;playerMode=$('players').value;", "ballSet=$('ballSet').value;playerMode=$('players').value;\n settings.firstTurn=Number($('firstTurn').value);settings.powerSide=$('powerSide').value;")
edit("if(role==='host')sendNetwork({kind:'state',game:exportState()});\n}", """// wh.s / first_move: CPU-only first turn; random alternates after first choice.
 if(game.playerMode==='cpu'){
  if(settings.firstTurn===1)game.turn=1;
  else if(settings.firstTurn===2){randomOpening=randomOpening===null?(Math.random()>.5):!randomOpening;game.turn=randomOpening?1:0;}
  if(game.turn===1){showMessage('Computer’s turn');cpuTimeout=setTimeout(cpuShoot,1050);}
 }
 if(role==='host')sendNetwork({kind:'state',game:exportState()});
}""")
edit('const canAim=()=>!pendingStrikerChoice', 'const canAim=()=>!appModal&&!pendingStrikerChoice')
edit('let x=637,y=831,w=62,h=293;', "let x=settings.powerSide==='right'?1:637,y=831,w=62,h=293;")
edit('let x=0,y=845,w=58,h=301;', "let x=settings.powerSide==='right'?W-58:0,y=845,w=58,h=301;")
edit('roundedRect(24,y+20,8,h-40,2)', 'roundedRect(x+24,y+20,8,h-40,2)')
edit("if(p.x<77&&p.y>805&&p.y<1200)", "if((settings.powerSide==='right'?p.x>W-77:p.x<77)&&p.y>805&&p.y<1200)")
edit('if(settings.aimingWheel&&p.x>627&&p.y>807&&p.y<1175)', "if(settings.aimingWheel&&(settings.powerSide==='right'?p.x<73:p.x>627)&&p.y>807&&p.y<1175)")
edit("if(!ownTurn()||game.finished||pendingStrikerChoice||!$('screenOverlay').hidden)return;", "if(!ownTurn()||game.finished||appModal||pendingStrikerChoice||!$('screenOverlay').hidden)return;")
edit("if(pendingStrikerChoice){if(e.key==='Escape')closeStrikerChoice();return;}", "if(appModal){if(e.key==='Escape')closeAppModal();return;}\n if(pendingStrikerChoice){if(e.key==='Escape')closeStrikerChoice();return;}")
module=Path(__file__).with_name('screens.js').read_text()
edit('function frame(ts){',module+'\nfunction frame(ts){\n maybeShowResult();')
edit('</style>', '''.app-modal{position:fixed;inset:0;z-index:30;display:grid;place-items:center;background:#000b;padding:16px}
.app-modal>section{background:#12334b;color:#fff;padding:24px;border-radius:12px;max-width:520px;width:100%;max-height:85vh;overflow:auto}
.app-modal table{width:100%;border-collapse:collapse;margin:16px 0}.app-modal th,.app-modal td{padding:10px;text-align:left;border-bottom:1px solid #ffffff30}
.app-modal .stats{white-space:pre-line;line-height:1.8}.app-modal h2{margin-top:0}
</style>''')
edit('<div id="screenOverlay" hidden>', '''<div id="recordsModal" class="app-modal" hidden><section role="dialog" aria-modal="true" aria-label="Records">
 <h2>Records</h2><table><thead><tr><th>Difficulty</th><th>Games played</th><th>Games won</th></tr></thead><tbody>
 <tr><th>Easy</th><td id="record_easy_played">0</td><td id="record_easy_won">0</td></tr>
 <tr><th>Normal</th><td id="record_normal_played">0</td><td id="record_normal_won">0</td></tr>
 <tr><th>Hard</th><td id="record_hard_played">0</td><td id="record_hard_won">0</td></tr>
 </tbody></table><button id="closeRecords">OK</button>
 </section></div>
<div id="resultModal" class="app-modal" hidden><section role="dialog" aria-modal="true" aria-label="Game result">
 <h2 id="resultTitle">Game over</h2><p id="resultStats" class="stats"></p><button id="closeResult">OK</button>
 </section></div>
<div id="screenOverlay" hidden>''')
edit('<label>Computer difficulty', '''<label>First turn (against computer)<select id="firstTurn"><option value="0">Human</option><option value="1">Computer</option><option value="2">Random, then alternate</option></select></label>
   <label>Power bar<select id="powerSide"><option value="left">Left</option><option value="right">Right</option></select></label>
   <div class="buttons"><button id="showRecords">Records</button><button id="fullscreenButton">Full screen</button></div>
   <label>Computer difficulty''')
edit("$('newRack').onclick=", "$('showRecords').onclick=showRecords;\n$('closeRecords').onclick=closeAppModal;$('closeResult').onclick=closeAppModal;\n$('firstTurn').onchange=()=>{settings.firstTurn=Number($('firstTurn').value);savePreferences();};\n$('powerSide').onchange=()=>{settings.powerSide=$('powerSide').value;savePreferences();};\n$('fullscreenButton').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(_error){announce('Full screen is unavailable in this browser');}};\n$('newRack').onclick=")
edit('ctx.createLinearGradient(23,0,34,0)', 'ctx.createLinearGradient(x+23,0,x+34,0)')
start=s.index('<title>');end=s.index('</title>',start)
s=s[:start]+'<title>Billiards v22'+s[end:]
start=s.index('  <footer>');end=s.index('</footer>',start)+len('</footer>')
s=s[:start]+'  <footer>Billiards browser port · v22</footer>'+s[end:]
Path(sys.argv[2]).write_text(s)
