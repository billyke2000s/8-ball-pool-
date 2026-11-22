'use strict';
// Execute the actual standalone HTML scripts, with drawing/DOM/time mocked.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.argv[2],'utf8'),nodes={},timers=new Map();let timerId=0,endpoint=null;
const context2d=new Proxy({lineTo:(x,y)=>endpoint=[x,y],measureText:()=>({width:20})},{get:(o,k)=>k in o?o[k]:()=>{}});
function node(id){return nodes[id]||(nodes[id]={value:({ballSet:'blackball',players:'local',friction:'2',pocketSize:'20',difficulty:'normal',pyramidPenalty:'0'})[id]||'',checked:false,hidden:true,textContent:'',style:{},tagName:'DIV',addEventListener(name,fn){this[name]=fn},setAttribute(){},focus(){},getContext:()=>context2d,getBoundingClientRect:()=>({left:0,top:0,width:700,height:1400}),setPointerCapture(){}})}
const sandbox={console,Math,Date,JSON,Promise,Set,Map,Number,Boolean,String,Array,Object,Infinity,
 document:{getElementById:node,querySelector:()=>node('table'),activeElement:null},
 Image:class{constructor(){this.complete=true;this.naturalWidth=96}},Audio:class{},
 localStorage:{getItem:()=>null,setItem(){}},performance:{time:0,now(){return this.time}},
 setTimeout(fn){timers.set(++timerId,fn);return timerId},clearTimeout(id){timers.delete(id)},requestAnimationFrame(){},addEventListener(){},navigator:{}};
sandbox.window=sandbox;vm.createContext(sandbox);
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
scripts[1]=scripts[1].replace('restart();requestAnimationFrame(frame);',`restart();window.t={get game(){return game},restart,resolvePyramidRemoval,drawRemovalGuide,get shot(){return shot},fire,simulate,pocket,finishShot,get power(){return power},choosePower,chooseFreeStriker,finishPyramidShot,settings,canAim};requestAnimationFrame(frame);`);
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
for(const mode of ['blackball','free','combo']){
 node('ballSet').value=mode;t.restart();t.game.sound=false;t.fire(-Math.PI/2,70);
 for(let i=0;i<18000&&t.shot;i++)t.simulate(1/150);
 assert.equal(t.shot,null,mode+' settles');
 assert.ok(t.game.balls.every(b=>[b.x,b.y,b.vx,b.vy].every(Number.isFinite)),mode+' finite');
}
console.log('Free-striker gestures, dialog, guards and contact eligibility passed. Retained runtime harness passed: wide pointer selection, duplicate rejection, guide draw, delayed pot, cleanup, restart cancellation, finished guard, three opening-break simulations. DOM and drawing mocked; no browser-rendering claim.');
