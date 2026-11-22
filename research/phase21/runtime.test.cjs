'use strict';
// Execute the actual standalone HTML scripts, with drawing/DOM/time mocked.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.argv[2],'utf8'),nodes={},timers=new Map();let timerId=0,endpoint=null;
const context2d=new Proxy({lineTo:(x,y)=>endpoint=[x,y],measureText:()=>({width:20})},{get:(o,k)=>k in o?o[k]:()=>{}});
function node(id){return nodes[id]||(nodes[id]={value:({ballSet:'blackball',players:'local',friction:'2',pocketSize:'20',difficulty:'normal',pyramidPenalty:'0'})[id]||'',checked:false,hidden:true,textContent:'',style:{},tagName:'DIV',addEventListener(name,fn){this[name]=fn},setAttribute(){},getContext:()=>context2d,getBoundingClientRect:()=>({left:0,top:0,width:700,height:1400}),setPointerCapture(){}})}
const sandbox={console,Math,Date,JSON,Promise,Set,Map,Number,Boolean,String,Array,Object,Infinity,
 document:{getElementById:node,querySelector:()=>node('table'),activeElement:null},
 Image:class{constructor(){this.complete=true;this.naturalWidth=96}},Audio:class{},
 localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},
 setTimeout(fn){timers.set(++timerId,fn);return timerId},clearTimeout(id){timers.delete(id)},requestAnimationFrame(){},addEventListener(){},navigator:{}};
sandbox.window=sandbox;vm.createContext(sandbox);
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
scripts[1]=scripts[1].replace('restart();requestAnimationFrame(frame);',`restart();window.t={get game(){return game},restart,resolvePyramidRemoval,drawRemovalGuide,get shot(){return shot},fire,simulate};requestAnimationFrame(frame);`);
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
for(const mode of ['blackball','free','combo']){
 node('ballSet').value=mode;t.restart();t.game.sound=false;t.fire(-Math.PI/2,70);
 for(let i=0;i<18000&&t.shot;i++)t.simulate(1/150);
 assert.equal(t.shot,null,mode+' settles');
 assert.ok(t.game.balls.every(b=>[b.x,b.y,b.vx,b.vy].every(Number.isFinite)),mode+' finite');
}
console.log('Runtime harness passed: wide pointer selection, duplicate rejection, guide draw, delayed pot, cleanup, restart cancellation, finished guard, three opening-break simulations. DOM and drawing mocked; no browser-rendering claim.');
