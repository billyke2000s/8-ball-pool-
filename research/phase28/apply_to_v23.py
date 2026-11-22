"""Phase 28: v23 -> v24. Replace the browser port's physics with the verified translation
of the original engine (native-engine.js + exported geometry), and drive the table, rack,
pockets and settings from the original values.

  python3 apply_to_v23.py v23.html v24.html
"""
from pathlib import Path
import json, sys
if len(sys.argv) != 3: raise SystemExit(__doc__)
here = Path(__file__).parent
s = Path(sys.argv[1]).read_text()
def edit(old, new, count=1):
    global s
    n = s.count(old)
    if n != count: raise SystemExit(f'expected {count} match(es), found {n}: {old[:90]!r}')
    s = s.replace(old, new)

def module(path, name):
    src = (here / path).read_text().replace('\r', '')
    return f'const {name} = (() => {{ const module = {{ exports: {{}} }};\n{src}\nreturn module.exports; }})();\n'
geometry = json.loads((here / 'geometry-700x1400.json').read_text())
modules = ('\n// ===== Phase 28: original engine, machine/line-by-line translated and bit-exact verified =====\n'
           + 'const NATIVE_GEOMETRY = ' + json.dumps(geometry, separators=(',', ':')) + ';\n'
           + module('fdlibm_pow.js', 'fdlibmPow')
           + module('native-engine.js', 'NativeEngine')
           + (here / 'bridge.js').read_text() + '\n')
edit('function frame(ts){', modules + 'function frame(ts){')

# Geometry becomes per-game (pocket size changes the table in the original).
edit('const FIELD={left:74,right:626,top:78,bottom:1322};', 'let FIELD={left:74,right:626,top:78,bottom:1322}; // replaced per game from mt (phase 28)')
edit("const POCKETS=[{x:70,y:71,type:'corner'}", "let POCKETS=[{x:70,y:71,type:'corner'}")
# Rack and balls come from the original wh.s()/mt.m0.
edit('function initialBalls(mode) {', 'function initialBalls(mode) {\n if(nativeView)return nativeBallsForUi(); // phase 28: original rack (wh.s, mt.m0, x00.d order)')
edit(' const balls=initialBalls(ballSet);', ' nativeNewGame();\n const balls=initialBalls(ballSet);')
edit(' const home=initialBalls(game.mode).find(b=>b.id===8);', ' const home=nativeBlackSpot();')
edit('function safeCueLocation(x=350,y=1040){', 'function safeCueLocation(x=nativeCueSpot().x,y=nativeCueSpot().y){')
# Motion state and the frame loop: one engine step per drawn frame (m7.c / wh.onDraw).
edit('const moving=()=>game.balls.some(b=>b.active&&hypot(b.vx,b.vy)>NATIVE_STOP_SPEED);', 'const moving=()=>nativeMoving();')
edit(""" accumulator=Math.min(.12,accumulator+frameMs/1000);lastFrame=ts;
 const dt=1/150;let iterations=0;
 while(accumulator>=dt&&iterations++<20){simulate(dt);accumulator-=dt;}
 render();requestAnimationFrame(frame);""", """ lastFrame=ts;
 if(shot&&strike)advanceStrike(Math.min(Math.max(frameMs,0),50)/1000);
 // wh.onDraw draws, then the m7 physics thread runs exactly one k7.k() pass per drawn frame.
 render();nativeFrame(ts);nativeCountWin();requestAnimationFrame(frame);""")
# Strike: ia.a() velocity in the engine; break wobble decided by the shooter and sent to peers.
edit('function fire(a=aim,p=power,remote=false){', 'function fire(a=aim,p=power,remote=false,remoteDeg=null){')
edit(" localShot=!remote;game.shotNumber++;\n if(localShot)sendNetwork({kind:'shot',a:aim,p:power});",
     " localShot=!remote;game.shotNumber++;\n const nativeDeg=remote&&Number.isFinite(remoteDeg)?remoteDeg:nativeShotDegrees(aim);\n if(localShot)sendNetwork({kind:'shot',a:aim,p:power,d:nativeDeg});")
edit(' strike={a:aim,magnitude,', ' strike={a:aim,nativeDeg,nativePower,magnitude,')
edit("""   const c=cueBall();c.vx=Math.cos(strike.a)*strike.magnitude;
   c.vy=Math.sin(strike.a)*strike.magnitude;
   strike=null;cueRetraction=0;
   playSound('cue_strike',.84);showMessage('Balls in motion');""", """   nativeStrike(strike.nativeDeg,strike.nativePower);
   strike=null;cueRetraction=0;
   showMessage('Balls in motion');""")
edit("  if(!ownTurn()&&!shot)fire(Number(d.a),Number(d.p),true);", "  if(!ownTurn()&&!shot)fire(Number(d.a),Number(d.p),true,Number(d.d));")
# simulate(dt) = one drawn frame through the engine (used by the headless tests): advance the
# pocket-slide drawing state as render() would, then one physics pass.
edit('function simulate(dt){', '''let nativeTestClock=0;
function simulate(dt){
 if(nativeView){
  if(!shot||dt<=0)return;
  if(strike){advanceStrike(dt);return;}
  for(const b of game.balls)if(b.k)NativeEngine.drawBall(b.k);
  nativeTestClock+=dt*1000;nativeFrame(nativeTestClock);return;
 }''')
# Pocketing: engine animates the slide (k7.q path, drawn by k7.h); v23 keeps its rule bookkeeping.
edit(' pocketFX.push({x:b.x,y:b.y,color:b.color,id:b.id,t:performance.now(),', ' if(!nativePocketing)pocketFX.push({x:b.x,y:b.y,color:b.color,id:b.id,t:performance.now(),')
edit('function drawBalls(){\n for(const b of game.balls){', 'function drawBalls(){\n if(nativeView){nativeDrawBalls();return;}\n for(const b of game.balls){')
# Network: never serialise engine links; relink after import.
edit(" $('ballSet').value=game.mode;updateRuleHud();\n}", " $('ballSet').value=game.mode;nativeRelink();updateRuleHud();\n}")
# Table artwork sized from the original geometry of the selected pocket size.
edit(""" if(wood?.complete&&wood.naturalWidth&&blue?.complete&&blue.naturalWidth){
  const thickness=77,trim=9,topWidth=478;
  // Top & bottom horizontal rail segments: teal rubber on the inside edge.
  ctx.drawImage(wood,111,0,topWidth,thickness-trim);
  ctx.drawImage(blue,111,thickness-trim,topWidth,trim);
  ctx.drawImage(wood,111,H-(thickness-trim),topWidth,thickness-trim);
  ctx.drawImage(blue,111,H-thickness,topWidth,trim);
  // Side rails: wood grain rotates with the long edge; teal strip faces felt.
  for(const [from,to] of [[122,641],[759,1278]]){""", """ const LT=nativeTableLayout();
 if(wood?.complete&&wood.naturalWidth&&blue?.complete&&blue.naturalWidth){
  const thickness=LT.thickness,trim=9,topWidth=W-2*LT.railFrom;
  // Top & bottom horizontal rail segments: teal rubber on the inside edge.
  ctx.drawImage(wood,LT.railFrom,0,topWidth,thickness-trim);
  ctx.drawImage(blue,LT.railFrom,thickness-trim,topWidth,trim);
  ctx.drawImage(wood,LT.railFrom,H-(thickness-trim),topWidth,thickness-trim);
  ctx.drawImage(blue,LT.railFrom,H-thickness,topWidth,trim);
  // Side rails: wood grain rotates with the long edge; teal strip faces felt.
  const sideFrom=LT.railFrom+11*LT.thickness/77,sideTo=700-LT.middleAcross/2+2;
  for(const [from,to] of [[sideFrom,sideTo],[H-sideTo,H-sideFrom]]){""")
edit("""  const sz=134;
  ctx.drawImage(pc,0,0,sz,sz);""", """  const sz=LT.corner;
  ctx.drawImage(pc,0,0,sz,sz);""")
edit("""  const across=122,depth=80;""", """  const across=LT.middleAcross,depth=LT.middleDepth;""")
# Original defaults: game_speed 1; Small pocket is t40.Q[0] = -18 for this version.
edit("friction:2,difficulty:'normal'", "friction:1,difficulty:'normal'")
edit('<input id="friction" type="range" min="0" max="8" value="2"><output id="frictionValue">Original setting 2</output>',
     '<input id="friction" type="range" min="0" max="8" value="1"><output id="frictionValue">Original setting 1</output>')
edit('<option value="10">Small</option>', '<option value="-18">Small</option>')
start = s.index('<title>'); end = s.index('</title>', start)
s = s[:start] + s[start:end].replace('v23', 'v24') + s[end:]
edit('Billiards browser port · v23</footer>', 'Billiards browser port · v24</footer>')
Path(sys.argv[2]).write_text(s)
print('wrote', sys.argv[2], len(s), 'bytes')
