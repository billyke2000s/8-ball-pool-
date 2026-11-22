from pathlib import Path
import sys
if len(sys.argv)!=3:raise SystemExit('Usage: apply_to_v20.py INPUT.html OUTPUT.html')
s=Path(sys.argv[1]).read_text()
def edit(old,new):
 global s
 if s.count(old)!=1:raise SystemExit('Missing/ambiguous target: '+old[:90])
 s=s.replace(old,new,1)
edit("const bankBonus=trick?(game.mode==='eight'?1:0):2;", "const bankBonus=trick?(game.mode==='combo'?1:0):2;")
edit('const nearCue=target.id===cue.id?2:nativeVectorQuality(target.x-cue.x,target.y-cue.y);', '''// lr.n/o/p refer to the original striker before jo.f considers replacements.
 const original=cueBall();
 const nearCue=cue.id===original.id?2:nativeVectorQuality(cue.x-original.x,cue.y-original.y);''')
edit("const n=source.weight??(computer?({easy:3,normal:4,hard:5}[settings.difficulty]||4):6);", "const n=source.weight??(computer?(game.mode==='blackball'?5:({easy:3,normal:4,hard:5}[settings.difficulty]||4)):6);")
start=s.index(" if(game.mode==='eight'&&game.groups[game.turn]&&source.groupImbalance!==false){")
end=s.index(' if(computer&&inverseAccuracy)',start)
s=s[:start]+''' // lr.w is ho.c(): the imbalance term applies only while Pool is open.
 if(game.mode==='blackball'&&!game.groups[game.turn]&&source.groupImbalance!==false){
  const redPots=game.balls.filter(b=>!b.active&&b.color==='red').length;
  const yellowPots=game.balls.filter(b=>!b.active&&b.color==='yellow').length;
  if(redPots!==yellowPots)groupBonus=target.color==='red'?(redPots-yellowPots)*2:
    target.color==='yellow'?(yellowPots-redPots)*2:-100;
 }
''' +s[end:]
edit('function generateAlternateCpuCandidates(cue,targets){', 'function generateAlternateCpuCandidates(cue,targets,inverseAccuracy=false){\n if(game.mode===\'blackball\')return [];')
s=s.replace('new Set([game.strikerId,target.id])','new Set([cue.id,target.id])')
s=s.replace('new Set([target.id,game.strikerId])','new Set([target.id,cue.id])')
edit('candidate.score=nativeAiScore(candidate,cue,target,{})-12;', 'candidate.score=nativeAiScore(candidate,cue,target,{inverseAccuracy});')
edit('function generateCpuCandidates(){\n const cue=cueBall();\n const objectBalls=game.balls.filter(b=>findTarget(b));', '''function generateCpuCandidatesForStriker(cue,inverseAccuracy){
 const objectBalls=game.mode==='free'&&game.freeBall?
   game.balls.filter(b=>b.active&&b.id!==cue.id):game.balls.filter(b=>findTarget(b));''')
edit(" const inverseAccuracy=game.playerMode==='cpu'&&Math.random()>.5;", ' // inverseAccuracy is selected once for the whole native jo calculation.')
edit('if(candidates.length===0)candidates.push(...generateAlternateCpuCandidates(cue,targets));', "if(game.mode!=='blackball')candidates.push(...generateAlternateCpuCandidates(cue,targets,inverseAccuracy));")
edit('function selectCpuCandidate(candidates,', '''function generateCpuCandidates(){
 const inverseAccuracy=game.playerMode==='cpu'&&Math.random()>.5;
 // jo.c/f: wh.j0 enables considering every eligible Free Pyramid striker.
 const strikers=game.mode==='free'&&game.freeBall?
   game.balls.filter(b=>b.active):[cueBall()];
 const candidates=[];
 for(const striker of strikers)
  for(const candidate of generateCpuCandidatesForStriker(striker,inverseAccuracy))
   candidates.push({...candidate,strikerId:striker.id});
 return candidates.sort((a,b)=>b.score-a.score);
}
function selectCpuCandidate(candidates,''')
edit('if(chosen){game.cpuShots++;fire(chosen.angle,chosen.power,true);return;}', '''if(chosen){
  // x2.c rebinds ha.f(lr.d) before animating the chosen CPU stroke.
  if(chosen.strikerId!==game.strikerId&&!chooseFreeStriker(chosen.strikerId))return;
  game.cpuShots++;fire(chosen.angle,chosen.power,true);return;
 }''')
s=s.replace(" // Use it when no ordinary direct pocket candidate survives obstruction.", " // Native jo.f includes these alongside ordinary candidates in Pyramid.")
s=s.replace(" // path check. These get a modest scoring penalty to avoid selecting them\n // ahead of unambiguous original direct-shot candidates.", " // path check. Use the recovered lr score without an invented penalty.")
Path(sys.argv[2]).write_text(s)
