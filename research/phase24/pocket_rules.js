'use strict';
// k7.q(): t==null -> wh.m(true); no scoring callback is reached.
// wh.l(): d0.z==false -> wh.m(true). Neither method requires a cushion hit.
function nativeShotFoul(firstContact,eventFoul){
 return firstContact===null||Boolean(eventFoul);
}
function nativePyramidCredits(shot){
 const ids=Array.isArray(shot.nativePotted)?shot.nativePotted:shot.potted;
 const striker=shot.strikerId??0;
 return {objects:ids.filter(id=>id!==striker).length,striker:ids.includes(striker)?1:0};
}
module.exports={nativeShotFoul,nativePyramidCredits};
