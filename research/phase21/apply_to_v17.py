from pathlib import Path
import sys
if len(sys.argv)!=3:
    raise SystemExit('Usage: python3 apply_to_v17.py INPUT_V17.html OUTPUT_V18.html')
src=Path(sys.argv[1]).read_text()
if 'function nearestEligibleBall(' in src:
    raise SystemExit('Input already includes the selection patch')
module=Path(__file__).with_name('selection.js').read_text()
helper=module[module.index('// wh.e'):module.index('module.exports')]
src=src.replace('function nearestPocket(p){',helper+'\nfunction nearestPocket(p){',1)
src=src.replace("const available=game.balls.filter(b=>b.active&&b.id!==game.strikerId);\n  const found=available.find(b=>hypot(b.x-p.x,b.y-p.y)<BALL_R*2.3);", "// wh.n(): e(x,y,2*mt.H,false). Map mt.H to browser felt width.\n  const found=nearestEligibleBall(game.balls,p.x,p.y,\n    2*(FIELD.right-FIELD.left),game.strikerId);",1)
src=src.replace("if(game.mode!=='combo'||!game.selectingRemoval||game.removingBallId!==null||", "if(game.finished||game.mode!=='combo'||!game.selectingRemoval||game.removingBallId!==null||",1)
src=src.replace("game.removingBallId=id;\n showMessage", "game.removingBallId=id;\n // wh.u() stores K0 once, before its 1200 ms delay.\n const selectedPocket=nearestPocket(b);\n game.removalPocketIndex=POCKETS.indexOf(selectedPocket);\n showMessage",1)
src=src.replace("pocket(b,nearestPocket(b)); // no shot:", "pocket(b,selectedPocket); // no shot:",1)
src=src.replace('game.removingBallId=null;game.selectingRemoval=false;', 'game.removingBallId=null;game.removalPocketIndex=null;game.selectingRemoval=false;',1)
src=src.replace('strikerId:0,selectingRemoval:false,removingBallId:null,', 'strikerId:0,selectingRemoval:false,removingBallId:null,removalPocketIndex:null,',1)
src=src.replace('function render(){', '''// wh.u()/onDraw: preview the stored J0-to-K0 removal path.
function drawRemovalGuide(){
 if(game.removingBallId===null||game.removingBallId===undefined)return;
 const selected=game.balls.find(b=>b.id===game.removingBallId);
 const target=POCKETS[game.removalPocketIndex];
 if(!selected||!selected.active||!target)return;
 ctx.save();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([]);
 ctx.beginPath();ctx.moveTo(selected.x,selected.y);ctx.lineTo(target.x,target.y);
 ctx.stroke();ctx.restore();
}
function render(){''',1)
src=src.replace('drawOriginalTable();drawBalls();drawHandHint();drawAim();','drawOriginalTable();drawBalls();drawHandHint();drawAim();drawRemovalGuide();',1)
src=src.replace('selectingRemoval:game.selectingRemoval,removingBallId:game.removingBallId,','selectingRemoval:game.selectingRemoval,removingBallId:game.removingBallId,removalPocketIndex:game.removalPocketIndex,',1)
Path(sys.argv[2]).write_text(src)
