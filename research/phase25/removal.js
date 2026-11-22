'use strict';
// kp.<init>, including the duplicate endpoint filter checked in kp.smali.
function nativeRemovalScore(ball,shots,balls,pockets,diameter,diagonalSquared){
 const targeted=shots.filter(s=>s.targetId===ball.id);
 const retained=targeted.filter(s=>s.outer||!targeted.some(other=>
  other.outer&&other.pocketIndex===s.pocketIndex&&Boolean(other.bank)===Boolean(s.bank)));
 const wrap=d=>((d+180)%360+360)%360-180;
 let pocketQuality=0;
 for(const p of pockets){
  if(!p.outer)continue;
  const dx=p.x-ball.x,dy=p.y-ball.y;
  const quality=1-Math.abs(wrap(p.angle-Math.atan2(dy,dx)*180/Math.PI))/90;
  pocketQuality+=Math.pow(quality,4)*Math.pow(1-(dx*dx+dy*dy)/diagonalSquared,4);
 }
 let crowding=0;
 for(const other of balls){
  if(!other.active||other.id===ball.id)continue;
  const dx=ball.x-other.x,dy=ball.y-other.y;
  crowding+=diameter*diameter/(dx*dx+dy*dy);
 }
 const shotQuality=retained.length?retained.reduce((sum,s)=>sum+Math.max(0,s.score),0):-1000;
 return -shotQuality+crowding*10+(1-pocketQuality*.4)*10-retained.length*10;
}
function selectRemovalBall(balls,strikerId,shots,pockets,diameter,diagonalSquared){
 let chosen=null,score=-Infinity;
 for(const ball of balls){
  if(!ball.active||ball.id===strikerId)continue;
  const value=nativeRemovalScore(ball,shots,balls,pockets,diameter,diagonalSquared);
  if(chosen===null||value>score){chosen=ball;score=value;}
 }
 return chosen;
}
module.exports={nativeRemovalScore,selectRemovalBall};
