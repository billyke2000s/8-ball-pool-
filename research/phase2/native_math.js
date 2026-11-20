// Pure mathematical translations of selected original Billiard.apk methods.
// Does NOT include original graphics, Dalvik bytecode, or a complete game engine.
'use strict';
function gameSpeedConfig(setting) {
  return { velocityMultiplier: Math.pow(2,setting-1),
    rollingDecay: Math.pow(.995-.001*setting,1.75) };
}
function rackGeometry(diameter,width,height) {
  const pitch=diameter+Math.min(width,height)/480;
  return {pitch,xStep:pitch*Math.sin(Math.PI/6),yStep:pitch*Math.cos(Math.PI/6)};
}
function nativeCueVelocity(powerFraction,speedSetting,width,height) {
  return Math.pow(powerFraction,1.12)*gameSpeedConfig(speedSetting).velocityMultiplier*
    400*Math.min(width,height)/480;
}
function nativeMoveInterval(frameMilliseconds) {
  return frameMilliseconds*.006375;
}
function eventRoots(a,b,c) {
  if(a<=0?(b<=0||c>=0):(b>=0||c<=0))return null;
  const d=b*b-4*a*c;if(d<0)return null;
  return [(-b+Math.sqrt(d))/(2*a),(-b-Math.sqrt(d))/(2*a)];
}
function nativeBallCollision(first,second) {
  const dx=second.x-first.x,dy=second.y-first.y,dist=dx*dx+dy*dy;
  if(!dist)return null;
  const s=((second.vx-first.vx)*dx+(second.vy-first.vy)*dy)/dist;
  return {first:{vx:(first.vx+dx*s)*.99,vy:(first.vy+dy*s)*.99},
    second:{vx:(second.vx-dx*s)*.99,vy:(second.vy-dy*s)*.99}};
}
function nativeStopVelocitySq(width,height) {
  return Math.pow(3*Math.min(width,height)/480,2)*.3;
}
module.exports={gameSpeedConfig,rackGeometry,nativeCueVelocity,nativeMoveInterval,eventRoots,nativeBallCollision,nativeStopVelocitySq};
