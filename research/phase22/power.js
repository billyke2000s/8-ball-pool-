'use strict';
// ko.j in the vertical control: b=clamp(y-c,0,q); J=b/q.
// tap-to-shoot sets c=j (control top); drag-to-shoot sets c=touch-down Y.
function nativePowerRatio(y,downY,top,travel,tapToShoot){
 return Math.min(1,Math.max(0,(y-(tapToShoot?top:downY))/travel));
}
// Original ko.N palette, in order from low to high strength.
const POWER_COLORS=[[30,150,255],[45,200,254],[55,223,254],[45,246,239],
 [34,243,197],[44,242,161],[45,237,59],[72,244,51],[99,232,58],
 [129,243,35],[142,244,44],[188,243,32],[232,251,28],[247,197,51],[250,149,51],
 [255,132,31],[255,114,20],[255,88,28],[255,30,30]];
// ko constructor uses (1/3)-height gaps for the modern vertical control.
function nativePowerSegments(travel,ratio){
 const segment=travel/((POWER_COLORS.length-1)/3+POWER_COLORS.length);
 const height=Math.round(segment),gap=Math.round(segment/3);
 return {height,gap,count:Math.min(POWER_COLORS.length,Math.ceil(travel*ratio/(height+gap)))};
}
module.exports={nativePowerRatio,nativePowerSegments,POWER_COLORS};
