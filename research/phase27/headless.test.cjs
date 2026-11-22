'use strict';
// Real headless Chromium: node headless.test.cjs PAGE.html [screenshot-dir]
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await browser.newPage({viewport:{width:412,height:915}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__oscillators=0;const AC=window.AudioContext;const o=AC.prototype.createOscillator;
   AC.prototype.createOscillator=function(){window.__oscillators++;return o.call(this);};});
  const file=path.resolve(process.argv[2]),shots=process.argv[3];
  await page.goto('file://'+file);
  const modal=()=>page.evaluate(()=>['chooserModal','quitModal','resultModal'].filter(id=>!document.getElementById(id).hidden));
  assert.deepEqual(await modal(),['chooserModal']);
  assert.equal(await page.textContent('#chooserTitle'),'Select Game Type');
  if(shots)await page.screenshot({path:path.join(shots,'1-game-type.png')});
  await page.click('#chooseMode2');
  assert.equal(await page.textContent('#chooserTitle'),'Select Difficulty');
  await page.click('#chooseMode3');
  assert.deepEqual(await modal(),[]);
  assert.equal(await page.inputValue('#players'),'cpu');assert.equal(await page.inputValue('#difficulty'),'hard');
  // Escape -> quit dialog -> No.
  await page.keyboard.press('Escape');assert.deepEqual(await modal(),['quitModal']);
  if(shots)await page.screenshot({path:path.join(shots,'2-quit.png')});
  await page.click('#quitNo');assert.deepEqual(await modal(),[]);
  // Browser/phone back gesture -> quit dialog; back again = Yes -> difficulty chooser (PvC).
  await page.goBack({waitUntil:'commit'}).catch(()=>{});await page.waitForTimeout(150);
  assert.deepEqual(await modal(),['quitModal'],'history back opens quit dialog');
  await page.goBack({waitUntil:'commit'}).catch(()=>{});await page.waitForTimeout(150);
  assert.equal(await page.textContent('#chooserTitle'),'Select Difficulty');
  assert.deepEqual(await modal(),['chooserModal']);
  await page.click('#chooseMode1');assert.deepEqual(await modal(),[]);
  // Restart from the quit dialog.
  await page.keyboard.press('Escape');await page.click('#quitRestart');assert.deepEqual(await modal(),[]);
  // Music: enable from the menu, notes get scheduled when the MIDI asset is present.
  const hasMidi=await page.evaluate(()=>/"entertainer":"data:audio\/midi/.test(document.documentElement.innerHTML));
  await page.click('#menuToggle');await page.click('#musicToggle');
  assert.equal(await page.textContent('#musicToggle'),'Music: on');
  await page.waitForTimeout(600);
  const oscillators=await page.evaluate(()=>window.__oscillators);
  if(hasMidi)assert.ok(oscillators>0,'MIDI notes scheduled through Web Audio');
  else assert.equal(oscillators,0,'fixture without MIDI schedules nothing');
  await page.click('#musicToggle');assert.equal(await page.textContent('#musicToggle'),'Music: off');
  await page.click('#close');
  if(shots)await page.screenshot({path:path.join(shots,'3-table.png')});
  assert.deepEqual(errors,[],'page errors: '+errors.join('; '));
  console.log('Phase 27 Chromium passed: chooser clicks, difficulty, Escape/quit No, history-back quit + Yes, restart, music toggle'+(hasMidi?' (MIDI present)':' (fixture, no MIDI)')+', no page errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
