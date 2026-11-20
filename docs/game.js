(() => {
  'use strict';
  const canvas=document.getElementById('pool'), ctx=canvas.getContext('2d');
  const el=id=>document.getElementById(id);
  const W=1100,H=570,R=11.2, left=117,right=983,top=105,bottom=465;
  const pockets=[[left,top],[550,top],[right,top],[left,bottom],[550,bottom],[right,bottom]];
  const FIXED=1/120, FRICTION=212, RESTITUTION=.965, RAIL=.84;
  let game, aim=0, shot=null, moving=false, accumulator=0,lastFrame=0, pointerDown=false;
  let soundOn=true,audio=null,lastCollision=0,noticeTimer=null;
  let networkRole=null, networkSend=null, connected=false, rackNumber=0, pendingSnapshot=null;
  const rand=(a,b)=>a+Math.random()*(b-a);
  function ball(id,x,y){return {id,x,y,vx:0,vy:0,alive:true};}
  function colorType(id){if(id===0)return 'cue';if(id===8)return 'black';return id<=7?'low':'high';}
  function makeRack(mode='eight'){
    const balls=[ball(0,342,285)];
    const layout=[1,9,2,10,8,3,11,4,12,5,13,6,14,7,15];
    let k=0;
    for(let row=0;row<5;row++){
      for(let n=0;n<=row;n++){
        const id=layout[k++];
        balls.push(ball(id,741+row*(2*R+.40),285+(n-row/2)*(2*R+.40)));
      }
    }
    return {mode,balls,turn:0,groups:[null,null],breakShot:true,winner:null,ballInHand:false,shotCount:0};
  }
  const cue=()=>game.balls[0];
  function reset(mode=el('mode').value){
    rackNumber++;
    game=makeRack(mode);aim=0;moving=false;shot=null;
    el('power').value='0';el('powerValue').textContent='0%';
    el('mode').value=mode;status('Break to start');redrawUI();broadcastState();
  }
  function status(s){el('message').textContent=s;}
  function toast(s,ms=2100){
    const n=el('notice');n.hidden=false;n.textContent=s;clearTimeout(noticeTimer);
    noticeTimer=setTimeout(()=>{n.hidden=true;},ms);
  }
  function ownTurn(){return !connected || (game.turn===(networkRole==='host'?0:1));}
  function canShoot(){return !moving&&!game.winner&&ownTurn()&&!game.ballInHand;}
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
    if(moving||game.winner||game.ballInHand)return;
    if(!remote&&!canShoot())return;
    power=Math.min(100,Math.max(1,Number(power)||0));
    if(power<2){if(!remote)toast('Set power above zero');return;}
    aim=angle;
    shot={owner:!remote,first:null,potted:[],scratch:false,rail:false};
    const c=cue();
    c.vx=Math.cos(aim)*(240+power*8);
    c.vy=Math.sin(aim)*(240+power*8);
    moving=true;game.shotCount++;
    status('Balls in motion');el('power').value='0';el('powerValue').textContent='0%';
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
  function safeCuePosition(x=342,y=285){
    const c=cue();c.alive=true;c.vx=c.vy=0;
    for(let radius=0;radius<180;radius+=18){
      for(let j=0;j<24;j++){
        const t=j*Math.PI/12,nx=Math.max(left+R+2,Math.min(right-R-2,x+Math.cos(t)*radius)),ny=Math.max(top+R+2,Math.min(bottom-R-2,y+Math.sin(t)*radius));
        if(game.balls.every(b=>b===c||!b.alive||Math.hypot(nx-b.x,ny-b.y)>2*R+1)){
          c.x=nx;c.y=ny;return;
        }
      }
    }
    c.x=342;c.y=285;
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
  function roundedRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  function drawTable(){
    ctx.fillStyle='#08110f';ctx.fillRect(0,0,W,H);
    const oak=ctx.createLinearGradient(0,0,0,H);oak.addColorStop(0,'#73452a');oak.addColorStop(.22,'#b47b47');oak.addColorStop(.65,'#59331f');oak.addColorStop(1,'#9e6336');
    roundedRect(36,26,1028,518,45);ctx.fillStyle=oak;ctx.fill();
    roundedRect(47,37,1006,496,34);ctx.strokeStyle='#2b170c';ctx.lineWidth=10;ctx.stroke();
    roundedRect(75,62,950,446,28);ctx.fillStyle='#092e25';ctx.fill();
    const felt=ctx.createRadialGradient(530,240,65,550,300,600);
    felt.addColorStop(0,'#18765d');felt.addColorStop(.6,'#12664e');felt.addColorStop(1,'#073629');
    ctx.fillStyle=felt;ctx.fillRect(left,top,right-left,bottom-top);
    ctx.strokeStyle='#124334';ctx.lineWidth=7;ctx.strokeRect(left-4,top-4,right-left+8,bottom-top+8);
    // six-pocket rail segments and corner caps
    ctx.lineWidth=16;ctx.strokeStyle='#234f34';ctx.lineCap='round';
    const rails=[[[left+33,top],[550-37,top]],[[550+37,top],[right-33,top]],
      [[left+33,bottom],[550-37,bottom]],[[550+37,bottom],[right-33,bottom]],
      [[left,top+34],[left,bottom-34]],[[right,top+34],[right,bottom-34]]];
    rails.forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();});
    pockets.forEach(([x,y],i)=>{
      ctx.fillStyle='#3a2015';ctx.beginPath();ctx.arc(x,y,i===1||i===4?24:26,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#030908';ctx.beginPath();ctx.arc(x,y,i===1||i===4?20:22,0,Math.PI*2);ctx.fill();
    });
    ctx.fillStyle='#a5c7b180';ctx.beginPath();ctx.arc(342,285,3,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(742,285,3,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.strokeStyle='#9bc7ad40';ctx.setLineDash([3,9]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(342,top+8);ctx.lineTo(342,bottom-8);ctx.stroke();ctx.restore();
    ctx.fillStyle='#d9b27c';for(let x=200;x<=900;x+=85){for(const y of [47,523]){ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillRect(-4,-4,8,8);ctx.restore();}}
  }
  function ballPaint(b){
    const x=b.x,y=b.y;
    ctx.fillStyle='#031b16a0';ctx.beginPath();ctx.ellipse(x+4,y+5,R*1.03,R*.72,-.1,0,Math.PI*2);ctx.fill();
    const grad=ctx.createRadialGradient(x-4,y-5,1,x,y,R*1.25);
    const id=b.id;let base;
    if(id===0)base='#f3ece1';
    else if(id===8)base='#13141c';
    else if(game.mode==='blackball')base=id<8?'#d93135':'#e8c231';
    else base=({1:'#f0b521',2:'#276ec9',3:'#cc3532',4:'#6d3f98',5:'#e88429',6:'#2e9a5e',7:'#85262e'})[id<=7?id:id-8];
    grad.addColorStop(0,id===0?'#ffffff':'#fff7d9');
    grad.addColorStop(.28,base);grad.addColorStop(1,'#111a19');
    ctx.fillStyle=grad;ctx.beginPath();ctx.arc(x,y,R,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#0006';ctx.lineWidth=.8;ctx.stroke();
    if(id!==0){
      if(game.mode==='eight'&&id>8){
        ctx.save();ctx.beginPath();ctx.arc(x,y,R-.8,0,Math.PI*2);ctx.clip();
        ctx.fillStyle='#fffbef';ctx.fillRect(x-R,y-4.4,2*R,8.8);ctx.restore();
      }
      ctx.fillStyle='#fff9e8';ctx.beginPath();ctx.arc(x,y,5.2,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#1b2220';ctx.font='bold '+(id>=10?6.6:8)+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(id===8?'8':game.mode==='blackball'?'':String(id),x,y+.3);
    }
    ctx.fillStyle='#fff8';ctx.beginPath();ctx.ellipse(x-4,y-5,2.7,1.5,-.4,0,Math.PI*2);ctx.fill();
  }
  function drawGuide(c){
    const dx=Math.cos(aim),dy=Math.sin(aim);
    // Aim line is clipped at the first encountered object ball.
    let length=720,collision=null;
    for(const b of game.balls){
      if(b.id===0||!b.alive)continue;
      const ox=b.x-c.x,oy=b.y-c.y,project=ox*dx+oy*dy;
      if(project<0)continue;
      const side2=ox*ox+oy*oy-project*project;
      if(side2>(2*R)*(2*R))continue;
      const intercept=project-Math.sqrt(Math.max(0,4*R*R-side2));
      if(intercept>=0&&intercept<length){length=intercept;collision=b;}
    }
    ctx.save();ctx.strokeStyle='#fdfbe9bb';ctx.lineWidth=1.9;ctx.setLineDash([8,8]);
    ctx.beginPath();ctx.moveTo(c.x+dx*(R+4),c.y+dy*(R+4));
    ctx.lineTo(c.x+dx*length,c.y+dy*length);ctx.stroke();ctx.restore();
    if(collision){
      ctx.strokeStyle='#ffffff60';ctx.lineWidth=1.2;
      ctx.beginPath();ctx.arc(c.x+dx*length,c.y+dy*length,R,0,Math.PI*2);ctx.stroke();
    }
    const power=Number(el('power').value);
    const offset=31+power*.6,back=260;
    const x1=c.x-dx*offset,y1=c.y-dy*offset;
    const x2=c.x-dx*(offset+back),y2=c.y-dy*(offset+back);
    ctx.save();ctx.lineCap='round';
    ctx.strokeStyle='#070a09b0';ctx.lineWidth=11;ctx.beginPath();ctx.moveTo(x1+3,y1+3);ctx.lineTo(x2+3,y2+3);ctx.stroke();
    const shaft=ctx.createLinearGradient(x1,y1,x2,y2);
    shaft.addColorStop(0,'#f7e6ba');shaft.addColorStop(.52,'#c89b55');shaft.addColorStop(.53,'#4f352c');shaft.addColorStop(1,'#221d21');
    ctx.strokeStyle=shaft;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
    ctx.strokeStyle='#75b2bb';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x1-dx*7,y1-dy*7);ctx.stroke();
    ctx.restore();
  }
  function draw(){
    ctx.clearRect(0,0,W,H);drawTable();
    if(game.ballInHand&&ownTurn()){
      const c=cue();ctx.beginPath();ctx.arc(c.x,c.y,R+9,0,Math.PI*2);
      ctx.strokeStyle='#ebf5e9a0';ctx.setLineDash([4,5]);ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);
    }
    for(const b of game.balls)if(b.alive)ballPaint(b);
    if(!moving&&!game.winner&&cue().alive&&!game.ballInHand&&ownTurn())drawGuide(cue());
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
    if(!ownTurn()||moving||game.winner)return;
    e.preventDefault();canvas.setPointerCapture(e.pointerId);
    const p=canvasPos(e);
    if(game.ballInHand){handlePlacement(p.x,p.y);return;}
    pointerDown=true;aim=Math.atan2(p.y-cue().y,p.x-cue().x);
  });
  canvas.addEventListener('pointermove',e=>{
    if(!pointerDown||!canShoot())return;
    const p=canvasPos(e);aim=Math.atan2(p.y-cue().y,p.x-cue().x);
  });
  canvas.addEventListener('pointerup',()=>pointerDown=false);
  canvas.addEventListener('pointercancel',()=>pointerDown=false);
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
  reset('eight');requestAnimationFrame(frame);
})();