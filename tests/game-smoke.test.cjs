'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const code=fs.readFileSync(path.resolve(__dirname,'../docs/game.js'),'utf8');
function makeClient(){
  const elements={};
  const ctx=new Proxy({},{
    get:(_,key)=>key==='createLinearGradient'||key==='createRadialGradient'
      ?()=>({addColorStop(){}}):()=>{},
    set:()=>true
  });
  function element(id){
    if(elements[id])return elements[id];
    const handlers={};
    return elements[id]={value:id==='mode'?'eight':'0',hidden:false,disabled:false,textContent:'',
      handlers,classList:{toggle(){}},addEventListener(name,fn){handlers[name]=fn},
      setAttribute(){},getContext(){return ctx},
      getBoundingClientRect(){return {left:0,top:0,width:1100,height:570}},
      setPointerCapture(){}};
  }
  const window={addEventListener(){}};
  let nextFrame;
  vm.runInNewContext(code,{
    window,document:{getElementById:element},requestAnimationFrame:fn=>nextFrame=fn,
    setTimeout:()=>1,clearTimeout(){},performance:{now:()=>123},location:{}
  },{timeout:2000});
  return {window,elements,tick:t=>nextFrame(t),element};
}
function advance(clients,start,end){
  for(let i=start;i<end;i++)for(const c of clients)c.tick(i*16.667);
}
test('local game bootstraps and shot turns over',()=>{
  const p=makeClient();
  assert.equal(p.element('message').textContent,'Break to start');
  p.element('power').value='55';p.element('shoot').handlers.click();
  assert.equal(p.element('message').textContent,'Balls in motion');
  advance([p],1,1200);
  assert.match(p.element('message').textContent,/Player 2 to shoot/);
});
test('shot and final state sync across host and guest',()=>{
  const host=makeClient(),guest=makeClient();
  const clone=m=>JSON.parse(JSON.stringify(m));
  host.window.poolApp.useNetwork('host',m=>guest.window.poolApp.receive(clone(m)));
  guest.window.poolApp.useNetwork('guest',m=>host.window.poolApp.receive(clone(m)));
  host.window.poolApp.sendState();
  host.element('power').value='50';host.element('shoot').handlers.click();
  advance([host,guest],1,1200);
  assert.equal(host.element('message').textContent,guest.element('message').textContent);
  assert.equal(guest.element('shoot').disabled,false);
  guest.element('power').value='65';guest.element('shoot').handlers.click();
  advance([host,guest],1200,2400);
  assert.equal(host.element('message').textContent,guest.element('message').textContent);
  assert.equal(host.element('shoot').disabled,false);
});
