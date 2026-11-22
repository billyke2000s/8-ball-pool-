// Browser translations of dlg_records and dlg_game_won screen content.
function closeAppModal(){
 appModal=null;$('recordsModal').hidden=true;$('resultModal').hidden=true;
}
function showRecords(){
 closeStrikerChoice();closeAppModal();appModal='records';
 for(const level of ['easy','normal','hard']){
  const record=readCpuHistory(level);
  $('record_'+level+'_played').textContent=String(record.played);
  $('record_'+level+'_won').textContent=String(record.won);
 }
 $('recordsModal').hidden=false;$('closeRecords').focus();
}
function maybeShowResult(){
 if(!game.finished||game.resultPresented||resultDialogTimer)return;
 const completed=game;
 resultDialogTimer=setTimeout(()=>{
  resultDialogTimer=0;if(game!==completed||!game.finished)return;
  game.resultPresented=true;closeStrikerChoice();closeAppModal();appModal='result';
  $('resultTitle').textContent=game.playerMode==='solo'?
    (game.soloResult==='win'?'Well done!':'Game over'):
    game.winner===null?'Game drawn!':game.playerMode==='cpu'?
      (game.winner===0?'You won!':'Computer won!'):'Player '+(game.winner+1)+' won!';
  const seconds=Math.max(0,Math.floor((game.soloDurationMs||Date.now()-game.startedAt)/1000));
  const duration=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
  const lines=['Time: '+duration,'Shots: '+game.played];
  if(game.playerMode==='solo'){
   lines.push('Fouls: '+(game.soloFouls||0));
   if(game.soloScore!==null)lines.push('Score: '+game.soloScore);
  }else if(game.mode!=='blackball')lines.push('Score: '+game.scores[0]+' : '+game.scores[1]);
  $('resultStats').textContent=lines.join('\n');
  $('resultModal').hidden=false;$('closeResult').focus();
 },350);
}
