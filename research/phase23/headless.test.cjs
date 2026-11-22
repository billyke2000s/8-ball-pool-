'use strict';
// Run: node research/phase21/browser.test.cjs /absolute/path/to/v18.html
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:412,height:915}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const html=fs.readFileSync(process.argv[2]||require('node:path').join(__dirname,'fixture.html'),'utf8').replace('restart();requestAnimationFrame(frame);',`restart();window.portTest={get game(){return game},restart,resolvePyramidRemoval,drawRemovalGuide,nearestEligibleBall,exportState,chooseFreeStriker,settings,canAim,choosePower,finishShot,finishPyramidShot,pocket,generateCpuCandidates,selectCpuCandidate,cpuShoot,get power(){return power},get shot(){return shot},fire,simulate};requestAnimationFrame(frame);`);
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
 // Actual browser gestures for Free selection and the choice prompt.
 const freeSetup=()=>{const t=portTest;document.getElementById('ballSet').value='free';t.restart();t.game.sound=false;t.game.freeBall=true;t.settings.tapToAim=false;t.settings.tapToShoot=false;const b=t.game.balls.find(b=>b.id===1);b.x=200;b.y=600;};
 const clickTable=async(x,y)=>{const box=await page.locator('canvas').boundingBox();await page.mouse.click(box.x+box.width*x/700,box.y+box.height*y/1400);};
 await page.evaluate(freeSetup);await clickTable(200,600);
 assert.equal(await page.evaluate(()=>portTest.game.strikerId),1,'Free striker via real pointer');
 await page.evaluate(freeSetup);await page.evaluate(()=>portTest.settings.tapToAim=true);await clickTable(200,600);
 await page.locator('#chooseStriker').click();assert.equal(await page.evaluate(()=>portTest.game.strikerId),1,'Choose dialog action');
 await page.evaluate(freeSetup);await page.evaluate(()=>portTest.settings.tapToAim=true);await clickTable(200,600);
 await page.locator('#aimAtStriker').click();assert.equal(await page.evaluate(()=>portTest.game.strikerId),0,'Aim dialog action');
 await page.evaluate(freeSetup);await page.evaluate(()=>{portTest.settings.tapToShoot=true;portTest.choosePower(50)});
 await clickTable(450,800);assert.equal(await page.evaluate(()=>portTest.shot),null,'felt tap is not a shot');
 await clickTable(30,995.5);assert.equal(await page.evaluate(()=>portTest.game.shotNumber),1,'power bar tap shoots');
 // Speed/power sweep runs actual engine code headlessly, without wall-clock waits.
 let sweep=0;
 for(const mode of ['blackball','free','combo'])for(const speed of [0,2,4,8])for(const power of [5,40,70,100]){
  const result=await page.evaluate(({mode,speed,power})=>{
   document.getElementById('ballSet').value=mode;document.getElementById('friction').value=String(speed);portTest.restart();portTest.game.sound=false;
   const fired=portTest.fire(-Math.PI/2,power);let steps=0;
   while(portTest.shot&&steps++<24000)portTest.simulate(1/150);
   return {fired,settled:!portTest.shot,finite:portTest.game.balls.every(b=>[b.x,b.y,b.vx,b.vy].every(Number.isFinite))};
  },{mode,speed,power});
  assert.deepEqual(result,{fired:true,settled:true,finite:true},`${mode} speed=${speed} power=${power}`);sweep++;
 }
 for(const mode of ['blackball','free','combo'])for(const difficulty of ['easy','normal','hard']){
  const result=await page.evaluate(({mode,difficulty})=>{
   document.getElementById('ballSet').value=mode;document.getElementById('players').value='cpu';document.getElementById('difficulty').value=difficulty;document.getElementById('friction').value='2';
   portTest.restart();portTest.game.sound=false;portTest.game.turn=1;portTest.game.firstBreak=false;portTest.game.freeBall=mode==='free';
   const snapshot=JSON.stringify(portTest.game.balls),striker=portTest.game.strikerId;
   const candidates=portTest.generateCpuCandidates();
   const stable=snapshot===JSON.stringify(portTest.game.balls)&&striker===portTest.game.strikerId;
   const allFinite=candidates.every(c=>[c.score,c.angle,c.power].every(Number.isFinite));
   portTest.cpuShoot();const fired=!!portTest.shot;
   const bound=!portTest.shot||portTest.shot.strikerId===portTest.game.strikerId;
   let steps=0;while(portTest.shot&&steps++<24000)portTest.simulate(1/150);
   return {stable,allFinite,fired,bound,settled:!portTest.shot,finite:portTest.game.balls.every(b=>[b.x,b.y,b.vx,b.vy].every(Number.isFinite))};
  },{mode,difficulty});
  assert.deepEqual(result,{stable:true,allFinite:true,fired:true,bound:true,settled:true,finite:true},`CPU ${mode} ${difficulty}`);
 }
 console.log('Nine real headless CPU mode/difficulty scenarios passed.');
 for(const size of [{width:360,height:800},{width:700,height:1400},{width:1280,height:720}]){
  await page.setViewportSize(size);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'viewport width');
 }
 console.log(`${sweep} speed/power/rule-set combinations passed; real Free selection/choice/power gestures and three viewports passed.`);
 assert.deepEqual(errors,[]);
 console.log('Passed: pointer selection, duplicate rejection, guide, delayed pot, guide cleanup, restart cancellation, finished guard, mobile width, three break simulations, no page errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
