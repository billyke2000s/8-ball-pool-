from pathlib import Path
import sys
if len(sys.argv)!=3: raise SystemExit('Usage: apply_to_v18.py INPUT.html OUTPUT.html')
s=Path(sys.argv[1]).read_text()
if 'function strikerTapResult(' in s: raise SystemExit('Already patched')
def edit(old,new):
 global s
 if s.count(old)!=1: raise SystemExit('Patch target is missing or ambiguous: '+old[:70])
 s=s.replace(old,new,1)
helper=Path(__file__).with_name('striker.js').read_text()
helper=helper[helper.index('// wh.n'):helper.index('module.exports')]
edit('function nearestPocket(p){',helper+'''function nativeTouchUnit(){
 // Android x00.w is px/dp; use one CSS pixel, converted to table units.
 const rect=canvas.getBoundingClientRect();
 return W/Math.max(1,rect.width);
}
let strikerGesture=null,pendingStrikerChoice=null;
function chooseFreeStriker(id,remote=false){
 if(game.mode!=='free'||!game.freeBall||game.finished||shot||moving()||
    game.ballInHand||game.selectingRemoval||game.removingBallId!==null||
    (!remote&&!ownTurn()))return false;
 const selected=game.balls.find(b=>b.id===id&&b.active&&b.id!==game.strikerId);
 if(!selected)return false;
 setNativeStriker(id);
 if(!remote)sendNetwork({kind:'striker',id});
 showMessage('Ball '+id+' selected as striker');
 return true;
}
function closeStrikerChoice(){
 pendingStrikerChoice=null;$('strikerChoice').hidden=true;
}
function showStrikerChoice(id,p){
 pendingStrikerChoice={id,x:p.x,y:p.y};$('strikerChoice').hidden=false;
 $('chooseStriker').focus();
}
$('chooseStriker').onclick=()=>{
 const choice=pendingStrikerChoice;closeStrikerChoice();
 if(choice)chooseFreeStriker(choice.id);
};
$('aimAtStriker').onclick=()=>{
 const choice=pendingStrikerChoice;closeStrikerChoice();
 if(choice&&canAim()){
  const c=cueBall();aim=Math.atan2(choice.y-c.y,choice.x-c.x);
 }
};
$('cancelStrikerChoice').onclick=closeStrikerChoice;
function nearestPocket(p){''')
edit('function restart(showToast=false){','function restart(showToast=false){\n strikerGesture=null;closeStrikerChoice();')
edit("const canAim=()=>!game.finished", "const canAim=()=>!pendingStrikerChoice&&!game.finished")
edit("const foul=s.first===null||(!s.cushion&&made===0);", "// wh.l(): d0.z (striker contacted a ball) unlocks Free selection.\n game.freeBall=game.mode==='free'&&s.first!==null;\n const foul=s.first===null||(!s.cushion&&made===0);")
edit("if(!ownTurn()||game.finished)return;", "if(!ownTurn()||game.finished||pendingStrikerChoice||!$('screenOverlay').hidden)return;")
edit("pointerMode='aim';\n const c=cueBall()", """pointerMode='aim';
 strikerGesture=null;
 if(game.mode==='free'&&game.freeBall){
  const unit=nativeTouchUnit();
  const candidate=nearestEligibleBall(game.balls,p.x,p.y,36*unit,game.strikerId,true);
  if(candidate&&candidate.id!==game.strikerId)
   strikerGesture={id:candidate.id,started:performance.now(),unit};
 }
 const c=cueBall()""")
edit('if(settings.tapToAim&&hypot(dx,dy)>BALL_R*2)aim=aimTouchAngle;', 'if(settings.tapToAim&&!strikerGesture&&hypot(dx,dy)>BALL_R*2)aim=aimTouchAngle;')
edit("if(e.pointerId!==pointerId)return;\n if(pointerMode==='power'", """if(e.pointerId!==pointerId)return;
 if(pointerMode==='aim'&&strikerGesture){
  const p=screenPos(e),g=strikerGesture;
  const released=nearestEligibleBall(game.balls,p.x,p.y,36*g.unit,game.strikerId,true);
  const result=strikerTapResult({elapsedMs:performance.now()-g.started,
   dx:p.x-origin.x,dy:p.y-origin.y,unit:g.unit,candidateId:g.id,
   releaseId:released?.id,tapToAim:settings.tapToAim});
  strikerGesture=null;
  if(result!=='none'){
   if(result==='choose-or-aim')showStrikerChoice(g.id,p);
   else chooseFreeStriker(g.id);
   pointerId=null;pointerMode=null;dragging=false;return;
  }
 }
 if(pointerMode==='power'""")
edit("pointerId=null;pointerMode=null;dragging=false;\n}", "strikerGesture=null;pointerId=null;pointerMode=null;dragging=false;\n}")
edit("pointerMode=null;pointerId=null;dragging=false;choosePower(0);", "strikerGesture=null;pointerMode=null;pointerId=null;dragging=false;choosePower(0);")
edit("if($('screenOverlay').hidden===false||", "if(pendingStrikerChoice){if(e.key==='Escape')closeStrikerChoice();return;}\n if($('screenOverlay').hidden===false||")
edit("function setMenu(open){$('screenOverlay')", "function setMenu(open){if(open)closeStrikerChoice();$('screenOverlay')")
edit("strikerId:game.strikerId,selectingRemoval:", "strikerId:game.strikerId,freeBall:game.freeBall,selectingRemoval:")
edit("else if(d.kind==='remove'", "else if(d.kind==='striker'&&!ownTurn())chooseFreeStriker(Number(d.id),true);\n else if(d.kind==='remove'")
edit("game={...game,...state,sound:settings.sound,playerMode:'local'};", "closeStrikerChoice();strikerGesture=null;\n game={...game,...state,sound:settings.sound,playerMode:'local'};")
edit('</style>', '''#strikerChoice{position:fixed;inset:0;z-index:20;background:#0008;display:grid;place-items:center}
#strikerChoice>div{background:#20252b;color:white;padding:20px;border-radius:12px;max-width:90vw}
</style>''')
edit('<div id="screenOverlay" hidden>', '''<div id="strikerChoice" hidden role="dialog" aria-modal="true" aria-label="Aim or choose ball">
 <div><p>Aim at this ball or use it as the striker?</p>
 <button id="aimAtStriker">Aim</button> <button id="chooseStriker">Choose ball</button>
 <button id="cancelStrikerChoice">Cancel</button></div>
</div>
<div id="screenOverlay" hidden>''')
power_module=Path(__file__).with_name('power.js').read_text()
power_module=power_module[power_module.index('// ko.j'):power_module.index('module.exports')]
edit('function choosePower(p){', power_module+"const POWER_CONTROL={top:845,travel:301};\nfunction choosePower(p){")
edit("if(p.x<77&&p.y>805&&p.y<1200){pointerMode='power';choosePower(0);return;}",
 "if(p.x<77&&p.y>805&&p.y<1200){pointerMode='power';choosePower(100*nativePowerRatio(p.y,p.y,POWER_CONTROL.top,POWER_CONTROL.travel,settings.tapToShoot));return;}")
edit("choosePower(clamp((p.y-origin.y)*.48,0,100));",
 "choosePower(100*nativePowerRatio(p.y,origin.y,POWER_CONTROL.top,POWER_CONTROL.travel,settings.tapToShoot));")
edit("if(pointerMode==='aim'&&settings.tapToShoot&&power>=1.7)fire(aim,power);", "// Native tap-to-shoot belongs to the strength control, not the felt.")
edit("if(pointerMode==='power'&&power>=1.7)fire(aim,power);", "if(pointerMode==='power'&&power>1.7)fire(aim,power);")
edit("if(!Number.isFinite(a)||!Number.isFinite(p)||p<1.7)return false;", "if(!Number.isFinite(a)||!Number.isFinite(p)||p<=1.7)return false;")
edit("ctx.fillStyle='#f2d68c7a';roundedRect(20,y+20,16,(h-40)*power/100,5);ctx.fill();", """const bars=nativePowerSegments(POWER_CONTROL.travel,power/100);
  for(let n=0;n<bars.count;n++){
   const rgb=POWER_COLORS[n];ctx.fillStyle='rgb('+rgb.join(',')+')';
   ctx.fillRect(x,POWER_CONTROL.top+n*(bars.height+bars.gap),w,bars.height);
  }""")
edit('Tap to shoot (use selected power)', 'Tap power bar to shoot')
Path(sys.argv[2]).write_text(s)
