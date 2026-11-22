'use strict';
// Execute the actual standalone HTML scripts, with drawing/DOM/time mocked.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.argv[2],'utf8'),nodes={},timers=new Map();let timerId=0,endpoint=null;const savedRecords=new Map();
const context2d=new Proxy({lineTo:(x,y)=>endpoint=[x,y],measureText:()=>({width:20})},{get:(o,k)=>k in o?o[k]:()=>{}});
function node(id){return nodes[id]||(nodes[id]={value:({ballSet:'blackball',players:'local',friction:'2',pocketSize:'20',difficulty:'normal',pyramidPenalty:'0'})[id]||'',checked:false,hidden:true,textContent:'',style:{},tagName:'DIV',addEventListener(name,fn){this[name]=fn},setAttribute(){},focus(){},getContext:()=>context2d,getBoundingClientRect:()=>({left:0,top:0,width:700,height:1400}),setPointerCapture(){}})}
const sandbox={console,Math:Object.assign(Object.create(Math),{random:()=>0}),Date,JSON,Promise,Set,Map,Number,Boolean,String,Array,Object,Infinity,
 document:{getElementById:node,querySelector:()=>node('table'),activeElement:null,hidden:false,addEventListener(){}},history:{pushState(){}},
 Image:class{constructor(){this.complete=true;this.naturalWidth=96}},Audio:class{},
 localStorage:{getItem:key=>savedRecords.get(key)||null,setItem:(key,value)=>savedRecords.set(key,value)},performance:{time:0,now(){return this.time}},
 setTimeout(fn){timers.set(++timerId,fn);return timerId},clearTimeout(id){timers.delete(id)},requestAnimationFrame(){},addEventListener(){},navigator:{}};
sandbox.window=sandbox;vm.createContext(sandbox);
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
scripts[1]=scripts[1].replace('restart();requestAnimationFrame(frame);',`restart();window.t={get game(){return game},restart,resolvePyramidRemoval,drawRemovalGuide,get shot(){return shot},fire,simulate,pocket,finishShot,nativeAiScore,showRecords,closeAppModal,maybeShowResult,recordCpuHistory,readCpuHistory,currentCpuContext,selectRemovalBall,sourceCandidatePocketPoints,POCKETS,DIAM,NATIVE_SCORE_DIAG_SQ,generateCpuCandidates,generateCpuCandidatesForStriker,selectCpuCandidate,cpuShoot,get power(){return power},choosePower,chooseFreeStriker,finishPyramidShot,settings,canAim};requestAnimationFrame(frame);`);
for(const script of scripts)vm.runInContext(script,sandbox);
const t=sandbox.t;
function setup(){node('ballSet').value='combo';t.restart();t.game.sound=false;t.game.selectingRemoval=true;timers.clear()}
setup();node('table').pointerdown({pointerId:1,clientX:350,clientY:700,preventDefault(){}});
const selected=t.game.removingBallId;assert.notEqual(selected,null);assert.notEqual(selected,0);
assert.equal(t.resolvePyramidRemoval(2),false);
t.drawRemovalGuide();assert.ok(endpoint&&endpoint.every(Number.isFinite));
for(const fn of [...timers.values()])fn();timers.clear();
assert.equal(t.game.balls.find(b=>b.id===selected).active,false);assert.equal(t.game.removalPocketIndex,null);
setup();t.resolvePyramidRemoval(2);t.restart();assert.equal(t.game.balls.filter(b=>b.active).length,16);
assert.equal(timers.size,0); // restart cancelled the pending removal timer.
setup();t.game.finished=true;assert.equal(t.resolvePyramidRemoval(2),false);

function freeSetup(unlocked=true){
 node('ballSet').value='free';t.restart();t.game.sound=false;t.game.freeBall=unlocked;
 t.settings.tapToAim=false;t.settings.tapToShoot=false;
 t.game.balls.forEach(b=>{b.vx=b.vy=0});
 t.game.balls.find(b=>b.id===1).x=200;t.game.balls.find(b=>b.id===1).y=600;
 t.game.balls.find(b=>b.id===2).x=500;t.game.balls.find(b=>b.id===2).y=600;
}
function down(x=200,y=600){sandbox.performance.time=0;node('table').pointerdown({pointerId:7,clientX:x,clientY:y,preventDefault(){}})}
function up(ms=100,x=200,y=600){sandbox.performance.time=ms;node('table').pointerup({pointerId:7,clientX:x,clientY:y})}
freeSetup(false);down();up();assert.equal(t.game.strikerId,0,'opening selection locked');
freeSetup();down();up();assert.equal(t.game.strikerId,1,'tap switches striker');assert.equal(t.game.balls[0].active,true);
assert.equal(t.game.balls[1].x,200,'selection preserves position');
freeSetup();down();up(1000);assert.equal(t.game.strikerId,0,'long press rejected');
freeSetup();down();up(100,208);assert.equal(t.game.strikerId,0,'movement rejected');
freeSetup();t.settings.tapToAim=true;down();up();assert.equal(node('strikerChoice').hidden,false);assert.equal(t.game.strikerId,0);
assert.equal(t.canAim(),false,'dialog blocks shooting');node('chooseStriker').onclick();assert.equal(t.game.strikerId,1);assert.equal(node('strikerChoice').hidden,true);
freeSetup();t.settings.tapToAim=true;down();up();node('aimAtStriker').onclick();assert.equal(t.game.strikerId,0,'aim option retains striker');
freeSetup();t.settings.tapToAim=true;down();up();t.restart();assert.equal(node('strikerChoice').hidden,true,'restart dismisses stale selection');
freeSetup();t.game.finished=true;assert.equal(t.chooseFreeStriker(1),false);
freeSetup();t.game.balls[1].active=false;assert.equal(t.chooseFreeStriker(1),false);
freeSetup(false);t.finishPyramidShot({first:2,strikerId:0,potted:[],cushion:true});assert.equal(t.game.freeBall,true,'contact unlocks selection');
freeSetup();t.finishPyramidShot({first:null,strikerId:0,potted:[],cushion:false});assert.equal(t.game.freeBall,false,'miss locks selection');
// Tap-to-shoot is scoped to the strength control, with absolute bar Y.
freeSetup();t.settings.tapToShoot=true;t.choosePower(50);
down(400,800);up(100,400,800);assert.equal(t.shot,null,'felt tap never fires');
freeSetup();t.settings.tapToShoot=true;down(30,995.5);
assert.equal(t.power,50,'middle of power bar reads half strength');up(100,30,995.5);
assert.ok(t.shot,'power-control tap shoots');
freeSetup();t.settings.tapToShoot=false;down(30,900);
assert.equal(t.power,0);node('table').pointermove({pointerId:7,clientX:30,clientY:1050.5,preventDefault(){}});
assert.equal(t.power,50,'drag strength uses full control travel');up(100,30,1050.5);assert.ok(t.shot);
freeSetup();assert.equal(t.fire(-Math.PI/2,1.7),false,'exact native threshold rejected');

// Recovered rule callbacks, using actual game functions rather than replicas.
freeSetup();const shooter=t.game.turn;
t.finishPyramidShot({first:2,strikerId:0,potted:[],nativePotted:[],cushion:false,eventFoul:false});
assert.equal(t.game.pyramidFouls[shooter],0,'no invented rail requirement');
freeSetup();t.game.balls[1].nativeHitLinked=false;t.fire(-Math.PI/2,30);
t.pocket(t.game.balls[1],{x:70,y:71,type:'corner'});
assert.equal(t.shot.eventFoul,true);assert.equal(t.shot.nativePotted.length,0);
t.finishShot();assert.equal(t.game.pyramidBalls[0],0,'unlinked pot earns no point');assert.equal(t.game.pyramidFouls[0],1);
node('ballSet').value='combo';t.restart();t.game.sound=false;t.fire(-Math.PI/2,30);
t.pocket(t.game.balls[0],{x:70,y:71,type:'corner'});t.finishShot();
assert.equal(t.game.selectingRemoval,false,'unlinked Combo striker does not earn removal');
function poolSetup(){node('ballSet').value='blackball';t.restart();t.game.sound=false;t.game.firstBreak=false}
poolSetup();t.fire(-Math.PI/2,30);const ps=t.shot;
const firstYellow=t.game.balls.find(b=>b.color==='yellow'),red=t.game.balls.find(b=>b.color==='red');
ps.first=firstYellow.id;red.nativeHitLinked=true;t.pocket(red,{x:70,y:71,type:'corner'});t.finishShot();
assert.equal(t.game.ballInHand,false,'open-table first contact does not become retroactively wrong after suit choice');
poolSetup();t.game.groups=['a','b'];t.fire(-Math.PI/2,30);t.shot.first=t.game.balls.find(b=>b.color==='yellow').id;t.finishShot();
assert.equal(t.game.ballInHand,true,'already assigned wrong first contact stays foul');
poolSetup();t.game.firstBreak=true;t.fire(-Math.PI/2,30);t.shot.first=8;t.finishShot();
assert.equal(t.game.ballInHand,true,'break flag does not erase first-contact black foul');
poolSetup();t.fire(-Math.PI/2,30);t.shot.first=1;t.pocket(t.game.balls.find(b=>b.id===8),{x:70,y:71,type:'corner'});t.finishShot();
assert.equal(t.game.finished,false,'unlinked black pot is respotted instead of ending match');
assert.equal(t.game.balls.find(b=>b.id===8).active,true);

freeSetup();t.game.playerMode='cpu';t.game.turn=1;t.game.firstBreak=false;
const beforeSearch=JSON.stringify(t.game.balls),oldStriker=t.game.strikerId;
const options=t.generateCpuCandidates();
assert.ok(options.length>0,'Free candidate search yields shots');
assert.ok(new Set(options.map(c=>c.strikerId)).size>1,'Free search covers multiple strikers');
assert.equal(JSON.stringify(t.game.balls),beforeSearch,'search does not mutate ball state');
assert.equal(t.game.strikerId,oldStriker,'search does not bind a striker prematurely');
assert.ok(options.every(c=>Number.isFinite(c.score)&&Number.isFinite(c.angle)&&Number.isFinite(c.power)));
assert.ok(options.every(c=>c.strikerId!==c.targetId),'striker is never its own target');
const expectedCpu=t.selectCpuCandidate(options);t.cpuShoot();
assert.equal(t.game.strikerId,expectedCpu.strikerId,'CPU binds selected striker');
assert.equal(t.shot.strikerId,expectedCpu.strikerId,'stroke uses selected striker');
freeSetup(false);assert.ok(t.generateCpuCandidates().every(c=>c.strikerId===0),'locked Free uses original striker');
poolSetup();t.game.playerMode='cpu';
const poolOptions=t.generateCpuCandidates();assert.ok(poolOptions.every(c=>c.strikerId===0&&!c.bank),'Pool has no Pyramid alternate-contact candidates');
const sample={angle:-Math.PI/2,power:50,cut:30,cueDist:100,ghostX:300,ghostY:500,pocketX:70,pocketY:71,pocketAngle:-90,outer:false};
const cue=t.game.balls[0],redTarget={id:90,x:300,y:450,color:'red'},yellowTarget={...redTarget,id:91,color:'yellow'};
t.settings.difficulty='easy';const easyScore=t.nativeAiScore(sample,cue,redTarget);
t.settings.difficulty='hard';assert.equal(t.nativeAiScore(sample,cue,redTarget),easyScore,'Pool always uses native weight five');
t.game.balls.find(b=>b.color==='red').active=false;
assert.ok(Math.abs((t.nativeAiScore(sample,cue,redTarget)-t.nativeAiScore(sample,cue,yellowTarget))-4)<1e-10,'open Pool uses potted-colour imbalance');
t.game.groups=['a','b'];assert.equal(t.nativeAiScore(sample,cue,redTarget),t.nativeAiScore(sample,cue,yellowTarget),'assigned Pool removes imbalance term');
node('ballSet').value='combo';node('players').value='cpu';t.restart();t.game.sound=false;t.game.turn=1;t.game.firstBreak=false;t.game.selectingRemoval=true;
const removalOptions=t.generateCpuCandidates(),endpoints=t.POCKETS.flatMap(p=>t.sourceCandidatePocketPoints(p));
const removal=t.selectRemovalBall(t.game.balls,t.game.strikerId,removalOptions,endpoints,t.DIAM,t.NATIVE_SCORE_DIAG_SQ);
t.cpuShoot();assert.equal(t.game.removingBallId,removal.id,'Combo CPU removal follows native rank');
savedRecords.clear();t.settings.difficulty='hard';savedRecords.set('billiard_cpu_record_v5_hard',JSON.stringify({played:5,won:2}));
assert.equal(t.readCpuHistory('hard').won,3,'legacy CPU wins converted to human results');
t.game.playerMode='cpu';t.game.finished=true;t.game.historyRecorded=false;t.game.winner=0;t.recordCpuHistory();
assert.equal(t.readCpuHistory('hard').played,6);assert.equal(t.readCpuHistory('hard').won,4,'human win counted');
t.recordCpuHistory();assert.equal(t.readCpuHistory('hard').played,6,'history recorded once');
t.game.historyRecorded=false;t.game.winner=1;t.recordCpuHistory();assert.equal(t.readCpuHistory('hard').won,4,'CPU win does not increase native win count');
t.game.historyRecorded=false;t.game.winner=null;t.recordCpuHistory();assert.equal(t.readCpuHistory('hard').won,5,'native result N counts competitive draw');
t.game.mode='free';t.game.scores=[5,2];assert.equal(t.currentCpuContext().cpuScore,2);assert.equal(t.currentCpuContext().opponentScore,5,'Pyramid score feeds adaptive skill');
// Source-derived screens and preference flow.
t.showRecords();assert.equal(node('recordsModal').hidden,false);assert.equal(t.canAim(),false);
assert.equal(node('record_hard_played').textContent,'8');assert.equal(node('record_hard_won').textContent,'5');
t.closeAppModal();assert.equal(node('recordsModal').hidden,true);
node('firstTurn').value='1';node('players').value='cpu';t.restart();assert.equal(t.game.turn,1,'computer starts');
node('firstTurn').value='2';t.restart();const randomFirst=t.game.turn;t.restart();assert.equal(t.game.turn,1-randomFirst,'native random opening alternates');
node('firstTurn').value='0';node('players').value='local';t.restart();assert.equal(t.game.turn,0);
node('powerSide').value='right';node('powerSide').onchange();
down(670,900);node('table').pointermove({pointerId:7,clientX:670,clientY:1050.5,preventDefault(){}});
assert.equal(t.power,50,'right-hand bar accepts drag');node('table').pointercancel({pointerId:7});
node('powerSide').value='left';node('powerSide').onchange();
t.game.finished=true;t.game.winner=0;t.game.played=12;t.maybeShowResult();
for(const fn of [...timers.values()])fn();timers.clear();
assert.equal(node('resultModal').hidden,false);assert.equal(node('resultTitle').textContent,'Player 1 won!');assert.ok(node('resultStats').textContent.includes('Shots: 12'));
t.closeAppModal();t.maybeShowResult();assert.equal(timers.size,0,'dismissed victory does not reopen');
t.restart();assert.equal(node('resultModal').hidden,true);
t.game.finished=true;t.maybeShowResult();t.restart();assert.equal(timers.size,0,'restart cancels delayed result');
for(const mode of ['blackball','free','combo']){
 node('ballSet').value=mode;t.restart();t.game.sound=false;t.fire(-Math.PI/2,70);
 for(let i=0;i<18000&&t.shot;i++)t.simulate(1/150);
 assert.equal(t.shot,null,mode+' settles');
 assert.ok(t.game.balls.every(b=>[b.x,b.y,b.vx,b.vy].every(Number.isFinite)),mode+' finite');
}
console.log('Free-striker gestures, dialog, guards and contact eligibility passed. Retained runtime harness passed: wide pointer selection, duplicate rejection, guide draw, delayed pot, cleanup, restart cancellation, finished guard, three opening-break simulations. DOM and drawing mocked; no browser-rendering claim.');
