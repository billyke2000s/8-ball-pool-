from pathlib import Path
import sys
if len(sys.argv)!=3: raise SystemExit('Usage: apply_to_v19.py INPUT.html OUTPUT.html')
s=Path(sys.argv[1]).read_text()
def edit(old,new):
 global s
 if s.count(old)!=1: raise SystemExit('Missing/ambiguous target: '+old[:70])
 s=s.replace(old,new,1)
module=Path(__file__).with_name('pocket_rules.js').read_text()
module=module[module.index('// k7.q'):module.index('module.exports')]
edit('function pocket(b,pk){',module+'function pocket(b,pk){')
edit('shot={first:null,potted:[],scratched:false,', 'shot={first:null,potted:[],nativePotted:[],scratched:false,')
edit("if(shot&&game.mode==='blackball'){", """// A pot without any original k7.t contact reference is a foul, not a point.
 const linked=Boolean(b.nativeHitLinked);
 if(shot){
  if(!linked)shot.eventFoul=true;
  else shot.nativePotted.push(b.id);
  if(game.mode==='blackball'&&b.id===8&&!linked)shot.unlinkedBlack=true;
 }
 if(shot&&game.mode==='blackball'&&linked){""")
edit('game.pyramidBalls[shooter]+=objectPots.length;\n if(strikerPotted)game.pyramidStrikerPots[shooter]++;', 'const credits=nativePyramidCredits(s);\n game.pyramidBalls[shooter]+=credits.objects;\n game.pyramidStrikerPots[shooter]+=credits.striker;')
edit('const foul=s.first===null||(!s.cushion&&made===0);', 'const foul=nativeShotFoul(s.first,s.eventFoul);')
edit("if(game.mode==='combo'&&game.balls.some(b=>b.active&&b.id!==strikerId))", "if(game.mode==='combo'&&credits.striker&&game.balls.some(b=>b.active&&b.id!==strikerId))")
edit('else if(foul||!made)game.turn=other;', 'else if(foul||!(credits.objects+credits.striker))game.turn=other;')
edit('let black=s.potted.includes(8);', "let black=s.potted.includes(8);\n if(black&&s.unlinkedBlack){respotBlackBall();black=false;}")
edit('if(s.first!==null&&!s.cushion&&!objects.length&&!black)foul=true;', '// wh.l() has no generic no-cushion/no-pot foul rule.')
edit("ctx.save();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([]);", "ctx.save();ctx.strokeStyle='#ffff00';ctx.lineWidth=2;ctx.setLineDash([]);")
edit("eventFoul:false,firstSuitPotted:null,colorPocketOrder:[]};", "eventFoul:false,groupAtStart:game.groups[game.turn],firstSuitPotted:null,colorPocketOrder:[]};")
edit("if(group){\n  // First-contact legality", "const firstContactGroup=Object.prototype.hasOwnProperty.call(s,'groupAtStart')?s.groupAtStart:group;\n if(firstContactGroup){\n  // First-contact legality")
edit("const ownColor=group==='a'?'red':'yellow';", "const ownColor=firstContactGroup==='a'?'red':'yellow';")
edit("if(hasOwn && groupOf(first)!==group)foul=true;", "if(hasOwn && groupOf(first)!==firstContactGroup)foul=true;")
edit("}else if(first&&first.id===8&&!game.firstBreak)foul=true;", "}else if(first&&first.id===8)foul=true;")
start=s.index(" if(game.firstBreak&&s.first!==null){")
end=s.index(" if(!group&&",start)
s=s[:start]+" // Native first-contact fouls are not cleared by the break flag.\n"+s[end:]
Path(sys.argv[2]).write_text(s)
