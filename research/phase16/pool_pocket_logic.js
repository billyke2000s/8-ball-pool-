// Independent translation of the native target-filter and event-time suit logic
// documented in phase 16. No APK bytecode/assets included. Not a full game.
'use strict';
function eligibleIds({mode,balls,groups,player=0,strikerId=0}){
  const active=balls.filter(b=>b.active&&b.id!==strikerId);
  if(mode!=='blackball')return active.map(b=>b.id);
  const group=groups[player];
  const own=group==='a'?'red':group==='b'?'yellow':null;
  if(own&&!active.some(b=>b.color===own))
    return active.filter(b=>b.color==='black').map(b=>b.id);
  return active.filter(b=>b.color!=='white'&&b.color!=='black'&&
    (!group||(group==='a'?b.color==='red':b.color==='yellow'))).map(b=>b.id);
}
function colourPocket({color,groups,player=0,firstBreak=false,suitOnFirstStrike=false}){
  const next=groups.slice();
  const newGroup=color==='red'?'a':color==='yellow'?'b':null;
  if(!newGroup)return {groups:next,firstAssigned:false,foul:false};
  const selected=next[player];
  if(!selected&&(!firstBreak||suitOnFirstStrike)){
    next[player]=newGroup;next[1-player]=newGroup==='a'?'b':'a';
    return {groups:next,firstAssigned:true,foul:false};
  }
  return {groups:next,firstAssigned:false,foul:!!selected&&selected!==newGroup};
}
module.exports={eligibleIds,colourPocket};
