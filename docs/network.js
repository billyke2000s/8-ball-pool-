(() => {
  'use strict';
  const el=id=>document.getElementById(id),app=window.poolApp;
  let socket=null,bluetooth=false,role=null;
  const setStatus=s=>el('connStatus').textContent='● '+s;
  function code(){
    const input=el('room');
    let room=input.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12);
    if(!room){room=Math.random().toString(36).slice(2,8).toUpperCase();input.value=room;}
    return room;
  }
  function teardown(){
    if(socket){const s=socket;socket=null;s.close();}
    if(bluetooth&&window.AndroidBridge){window.AndroidBridge.disconnect();}
    bluetooth=false;role=null;app.leaveNetwork();
  }
  function online(create){
    teardown();
    const address=el('relay').value.trim();
    if(!/^wss?:\/\//i.test(address)){app.toast('Enter a ws:// or wss:// relay URL');return;}
    if(location.protocol==='https:'&&address.startsWith('ws://')){app.toast('HTTPS requires a secure wss:// server');return;}
    const room=code();
    let ws;
    try{ws=new WebSocket(address);}catch(e){app.toast('Invalid relay URL');return;}
    socket=ws;
    setStatus('Connecting to relay…');
    ws.addEventListener('open',()=>{
      ws.send(JSON.stringify({type:'join',room,create}));
    });
    ws.addEventListener('message',ev=>{
      let message;try{message=JSON.parse(ev.data);}catch(e){return;}
      if(message.type==='joined'){
        role=message.role;
        app.useNetwork(role,payload=>{
          if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'payload',data:payload}));
        });
        setStatus('Online room '+room+' • '+(role==='host'?'P1 host':'P2 guest'));
        if(role==='host')app.toast('Room '+room+' created. Share code with your friend.',3300);
      }else if(message.type==='ready'){
        app.toast('Opponent connected • player 1 breaks');
        if(role==='host')app.sendState();
      }else if(message.type==='payload'){
        app.receive(message.data);
      }else if(message.type==='peer_left'){
        app.toast('Opponent disconnected',3200);
        setStatus('Room '+room+' • waiting for player');
      }else if(message.type==='error'){
        app.toast(message.message||'Relay error',3000);
      }
    });
    ws.addEventListener('close',()=>{
      if(socket!==ws)return;
      socket=null;role=null;app.leaveNetwork();setStatus('Disconnected');
    });
    ws.addEventListener('error',()=>app.toast('Unable to reach online relay'));
  }
  function bluetoothMode(host){
    teardown();
    if(!window.AndroidBridge){
      app.toast('Bluetooth requires the Android app. Browsers cannot host RFCOMM.');
      return;
    }
    bluetooth=true;
    setStatus(host?'Waiting for Bluetooth player…':'Choose a paired Bluetooth device…');
    try{if(host)AndroidBridge.host();else AndroidBridge.join();}
    catch(e){app.toast('Bluetooth could not start');teardown();}
  }
  // Called by the Java Android app via evaluateJavascript after Bluetooth connects.
  window.poolBluetoothStatus=(status,message)=>{
    if(status==='host'||status==='guest'){
      role=status;
      app.useNetwork(role,payload=>{
        try{AndroidBridge.send(JSON.stringify(payload));}catch(e){app.toast('Bluetooth send failed');}
      });
      setStatus('Bluetooth connected • '+(role==='host'?'Player 1':'Player 2'));
      app.toast('Bluetooth opponent connected');
      if(role==='host')app.sendState();
    }else if(status==='disconnected'){
      bluetooth=false;role=null;app.leaveNetwork();setStatus('Bluetooth disconnected');
    }else if(status==='error')app.toast(message||'Bluetooth connection failed',3400);
    else if(status==='waiting')setStatus(message||'Waiting for Bluetooth peer…');
  };
  window.poolBluetoothReceive=str=>{
    try{const data=JSON.parse(str);app.receive(data);}catch(e){console.warn('Invalid Bluetooth message');}
  };
  el('onlineHost').addEventListener('click',()=>online(true));
  el('onlineJoin').addEventListener('click',()=>online(false));
  el('btHost').addEventListener('click',()=>bluetoothMode(true));
  el('btJoin').addEventListener('click',()=>bluetoothMode(false));
  el('disconnect').addEventListener('click',teardown);
  el('btHint').textContent=window.AndroidBridge?'Paired devices are shown by Android.':'Install the Android app on both phones to enable Bluetooth.';
  el('room').value=Math.random().toString(36).slice(2,8).toUpperCase();
})();