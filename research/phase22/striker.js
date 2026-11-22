'use strict';
// wh.n ACTION_UP, after a down candidate has been captured.
// x00.w maps to CSS-pixel units in the browser adapter.
function strikerTapResult({elapsedMs,dx,dy,unit,candidateId,releaseId,tapToAim}) {
 if(candidateId===null||candidateId===undefined||candidateId!==releaseId||
    elapsedMs<0||elapsedMs>=1000||dx*dx+dy*dy>=(7*unit)**2)return 'none';
 return tapToAim&&elapsedMs<200?'choose-or-aim':'choose';
}
module.exports={strikerTapResult};
