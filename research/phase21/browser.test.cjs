'use strict';
// Run: node research/phase21/browser.test.cjs /absolute/path/to/v18.html
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:412,height:915}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const html=fs.readFileSync(process.argv[2],'utf8').replace('restart();requestAnimationFrame(frame);',`restart();window.portTest={get game(){return game},restart,resolvePyramidRemoval,drawRemovalGuide,nearestEligibleBall,exportState,get shot(){return shot},fire,simulate};requestAnimationFrame(frame);`);
 await page.setContent(html);
 const setup=()=>{const t=window.portTest;document.getElementById('ballSet').value='combo';document.getElementById('players').value='local';t.restart();t.game.sound=false;t.game.selectingRemoval=true;return t;};
 await page.evaluate(setup);
 // Genuine scaled pointer tap away from all balls: original uses a wide nearest search.
 const expected=await page.evaluate(()=>portTest.nearestEligibleBall(portTest.game.balls,350,700,1104,0).id);
 const canvas=await page.locator('canvas').boundingBox();
 await page.mouse.click(canvas.x+canvas.width*.5,canvas.y+canvas.height*.5);
 assert.equal(await page.evaluate(()=>portTest.game.removingBallId),expected);
 assert.equal(await page.evaluate(()=>portTest.resolvePyramidRemoval(2)),false);
 const guide=await page.evaluate(()=>{const c=document.querySelector('canvas').getContext('2d'),old=c.lineTo;let endpoint=null;c.lineTo=(x,y)=>{endpoint=[x,y];};portTest.drawRemovalGuide();c.lineTo=old;return endpoint;});
 assert.ok(guide&&guide.every(Number.isFinite));
 await page.waitForTimeout(1350);
 assert.equal(await page.evaluate(id=>portTest.game.balls.find(b=>b.id===id).active,expected),false);
 assert.equal(await page.evaluate(()=>portTest.game.removalPocketIndex),null);
 await page.evaluate(setup);
 await page.evaluate(()=>portTest.resolvePyramidRemoval(2));
 await page.evaluate(()=>portTest.restart());
 await page.waitForTimeout(1300);
 assert.equal(await page.evaluate(()=>portTest.game.balls.filter(b=>b.active).length),16);
 await page.evaluate(setup);
 assert.equal(await page.evaluate(()=>{portTest.game.finished=true;return portTest.resolvePyramidRemoval(2);}),false);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 // Exercise the retained physics with actual opening shots in every rule set.
 for(const mode of ['blackball','free','combo']){
 const result=await page.evaluate(mode=>{document.getElementById('ballSet').value=mode;portTest.restart();portTest.game.sound=false;portTest.fire(-Math.PI/2,70);let i=0;for(;i<18000&&portTest.shot;i++)portTest.simulate(1/150);return {settled:!portTest.shot,finite:portTest.game.balls.every(b=>[b.x,b.y,b.vx,b.vy].every(Number.isFinite))};},mode);
 assert.deepEqual(result,{settled:true,finite:true},mode);
 }
 assert.deepEqual(errors,[]);
 console.log('Passed: pointer selection, duplicate rejection, guide, delayed pot, guide cleanup, restart cancellation, finished guard, mobile width, three break simulations, no page errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
