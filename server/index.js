'use strict';
const http=require('node:http');
const {WebSocketServer,WebSocket}=require('ws');
const port=Number(process.env.PORT)||8080;
const rooms=new Map();
const server=http.createServer((req,res)=>{
  if(req.url==='/health'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({ok:true,rooms:rooms.size}));}
  else{res.writeHead(404);res.end('Not found');}
});
const wss=new WebSocketServer({server,maxPayload:16384,perMessageDeflate:false});
function emit(ws,message){if(ws&&ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(message));}
function clean(ws){
  const room=ws.room;
  if(!room)return;
  if(room.host===ws){room.host=null;emit(room.guest,{type:'peer_left'});}
  if(room.guest===ws){room.guest=null;emit(room.host,{type:'peer_left'});}
  if(!room.host&&!room.guest)rooms.delete(ws.roomCode);
  ws.room=null;ws.roomCode=null;ws.role=null;
}
wss.on('connection',ws=>{
  ws.room=null;ws.role=null;ws.isAlive=true;
  ws.on('pong',()=>ws.isAlive=true);
  ws.on('message',data=>{
    let msg;try{msg=JSON.parse(data.toString('utf8'));}catch(e){return emit(ws,{type:'error',message:'Invalid JSON'});}
    if(!msg||typeof msg!=='object')return;
    if(msg.type==='join'){
      if(ws.room)return emit(ws,{type:'error',message:'Already in a room'});
      const code=String(msg.room||'').toUpperCase();
      if(!/^[A-Z0-9]{3,12}$/.test(code))return emit(ws,{type:'error',message:'Room must be 3–12 letters or digits'});
      let room=rooms.get(code);
      if(msg.create){
        if(room)return emit(ws,{type:'error',message:'Room already exists'});
        room={host:ws,guest:null};rooms.set(code,room);ws.role='host';
      }else{
        if(!room||!room.host)return emit(ws,{type:'error',message:'No host with that room code'});
        if(room.guest)return emit(ws,{type:'error',message:'Room is full'});
        room.guest=ws;ws.role='guest';
      }
      ws.room=room;ws.roomCode=code;
      emit(ws,{type:'joined',role:ws.role,room:code});
      if(room.host&&room.guest){emit(room.host,{type:'ready'});emit(room.guest,{type:'ready'});}
    }else if(msg.type==='payload'){
      if(!ws.room)return emit(ws,{type:'error',message:'Join a room first'});
      const p=msg.data;
      if(!p||typeof p!=='object'||!['state','shot','place'].includes(p.type))return;
      const peer=ws.role==='host'?ws.room.guest:ws.room.host;
      if(peer)emit(peer,{type:'payload',data:p});
    }
  });
  ws.on('close',()=>clean(ws));
  ws.on('error',()=>clean(ws));
});
const heartbeat=setInterval(()=>{
  for(const ws of wss.clients){
    if(!ws.isAlive){ws.terminate();continue;}
    ws.isAlive=false;ws.ping();
  }
},30000);
wss.on('close',()=>clearInterval(heartbeat));
server.listen(port,'0.0.0.0',()=>console.log('8 Ball Pool relay listening on '+port));
