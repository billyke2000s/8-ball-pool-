'use strict';
// Phase 27 runtime checks: runs the real page scripts with DOM/canvas/time mocked.
// Usage: node runtime.test.cjs v23.html [entertainer.mid]
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.argv[2],'utf8'),nodes={},timers=new Map(),store=new Map();let timerId=0;
const ctx2d=new Proxy({measureText:()=>({width:20})},{get:(o,k)=>k in o?o[k]:()=>{}});
const defaults={ballSet:'blackball',players:'local',friction:'2',pocketSize:'20',difficulty:'normal',pyramidPenalty:'0',firstTurn:'0',powerSide:'left'};
function node(id){return nodes[id]||(nodes[id]={id,value:defaults[id]||'',checked:false,hidden:true,textContent:'',style:{},tagName:'DIV',
 addEventListener(n,f){this[n]=f},setAttribute(){},focus(){},getContext:()=>ctx2d,getBoundingClientRect:()=>({left:0,top:0,width:700,height:1400}),setPointerCapture(){}})}
const winListeners={};let historyPushes=0;
const sandbox={console,Math,Date,JSON,Promise,Set,Map,Number,Boolean,String,Array,Object,Infinity,Uint8Array,atob:s=>Buffer.from(s,'base64').toString('latin1'),
 document:{getElementById:node,querySelector:()=>node('table'),activeElement:null,hidden:false,addEventListener(){}},
 history:{pushState(){historyPushes++}},Image:class{constructor(){this.complete=true;this.naturalWidth=96}},Audio:class{},
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},performance:{now:()=>0},
 setTimeout(fn){timers.set(++timerId,fn);return timerId},clearTimeout(id){timers.delete(id)},setInterval(){return 0},clearInterval(){},
 requestAnimationFrame(){},addEventListener(n,f){(winListeners[n]||(winListeners[n]=[])).push(f)},navigator:{}};
sandbox.window=sandbox;vm.createContext(sandbox);
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const hook='restart();requestAnimationFrame(frame);';
assert.ok(scripts[1].includes(hook));
scripts[1]=scripts[1].replace(hook,`restart();window.t={get game(){return game},get appModal(){return appModal},get nativeMode(){return nativeMode},settings,canAim,nativeBack,showQuitDialog,parseMidi,music,musicSong,maybeShowResult,restart};requestAnimationFrame(frame);`);
for(const s of scripts)vm.runInContext(s,sandbox);
const t=sandbox.t;
const key=k=>{for(const f of winListeners.keydown||[])f({key:k,code:k,preventDefault(){},shiftKey:false})};
const click=id=>node(id).onclick();

// Launch: vh.UNKNOWN -> game-type chooser, input blocked, back guard armed.
assert.equal(t.appModal,'gameType');assert.equal(node('chooserModal').hidden,false);
assert.equal(node('chooserTitle').textContent,'Select Game Type');
assert.deepEqual(['chooseMode1','chooseMode2','chooseMode3'].map(i=>node(i).textContent),['1 Player','Human vs Computer','2 Players']);
assert.equal(t.canAim(),false,'chooser blocks aiming');assert.equal(historyPushes,1);
assert.equal(t.nativeBack(),false,'back on game-type chooser leaves the page');
assert.equal(t.showQuitDialog(),false,'no quit dialog while mode is UNKNOWN');

// 1 Player -> SINGLE.
click('chooseMode1');assert.equal(t.appModal,null);assert.equal(t.game.playerMode,'solo');assert.equal(t.nativeMode,'single');
assert.equal(node('chooserModal').hidden,true);assert.equal(t.canAim(),true);

// Back during play -> quit dialog; No resumes the same game untouched.
const before=t.game;t.game.balls[1].x=123;key('Escape');
assert.equal(t.appModal,'quit');assert.equal(node('quitModal').hidden,false);assert.equal(t.canAim(),false);
click('quitNo');assert.equal(t.appModal,null);assert.equal(t.game,before);assert.equal(t.game.balls[1].x,123);
// Restart -> new game, same mode.
key('Escape');click('quitRestart');assert.notEqual(t.game,before);assert.equal(t.game.playerMode,'solo');assert.equal(t.appModal,null);
// Yes in non-PvC -> game-type chooser.
key('Escape');click('quitYes');assert.equal(t.appModal,'gameType');assert.equal(t.nativeMode,'unknown');
// Back on quit dialog behaves as Yes (nn: dialog 5 -> w()).
click('chooseMode3');assert.equal(t.game.playerMode,'local');assert.equal(t.nativeMode,'pvp');
key('Escape');key('Escape');assert.equal(t.appModal,'gameType');

// Human vs Computer -> difficulty chooser -> Hard.
click('chooseMode2');assert.equal(t.appModal,'difficulty');assert.equal(node('chooserTitle').textContent,'Select Difficulty');
assert.deepEqual(['chooseMode1','chooseMode2','chooseMode3'].map(i=>node(i).textContent),['Easy','Normal','Hard']);
key('Escape');assert.equal(t.appModal,'gameType','back on difficulty -> game type');
click('chooseMode2');click('chooseMode3');
assert.equal(t.appModal,null);assert.equal(t.game.playerMode,'cpu');assert.equal(t.settings.difficulty,'hard');assert.equal(t.nativeMode,'pvc');
// Quit Yes in PvC -> difficulty chooser (GameActivity.w).
key('Escape');click('quitYes');assert.equal(t.appModal,'difficulty');click('chooseMode1');assert.equal(t.settings.difficulty,'easy');

// Menu open: back closes the menu, it does not open the quit dialog.
node('screenOverlay').hidden=false;key('Escape');assert.equal(node('screenOverlay').hidden,true);assert.equal(t.appModal,null);

// Result OK restarts (oh -> zb.p = xb(1) -> y()).
const finished=t.game;finished.finished=true;finished.winner=0;timers.clear();t.maybeShowResult();
for(const f of [...timers.values()])f();timers.clear();
assert.equal(t.appModal,'result');click('closeResult');assert.notEqual(t.game,finished);assert.equal(t.game.finished,false);assert.equal(t.appModal,null);
// Back on the result dialog also restarts.
const finished2=t.game;finished2.finished=true;finished2.winner=1;t.maybeShowResult();for(const f of [...timers.values()])f();timers.clear();
key('Escape');assert.notEqual(t.game,finished2);assert.equal(t.appModal,null);

// Music: default off (music_track "off"), persisted when toggled.
assert.equal(t.music.enabled,false);assert.equal(node('musicToggle').textContent,'Music: off');
click('musicToggle');assert.equal(t.music.enabled,true);assert.equal(node('musicToggle').textContent,'Music: on');
assert.equal(JSON.parse(store.get('billiard_native_port_preferences')).music,true);
click('musicToggle');assert.equal(JSON.parse(store.get('billiard_native_port_preferences')).music,false);

// MIDI parser against the original file when supplied (private run).
if(process.argv[3]){
 const song=t.parseMidi(new Uint8Array(fs.readFileSync(process.argv[3])));
 assert.equal(song.notes.length,2550,'1315 + 1195 + 40 note-ons in the original tracks');
 assert.ok(song.duration>150&&song.duration<260,'duration '+song.duration);
 assert.ok(song.notes.every(n=>n.end>n.start&&n.note>=0&&n.note<128));
 assert.ok(t.musicSong()&&t.musicSong().notes.length===2550,'embedded asset parses');
 console.log('MIDI: '+song.notes.length+' notes, '+song.duration.toFixed(1)+' s');
}else assert.equal(t.musicSong(),false,'fixture without MIDI: music unavailable, no crash');
console.log('Phase 27 passed: launch chooser, game-type/difficulty flow, quit Yes/No/Restart, back semantics, menu back, result-OK restart, music preference.');
