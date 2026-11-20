(() => {
  'use strict';
  const canvas=document.getElementById('pool'), ctx=canvas.getContext('2d');
  const el=id=>document.getElementById(id);
  const W=700,H=1400,R=16, left=76,right=624,top=80,bottom=1322;
  const pockets=[[left,top],[right,top],[left,(top+bottom)/2],[right,(top+bottom)/2],[left,bottom],[right,bottom]];
  const FIXED=1/120, FRICTION=212, RESTITUTION=.965, RAIL=.84;
  let game, aim=-Math.PI/2, shot=null, moving=false, accumulator=0,lastFrame=0, pointerDown=false;
  let dragMode=null,dragOrigin=null,startAngle=0, powerSet=0;
  let soundOn=true,audio=null,lastCollision=0,noticeTimer=null;
  let networkRole=null, networkSend=null, connected=false, rackNumber=0, pendingSnapshot=null;
  const rand=(a,b)=>a+Math.random()*(b-a);
  function ball(id,x,y){return {id,x,y,vx:0,vy:0,alive:true};}
  function colorType(id){if(id===0)return 'cue';if(id===8)return 'black';return id<=7?'low':'high';}
  function makeRack(mode='blackball'){
    // Portrait triangular blackball setup recovered from the game reference:
    // five across the top, narrowing to one ball facing the cue.
    const balls=[ball(0,350,1034)];
    const layout=[1,9,10,2,11,12,3,13,4,5,8,14,15,6,7];
    let k=0;
    for(let row=0;row<5;row++){
      const count=5-row;
      const yy=222+row*31.5;
      const x0=350-((count-1)*36.5)/2;
      for(let n=0;n<count;n++)balls.push(ball(layout[k++],x0+n*36.5,yy));
    }
    return {mode,balls,turn:0,groups:[null,null],breakShot:true,winner:null,ballInHand:false,shotCount:0};
  }
  const cue=()=>game.balls[0];
  function reset(mode=el('mode').value){
    rackNumber++;
    game=makeRack(mode);aim=-Math.PI/2;moving=false;shot=null;powerSet=0;
    el('power').value='0';el('powerValue').textContent='0%';
    el('mode').value=mode;status('Your turn!');redrawUI();broadcastState();
  }
  function status(s){el('message').textContent=s;}
  function toast(s,ms=2100){
    const n=el('notice');n.hidden=false;n.textContent=s;clearTimeout(noticeTimer);
    noticeTimer=setTimeout(()=>{n.hidden=true;},ms);
  }
  function ownTurn(){return !connected || (game.turn===(networkRole==='host'?0:1));}
  function canShoot(){return !moving&&game.winner===null&&ownTurn()&&!game.ballInHand;}
  function groupName(g){
    if(!g)return 'Open table';
    if(game.mode==='blackball')return g==='low'?'Reds':'Yellows';
    return g==='low'?'Solids (1–7)':'Stripes (9–15)';
  }
  function remaining(group){return game.balls.filter(b=>b.alive&&colorType(b.id)===group).length;}
  function redrawUI(){
    for(let i=0;i<2;i++){
      el('p'+i).classList.toggle('active',game.turn===i&&!game.winner);
      el('g'+i).textContent=groupName(game.groups[i]);
    }
    el('round').textContent='RACK '+String(rackNumber).padStart(2,'0');
    if(el('rackMenu'))el('rackMenu').textContent=String(rackNumber).padStart(2,'0');
    el('shoot').disabled=!canShoot();
    el('place').hidden=!game.ballInHand||!ownTurn();
    el('mode').value=game.mode;
    el('mode').disabled=connected&&networkRole==='guest';
    el('restart').disabled=connected&&networkRole==='guest';
  }
  function initAudio(){
    try{if(!audio)audio=new (window.AudioContext||window.webkitAudioContext)();audio.resume();}
    catch(e){soundOn=false;}
  }
  function tone(freq,duration,kind='sine',gain=.09,endFreq){
    if(!soundOn)return;
    initAudio();if(!audio)return;
    const now=audio.currentTime, osc=audio.createOscillator(),g=audio.createGain();
    osc.type=kind;osc.frequency.setValueAtTime(freq,now);
    if(endFreq)osc.frequency.exponentialRampToValueAtTime(Math.max(25,endFreq),now+duration);
    g.gain.setValueAtTime(gain,now);g.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(g);g.connect(audio.destination);osc.start(now);osc.stop(now+duration+.015);
  }
  function strikeSound(power){tone(110+power*1.5,.12,'triangle',.16,48);tone(850,.035,'square',.013,310);}
  function collisionSound(strength){
    const t=performance.now();if(t-lastCollision<35)return;lastCollision=t;
    tone(380+Math.min(600,strength*.8),.06,'sine',Math.min(.09,.012+strength/7000),130);
  }
  function pocketSound(){tone(190,.23,'sine',.15,47);setTimeout(()=>tone(95,.16,'triangle',.06,55),65);}
  function resultSound(){for(let i=0;i<4;i++)setTimeout(()=>tone(400+i*100,.22,'sine',.1),i*105);}
  function fire(angle,power,remote=false){
    if(moving||game.winner!==null||game.ballInHand)return;
    if(!remote&&!canShoot())return;
    power=Math.min(100,Math.max(1,Number(power)||0));
    if(power<2){if(!remote)toast('Set power above zero');return;}
    aim=angle;
    shot={owner:!remote,first:null,potted:[],scratch:false,rail:false};
    const c=cue();
    c.vx=Math.cos(aim)*(240+power*8);
    c.vy=Math.sin(aim)*(240+power*8);
    moving=true;game.shotCount++;
    status('Balls in motion');powerSet=0;el('power').value='0';el('powerValue').textContent='0%';
    strikeSound(power);
    if(!remote)send({type:'shot',angle:aim,power});
    redrawUI();
  }
  function step(dt){
    if(!moving)return;
    const active=game.balls.filter(b=>b.alive);
    let any=false;
    for(const b of active){
      const v=Math.hypot(b.vx,b.vy);
      if(v<.28){b.vx=0;b.vy=0;continue;}
      any=true;
      const after=Math.max(0,v-FRICTION*dt),scale=after/v;
      b.vx*=scale;b.vy*=scale;b.x+=b.vx*dt;b.y+=b.vy*dt;
      // Detect mouth of a pocket BEFORE rail response.
      let captured=false;
      for(const [px,py] of pockets){
        if(Math.hypot(b.x-px,b.y-py)<R*2.25){
          b.alive=false;b.vx=0;b.vy=0;shot.potted.push(b.id);
          if(b.id===0)shot.scratch=true;
          pocketSound();captured=true;break;
        }
      }
      if(captured)continue;
      if(b.x<left+R){b.x=left+R;b.vx=Math.abs(b.vx)*RAIL;shot.rail=true;collisionSound(Math.abs(b.vx));}
      if(b.x>right-R){b.x=right-R;b.vx=-Math.abs(b.vx)*RAIL;shot.rail=true;collisionSound(Math.abs(b.vx));}
      if(b.y<top+R){b.y=top+R;b.vy=Math.abs(b.vy)*RAIL;shot.rail=true;collisionSound(Math.abs(b.vy));}
      if(b.y>bottom-R){b.y=bottom-R;b.vy=-Math.abs(b.vy)*RAIL;shot.rail=true;collisionSound(Math.abs(b.vy));}
    }
    for(let i=0;i<active.length;i++){
      const a=active[i];if(!a.alive)continue;
      for(let j=i+1;j<active.length;j++){
        const b=active[j];if(!b.alive)continue;
        const dx=b.x-a.x,dy=b.y-a.y,dist2=dx*dx+dy*dy;
        if(dist2>=(R*2)*(R*2))continue;
        const dist=Math.max(.000001,Math.sqrt(dist2)),nx=dx/dist,ny=dy/dist;
        const overlap=2*R-dist+.001;
        a.x-=nx*overlap/2;a.y-=ny*overlap/2;b.x+=nx*overlap/2;b.y+=ny*overlap/2;
        const relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
        if(relative>=0)continue;
        const impulse=-(1+RESTITUTION)*relative/2;
        a.vx-=impulse*nx;a.vy-=impulse*ny;
        b.vx+=impulse*nx;b.vy+=impulse*ny;
        if(shot.first===null&&(a.id===0||b.id===0))shot.first=a.id===0?b.id:a.id;
        collisionSound(-relative);
      }
    }
    if(!any&&active.every(b=>Math.hypot(b.vx,b.vy)<.28)){
      for(const b of active){b.vx=0;b.vy=0;}
      moving=false;finishShot();
    }
  }
  function safeCuePosition(x=350,y=1034){
    const c=cue();c.alive=true;c.vx=c.vy=0;
    for(let radius=0;radius<180;radius+=18){
      for(let j=0;j<24;j++){
        const t=j*Math.PI/12,nx=Math.max(left+R+2,Math.min(right-R-2,x+Math.cos(t)*radius)),ny=Math.max(top+R+2,Math.min(bottom-R-2,y+Math.sin(t)*radius));
        if(game.balls.every(b=>b===c||!b.alive||Math.hypot(nx-b.x,ny-b.y)>2*R+1)){
          c.x=nx;c.y=ny;return;
        }
      }
    }
    c.x=350;c.y=1034;
  }
  function finishShot(){
    const localShot=shot.owner;
    const player=game.turn, other=1-player;
    const first=shot.first, potted=shot.potted.filter(id=>id!==0),black=potted.includes(8);
    const assigned=game.groups[player];
    let foul=shot.scratch||first===null;
    if(!game.breakShot&&assigned&&first!==null){
      if(remaining(assigned)===0){
        if(first!==8)foul=true;
      }else if(colorType(first)!==assigned)foul=true;
    }
    // A legal shot needs a pocket or a cushion after contacting a ball.
    if(first!==null&&!shot.rail&&potted.length===0)foul=true;
    if(!assigned&&!game.breakShot&&first===8)foul=true;
    if(black){
      const cleared=assigned&&remaining(assigned)===0;
      game.winner=cleared&&!foul?player:other;
      status('Player '+(game.winner+1)+' wins!');
      resultSound();toast('Player '+(game.winner+1)+' wins!',4200);
    }else{
      if(!game.breakShot&&!assigned&&!foul){
        const firstColour=potted.map(colorType).find(t=>t==='low'||t==='high');
        if(firstColour){
          game.groups[player]=firstColour;
          game.groups[other]=firstColour==='low'?'high':'low';
        }
      }
      const ownPocket=potted.some(id=>game.groups[player]?
        colorType(id)===game.groups[player]:id!==8);
      if(foul){
        game.turn=other;game.ballInHand=true;
        safeCuePosition();
        status('Foul — Player '+(other+1)+' has ball in hand');
        toast('Foul • Ball in hand');
      }else{
        if(!ownPocket)game.turn=other;
        game.ballInHand=false;
        status('Player '+(game.turn+1)+' to shoot');
      }
    }
    game.breakShot=false;
    shot=null;
    redrawUI();
    if(localShot)broadcastState();
    else if(pendingSnapshot){const snapshot=pendingSnapshot;pendingSnapshot=null;applySnapshot(snapshot);}
  }
  function handlePlacement(x,y,remote=false){
    if(!game.ballInHand||moving||(!remote&&!ownTurn()))return;
    if(x<left+R+1||x>right-R-1||y<top+R+1||y>bottom-R-1)return;
    const c=cue();
    if(game.balls.some(b=>b.id!==0&&b.alive&&Math.hypot(x-b.x,y-b.y)<R*2+1))return;
    c.x=x;c.y=y;c.alive=true;c.vx=c.vy=0;
    game.ballInHand=false;
    status('Player '+(game.turn+1)+' to shoot');
    if(!remote)send({type:'place',x,y});
    redrawUI();
  }
  function send(payload){if(connected&&networkSend)networkSend(payload);}
  function broadcastState(){send({type:'state',state:game,rack:rackNumber});}
  function useNetwork(role,sendFn){
    connected=true;networkRole=role;networkSend=sendFn;
    el('connStatus').textContent='● '+(role==='host'?'Player 1 (host)':'Player 2 (guest)');
    redrawUI();
  }
  function leaveNetwork(){
    connected=false;networkRole=null;networkSend=null;el('connStatus').textContent='● Local two-player';redrawUI();
  }
  function applySnapshot(obj){
    game=obj.state;
    if(obj.rack)rackNumber=obj.rack;
    game.balls.forEach(b=>{b.vx=0;b.vy=0;});
    el('mode').value=game.mode;
    status(game.winner!==null?'Player '+(game.winner+1)+' wins!':'Player '+(game.turn+1)+' to shoot');
    redrawUI();
  }
  function receive(obj){
    if(!obj||typeof obj!=='object')return;
    if(obj.type==='state'&&obj.state&&Array.isArray(obj.state.balls)&&obj.state.balls.length===16){
      if(moving)pendingSnapshot=obj;else applySnapshot(obj);
    }else if(obj.type==='shot'&&!moving&&ownTurn()===false&&Number.isFinite(Number(obj.angle)))fire(Number(obj.angle),Number(obj.power),true);
    else if(obj.type==='place'&&!moving&&ownTurn()===false)handlePlacement(Number(obj.x),Number(obj.y),true);
  }
  function setSound(){soundOn=!soundOn;el('sound').textContent=soundOn?'♫ Sound on':'♫ Sound off';el('sound').setAttribute('aria-pressed',String(soundOn));if(soundOn)initAudio();}
  function roundedRect(x,y,w,h,r){
    ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
  }
  function drawTable(){
    // The APK uses a full-portrait felt table with timber rails, brass pocket
    // housings, a left pull-back power control and a right precision wheel.
    // Shapes and textures below are redrawn, not copied APK images.
    ctx.fillStyle='#040909';ctx.fillRect(0,0,W,H);
    const timber=ctx.createLinearGradient(0,0,700,0);
    timber.addColorStop(0,'#3d1e12');timber.addColorStop(.12,'#7b4121');timber.addColorStop(.45,'#6a301c');timber.addColorStop(.75,'#7c4222');timber.addColorStop(1,'#3e2114');
    ctx.fillStyle=timber;ctx.fillRect(0,0,W,H);
    // Grain follows the wooden rails and is deliberately low contrast.
    for(let i=0;i<76;i++){
      const y=((i*83+17)%H);
      ctx.fillStyle=i%4===0?'#20130d25':'#dba27313';
      ctx.fillRect(0,y,W,1+(i%3===0?1:0));
    }
    const felt=ctx.createRadialGradient(365,690,85,350,690,900);
    felt.addColorStop(0,'#13595b');felt.addColorStop(.72,'#0d4c4f');felt.addColorStop(1,'#07383c');
    ctx.fillStyle='#251b15';ctx.fillRect(54,48,592,1304);
    ctx.fillStyle=felt;ctx.fillRect(69,65,562,1272);
    // Inner shadows and teal rubber cushion strips.
    ctx.lineCap='butt';
    ctx.strokeStyle='#011b19';ctx.lineWidth=19;
    ctx.strokeRect(69,65,562,1272);
    ctx.strokeStyle='#007c73';ctx.lineWidth=10;
    ctx.strokeRect(69,65,562,1272);
    ctx.strokeStyle='#1d9185';ctx.lineWidth=2;
    ctx.strokeRect(75,71,550,1260);
    // Realistic felt falloff near the rails.
    const lip=ctx.createLinearGradient(77,0,115,0);
    lip.addColorStop(0,'#001a1e6b');lip.addColorStop(1,'#001a1e00');
    ctx.fillStyle=lip;ctx.fillRect(77,85,38,1228);
    const lip2=ctx.createLinearGradient(585,0,623,0);
    lip2.addColorStop(0,'#001a1e00');lip2.addColorStop(1,'#001a1e6b');
    ctx.fillStyle=lip2;ctx.fillRect(585,85,38,1228);
    // Wood-to-metal corner blocks with dark sunk pocket throats.
    function brassPiece(){
      const g=ctx.createLinearGradient(0,0,130,130);
      g.addColorStop(0,'#c68b36');g.addColorStop(.17,'#fff0a2');
      g.addColorStop(.4,'#c79843');g.addColorStop(.76,'#94611c');g.addColorStop(1,'#f0b958');
      ctx.fillStyle=g;ctx.strokeStyle='#ffd88b';ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(124,0);ctx.lineTo(124,65);
      ctx.lineTo(101,65);ctx.lineTo(82,48);ctx.arc(69,71,34,-.75,2.25,true);
      ctx.lineTo(77,126);ctx.lineTo(0,126);ctx.closePath();ctx.fill();ctx.stroke();
      const dark=ctx.createRadialGradient(63,69,3,68,72,41);
      dark.addColorStop(0,'#050808');dark.addColorStop(.6,'#0a0b0a');dark.addColorStop(.82,'#3a2215');dark.addColorStop(1,'#8c4b21');
      ctx.fillStyle=dark;ctx.beginPath();ctx.arc(68,70,32,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#6c3a1c';ctx.lineWidth=6;ctx.stroke();
      ctx.strokeStyle='#f4c76a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(68,70,37,.65,4.1);ctx.stroke();
      ctx.strokeStyle='#fff1b64a';ctx.lineWidth=1;
      for(let i=7;i<=119;i+=19){ctx.beginPath();ctx.moveTo(i,3);ctx.lineTo(i+1,17);ctx.stroke();}
    }
    const corners=[[0,0,1,1],[700,0,-1,1],[0,1400,1,-1],[700,1400,-1,-1]];
    for(const [x,y,fx,fy] of corners){
      ctx.save();ctx.translate(x,y);ctx.scale(fx,fy);brassPiece();ctx.restore();
    }
    function sidePocket(){
      const g=ctx.createLinearGradient(0,-60,85,70);
      g.addColorStop(0,'#f7d47c');g.addColorStop(.5,'#ac7528');g.addColorStop(1,'#f7d17f');
      ctx.fillStyle=g;ctx.strokeStyle='#ffe2a0';ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(0,-58);ctx.lineTo(73,-58);ctx.lineTo(73,-26);
      ctx.arc(39,0,30,-.95,.95,true);
      ctx.lineTo(73,26);ctx.lineTo(73,59);ctx.lineTo(0,59);ctx.closePath();ctx.fill();ctx.stroke();
      const p=ctx.createRadialGradient(39,0,3,39,0,34);
      p.addColorStop(0,'#020706');p.addColorStop(.75,'#130e0b');p.addColorStop(1,'#573019');
      ctx.fillStyle=p;ctx.beginPath();ctx.arc(40,0,32,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#a26529';ctx.lineWidth=5;ctx.stroke();
    }
    for(const x of [0,700]){
      ctx.save();ctx.translate(x,700);ctx.scale(x===0?1:-1,1);sidePocket();ctx.restore();
    }
    // Right wheel: rotating aim by dragging here should not move the cue ball.
    const w=ctx.createLinearGradient(645,0,699,0);
    w.addColorStop(0,'#080909e9');w.addColorStop(.24,'#272a2bdc');
    w.addColorStop(.75,'#535353ec');w.addColorStop(1,'#080909f5');
    roundedRect(640,844,60,308,19);ctx.fillStyle=w;ctx.fill();
    ctx.save();ctx.beginPath();ctx.rect(643,846,55,305);ctx.clip();
    for(let i=0;i<52;i++){
      const y=851+i*5.8,mid=i%5===0;
      ctx.strokeStyle=mid?'#121717':'#1b1c1e';ctx.lineWidth=mid?2.3:1.1;
      ctx.beginPath();ctx.moveTo(mid?657:670,y);ctx.lineTo(698,y);ctx.stroke();
    }
    ctx.restore();
    // The long left slot is the cue power pull-back control.
    roundedRect(0,837,59,312,10);ctx.fillStyle='#171b1de5';ctx.fill();
    const s=ctx.createLinearGradient(20,0,35,0);
    s.addColorStop(0,'#5f4327');s.addColorStop(.45,'#f6de94');s.addColorStop(1,'#8a5b2e');
    roundedRect(24,855,8,260,3);ctx.fillStyle=s;ctx.fill();
    if(powerSet>0){
      ctx.fillStyle='#f0d8a099';
      roundedRect(18,855,21,Math.min(268,powerSet*2.62),6);ctx.fill();
    }
  }
  function ballPaint(b){
    const x=b.x,y=b.y,id=b.id;
    ctx.fillStyle='#020d0ecc';ctx.beginPath();ctx.ellipse(x+4,y+5,R*1.05,R*.91,-.2,0,Math.PI*2);ctx.fill();
    let base;
    if(id===0)base='#dedfdb';
    else if(id===8)base='#111318';
    else if(game.mode==='blackball')base=id<8?'#ce303a':'#e1ca31';
    else base=({1:'#edcb2a',2:'#2364a3',3:'#be3038',4:'#603895',5:'#df7428',6:'#218b56',7:'#81323c'})[id<=7?id:id-8];
    const g=ctx.createRadialGradient(x-6,y-8,1,x+2,y+3,R*1.45);
    g.addColorStop(0,id===0?'#fff':'#fff9db');
    g.addColorStop(.2,base);g.addColorStop(.60,base);
    g.addColorStop(1,id===0?'#636f6b':'#1a1815');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,R,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#0f100e52';ctx.lineWidth=.7;ctx.stroke();
    if(id!==0&&game.mode==='eight'){
      if(id>8){
        ctx.save();ctx.beginPath();ctx.arc(x,y,R-.5,0,Math.PI*2);ctx.clip();
        ctx.fillStyle='#fbf7e9';ctx.fillRect(x-R,y-5,2*R,10);ctx.restore();
      }
      ctx.fillStyle='#f5f4e7';ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#191919';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(String(id),x,y+.3);
    }
    ctx.save();ctx.globalAlpha=.45;ctx.fillStyle='#fff';
    ctx.beginPath();ctx.ellipse(x-6,y-7,4.5,3,-.45,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function drawGuide(c){
    const dx=Math.cos(aim),dy=Math.sin(aim);
    let length=1400,collision=null;
    for(const b of game.balls){
      if(b.id===0||!b.alive)continue;
      const ox=b.x-c.x,oy=b.y-c.y,project=ox*dx+oy*dy;
      if(project<=0)continue;
      const side2=ox*ox+oy*oy-project*project;
      if(side2>(2*R)*(2*R))continue;
      const intercept=project-Math.sqrt(Math.max(0,4*R*R-side2));
      if(intercept>=0&&intercept<length){length=intercept;collision=b;}
    }
    // Reference uses a continuous bright white projected aim line.
    ctx.strokeStyle='#effdf9e3';ctx.lineWidth=2.7;ctx.setLineDash([]);
    ctx.beginPath();ctx.moveTo(c.x+dx*(R+3),c.y+dy*(R+3));
    ctx.lineTo(c.x+dx*length,c.y+dy*length);ctx.stroke();
    if(collision){
      ctx.strokeStyle='#f3faf8';ctx.lineWidth=2.6;
      ctx.beginPath();ctx.arc(c.x+dx*length,c.y+dy*length,R+1,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(c.x+dx*length,c.y+dy*length);
      ctx.lineTo(c.x+dx*(length+R),c.y+dy*(length+R));ctx.stroke();
    }
    const power=Number(el('power').value)||0;
    const offset=34+power*.95,back=420;
    const x1=c.x-dx*offset,y1=c.y-dy*offset,x2=c.x-dx*(offset+back),y2=c.y-dy*(offset+back);
    ctx.save();ctx.lineCap='butt';ctx.lineWidth=8;ctx.strokeStyle='#04120e99';
    ctx.beginPath();ctx.moveTo(x1+2,y1+1);ctx.lineTo(x2+2,y2+1);ctx.stroke();
    const shaft=ctx.createLinearGradient(x1,y1,x2,y2);
    shaft.addColorStop(0,'#c1ded4');shaft.addColorStop(.032,'#f1e1a1');shaft.addColorStop(.36,'#d7ab61');
    shaft.addColorStop(.72,'#9e673c');shaft.addColorStop(1,'#45291d');
    ctx.strokeStyle=shaft;ctx.lineWidth=6;
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
    ctx.strokeStyle='#f1faf6';ctx.lineWidth=7;
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x1-dx*7,y1-dy*7);ctx.stroke();
    ctx.restore();
  }
  function draw(){
    ctx.clearRect(0,0,W,H);drawTable();
    if(game.ballInHand&&ownTurn()){
      const c=cue();ctx.beginPath();ctx.arc(c.x,c.y,R+9,0,Math.PI*2);
      ctx.strokeStyle='#ebf5e9a0';ctx.setLineDash([4,5]);ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);
    }
    for(const b of game.balls)if(b.alive)ballPaint(b);
    if(!moving&&game.winner===null&&cue().alive&&!game.ballInHand&&ownTurn())drawGuide(cue());
  }
  function frame(t){
    if(!lastFrame)lastFrame=t;
    accumulator=Math.min(.08,accumulator+(t-lastFrame)/1000);lastFrame=t;
    let iter=0;while(accumulator>=FIXED&&iter++<12){step(FIXED);accumulator-=FIXED;}
    draw();requestAnimationFrame(frame);
  }
  function canvasPos(event){
    const rect=canvas.getBoundingClientRect();
    return {x:(event.clientX-rect.left)*W/rect.width,y:(event.clientY-rect.top)*H/rect.height};
  }
  canvas.addEventListener('pointerdown',e=>{
    if(!ownTurn()||moving||game.winner!==null)return;
    e.preventDefault();canvas.setPointerCapture(e.pointerId);
    const p=canvasPos(e);
    if(game.ballInHand){handlePlacement(p.x,p.y);return;}
    pointerDown=true;dragOrigin=p;startAngle=aim;
    if(p.x<78&&p.y>815&&p.y<1200){
      dragMode='power';powerSet=0;el('power').value='0';
    }else if(p.x>627&&p.y>830&&p.y<1180){
      dragMode='wheel';
    }else{
      dragMode='aim';
      const dx=p.x-cue().x,dy=p.y-cue().y;
      if(Math.hypot(dx,dy)>25)aim=Math.atan2(dy,dx);
    }
  });
  canvas.addEventListener('pointermove',e=>{
    if(!pointerDown||!canShoot())return;
    const p=canvasPos(e);
    if(dragMode==='power'){
      powerSet=Math.max(0,Math.min(100,(p.y-dragOrigin.y)*.52));
      el('power').value=String(Math.round(powerSet));
      el('powerValue').textContent=Math.round(powerSet)+'%';
    }else if(dragMode==='wheel'){
      aim=startAngle+(p.y-dragOrigin.y)*.0038;
    }else if(dragMode==='aim'){
      const dx=p.x-cue().x,dy=p.y-cue().y;
      if(Math.hypot(dx,dy)>25)aim=Math.atan2(dy,dx);
    }
  });
  canvas.addEventListener('pointerup',()=>{
    if(dragMode==='power'&&canShoot()&&powerSet>=3)fire(aim,powerSet);
    pointerDown=false;dragMode=null;
  });
  canvas.addEventListener('pointercancel',()=>{pointerDown=false;dragMode=null;powerSet=0;el('power').value='0';});
  
  el('power').addEventListener('input',()=>el('powerValue').textContent=el('power').value+'%');
  el('power').addEventListener('change',()=>{if(canShoot()&&Number(el('power').value)>=2)fire(aim,Number(el('power').value));});
  el('shoot').addEventListener('click',()=>fire(aim,Number(el('power').value)));
  el('restart').addEventListener('click',()=>{if(!connected||networkRole==='host')reset();});
  el('mode').addEventListener('change',()=>{if(!connected||networkRole==='host')reset(el('mode').value);});
  el('sound').addEventListener('click',setSound);
  el('place').addEventListener('click',()=>{game.ballInHand=true;toast('Tap an empty spot on the table');});
  window.addEventListener('keydown',e=>{
    if(e.target&&/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
    if(e.key==='ArrowLeft'){aim-=.012;e.preventDefault();}
    if(e.key==='ArrowRight'){aim+=.012;e.preventDefault();}
    if(e.key===' '){e.preventDefault();fire(aim,Number(el('power').value)||55);}
  });
  window.poolApp={useNetwork,leaveNetwork,receive,sendState:broadcastState,toast,reset};
  reset('blackball');requestAnimationFrame(frame);
})();