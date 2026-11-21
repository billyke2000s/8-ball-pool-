// Pure source-guided translations, without original APK binaries or assets.
// Input objects must map native fields to browser state.
'use strict';
function pyramidGameOver(state) {
  const competitive=state.playerMode!=='solo';
  const eight=competitive&&state.scores.some(x=>x>=8);
  if(state.mode==='combo') {
    const remaining=state.balls.filter(b=>b.active&&b.id!==state.strikerId).length;
    return eight||remaining===0||(remaining===1&&!!state.selectingRemoval);
  }
  if(state.mode==='free'){
    const remaining=state.balls.filter(b=>b.active||b.nativeHitLinked).length;
    return eight||remaining<=1;
  }
  return false;
}
function soloVictoryScore({elapsedMs,shots,fouls,friction,pool,restricted=false}) {
  const seconds=Math.max(.001,elapsedMs/1000);
  const speed=Math.pow(2,friction-1);
  let score=Math.pow(seconds,-.8)*40000;
  if(speed>0)score/=speed;
  score-=shots*.1;
  score-=fouls;
  if(pool)score*=10;
  if(!restricted&&speed<=2)score*=2;
  return Math.max(7,Math.trunc(score));
}
module.exports={pyramidGameOver,soloVictoryScore};
