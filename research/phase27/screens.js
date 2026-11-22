// Phase 27 — native navigation flow, translated from the recovered app:
//  zb.d()  dlg_choose_game_type "Select Game Type": 1 Player / Human vs Computer / 2 Players
//          (lb 0/1/2 -> vh.SINGLE / vh.PvC / vh.PvP). GameActivity starts with vh.UNKNOWN and
//          onResume shows this chooser while the mode is UNKNOWN.
//  zb.c()  same layout titled "Select Difficulty": Easy / Normal / Hard (lb 6/7/8), PvC only.
//  dlg_quit_game "Quit this game?" Yes (lb 10 -> GameActivity.w) / No (lb 9 -> z, resume) /
//          Restart (xb 0 -> y, new game). w(): PvC -> difficulty chooser, otherwise game-type chooser.
//  nn back handler: with a zb dialog showing, back acts by dialog id (zb.a):
//          5 quit -> w(); 1 game type -> leave app; 2 difficulty -> game-type chooser;
//          4 preferences -> close; 3 result -> restart. With no dialog and mode != UNKNOWN -> quit dialog.
//  oh/xb 1: the game-result OK button restarts the game (y()), it does not merely close.
const NATIVE_MODE_TO_PLAYERS={single:'solo',pvc:'cpu',pvp:'local'};
let nativeMode='unknown';
function hideNavigationModals(){
 $('chooserModal').hidden=true;$('quitModal').hidden=true;
}
function showGameTypeChooser(){
 // zb.d(): mode becomes UNKNOWN; nothing on the table may run underneath.
 clearTimeout(cpuTimeout);clearTimeout(resultDialogTimer);resultDialogTimer=0;
 if(game)game.resultPresented=true;
 nativeMode='unknown';closeStrikerChoice();closeAppModal();setMenu(false);appModal='gameType';
 $('chooserTitle').textContent='Select Game Type';
 $('chooseMode1').textContent='1 Player';$('chooseMode2').textContent='Human vs Computer';$('chooseMode3').textContent='2 Players';
 $('chooserModal').hidden=false;$('chooseMode1').focus();
}
function showDifficultyChooser(){
 clearTimeout(cpuTimeout);closeStrikerChoice();closeAppModal();setMenu(false);appModal='difficulty';
 $('chooserTitle').textContent='Select Difficulty';
 $('chooseMode1').textContent='Easy';$('chooseMode2').textContent='Normal';$('chooseMode3').textContent='Hard';
 $('chooserModal').hidden=false;$('chooseMode1').focus();
}
function startNativeMode(mode,difficulty){
 nativeMode=mode;$('players').value=NATIVE_MODE_TO_PLAYERS[mode];
 if(difficulty)$('difficulty').value=difficulty;
 closeAppModal();restart();savePreferences();
}
function chooseNative(index){
 if(appModal==='gameType'){
  if(index===1)startNativeMode('single');
  else if(index===2){nativeMode='pvc';showDifficultyChooser();}
  else startNativeMode('pvp');
 }else if(appModal==='difficulty')startNativeMode('pvc',['easy','normal','hard'][index-1]);
}
function showQuitDialog(){
 if(nativeMode==='unknown')return false;
 closeStrikerChoice();closeAppModal();setMenu(false);appModal='quit';
 $('quitModal').hidden=false;$('quitNo').focus();
 return true;
}
function quitYes(){
 // GameActivity.w(): leave the current game; a network game is disconnected first.
 if(role!=='local'&&typeof closeNet==='function')closeNet();
 if(nativeMode==='pvc')showDifficultyChooser();else showGameTypeChooser();
}
function quitRestart(){closeAppModal();restart(true);}
function resultOk(){closeAppModal();restart();}
// Android back. Returns true when handled.
function nativeBack(){
 if(appModal==='quit'){quitYes();return true;}
 if(appModal==='gameType')return false; // native leaves the app; a page cannot close itself
 if(appModal==='difficulty'){showGameTypeChooser();return true;}
 if(appModal==='result'){resultOk();return true;}
 if(appModal){closeAppModal();return true;}
 if(pendingStrikerChoice){closeStrikerChoice();return true;}
 if(!$('screenOverlay').hidden){setMenu(false);return true;}
 return showQuitDialog();
}
// Browser/phone back gesture -> nativeBack, via one history guard entry.
function armBackGuard(){try{history.pushState({billiardBack:true},'');}catch(_error){}}
window.addEventListener('popstate',()=>{if(nativeBack())armBackGuard();});
