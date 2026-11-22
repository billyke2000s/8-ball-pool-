// Phase 27 — music, translated from km / mb / t40 in the recovered app:
//  * one track, "track_1" = res/raw/entertainer.mid, looping (MediaPlayer.setLooping(true));
//  * preference music_track defaults to "off" (t40: getString("music_track","off"));
//  * volume = music_volume / 100, music_volume default 35 (GameActivity: d("music_volume",35));
//  * on resume (v3 case 2) playback continues from the saved position only if it was paused
//    less than 5000 ms ago, otherwise it starts from the beginning.
// Browsers have no General MIDI player, so the file is parsed here and played with a small
// Web Audio piano-like voice. The notes and timing come from the original file; the timbre is
// NOT Android's Sonivox synthesiser and is not claimed to match it.
const NATIVE_MUSIC_VOLUME=35;
function parseMidi(bytes){
 const u8=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
 const str=(p)=>String.fromCharCode(u8[p],u8[p+1],u8[p+2],u8[p+3]);
 const u32=(p)=>((u8[p]<<24)|(u8[p+1]<<16)|(u8[p+2]<<8)|u8[p+3])>>>0;
 const u16=(p)=>(u8[p]<<8)|u8[p+1];
 if(str(0)!=='MThd')throw new Error('Not a MIDI file');
 const tracks=u16(10),division=u16(12);
 if(division&0x8000)throw new Error('SMPTE timing unsupported');
 const events=[];let p=8+u32(4);
 for(let t=0;t<tracks&&p<u8.length;t++){
  if(str(p)!=='MTrk')throw new Error('Bad track');
  const end=p+8+u32(p+4);let i=p+8,tick=0,status=0;
  const vlq=()=>{let v=0,b;do{b=u8[i++];v=(v<<7)|(b&127);}while(b&128&&i<end);return v;};
  while(i<end){
   tick+=vlq();let st=u8[i];
   if(st&0x80){i++;if(st<0xF0)status=st;}else st=status;
   if(st===0xFF){const type=u8[i++],len=vlq();
    if(type===0x51)events.push({tick,type:'tempo',usPerQuarter:(u8[i]<<16)|(u8[i+1]<<8)|u8[i+2]});
    i+=len;
   }else if(st===0xF0||st===0xF7){i+=vlq();}
   else{const hi=st&0xF0,ch=st&15;
    if(hi===0xC0||hi===0xD0){i+=1;}
    else{const a=u8[i],b=u8[i+1];i+=2;
     if(hi===0x90&&b>0)events.push({tick,type:'on',ch,note:a,vel:b});
     else if(hi===0x80||hi===0x90)events.push({tick,type:'off',ch,note:a});
    }
   }
  }
  p=end;
 }
 events.sort((a,b)=>a.tick-b.tick||(a.type==='tempo'?-1:0));
 // Convert ticks to seconds through the tempo map, then pair note on/off.
 let usPerQuarter=500000,lastTick=0,seconds=0;const open=new Map(),notes=[];
 for(const e of events){
  seconds+=(e.tick-lastTick)*usPerQuarter/division/1e6;lastTick=e.tick;
  if(e.type==='tempo'){usPerQuarter=e.usPerQuarter;continue;}
  const key=e.ch*128+e.note;
  if(e.type==='on'){if(!open.has(key))open.set(key,[]);open.get(key).push({start:seconds,note:e.note,vel:e.vel,ch:e.ch});}
  else{const list=open.get(key);if(list&&list.length){const n=list.shift();n.end=seconds;if(n.end>n.start)notes.push(n);}}
 }
 for(const list of open.values())for(const n of list){n.end=seconds;if(n.end>n.start)notes.push(n);}
 notes.sort((a,b)=>a.start-b.start);
 return{notes,duration:seconds};
}
const music={enabled:false,song:null,ctx:null,gain:null,startedAt:0,offset:0,nextIndex:0,
 timer:0,playing:false,pausedAt:0,pausedPosition:0,voices:new Set()};
function musicSong(){
 if(music.song!==null)return music.song;
 try{
  const uri=typeof ORIGINAL_ASSETS==='object'&&ORIGINAL_ASSETS.entertainer;
  if(!uri)return music.song=false;
  const bin=atob(uri.split(',')[1]);const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  music.song=parseMidi(bytes);
 }catch(_error){music.song=false;}
 return music.song;
}
function musicPosition(){return music.playing?music.ctx.currentTime-music.startedAt:music.pausedPosition;}
function musicVoice(n,when){
 const ctx=music.ctx,f=440*Math.pow(2,(n.note-69)/12),len=Math.max(.05,n.end-n.start);
 const env=ctx.createGain(),peak=.22*(n.vel/127);
 env.gain.setValueAtTime(0,when);env.gain.linearRampToValueAtTime(peak,when+.008);
 env.gain.exponentialRampToValueAtTime(peak*.35,when+Math.min(len,.4)+.01);
 env.gain.setTargetAtTime(0,when+len,.08);
 env.connect(music.gain);
 for(const [type,mult,level] of [['triangle',1,1],['sine',2,.25]]){
  const osc=ctx.createOscillator(),g=ctx.createGain();osc.type=type;osc.frequency.value=f*mult;g.gain.value=level;
  osc.connect(g);g.connect(env);osc.start(when);osc.stop(when+len+.5);
  music.voices.add(osc);osc.onended=()=>music.voices.delete(osc);
 }
}
function musicSchedule(){
 const song=music.song;if(!music.playing||!song)return;
 const horizon=music.ctx.currentTime+.4;
 for(;;){
  if(music.nextIndex>=song.notes.length){
   // setLooping(true): next pass starts where this one ends.
   music.startedAt+=song.duration;music.nextIndex=0;
  }
  const n=song.notes[music.nextIndex],when=music.startedAt+n.start;
  if(when>horizon)break;
  if(when>=music.ctx.currentTime-.02)musicVoice(n,Math.max(when,music.ctx.currentTime));
  music.nextIndex++;
 }
}
function musicStart(fromPosition=0){
 const song=musicSong();if(!music.enabled||!song||music.playing)return false;
 try{
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
  if(!music.ctx){music.ctx=new AC();music.gain=music.ctx.createGain();music.gain.connect(music.ctx.destination);}
  music.gain.gain.value=Math.min(Math.max(NATIVE_MUSIC_VOLUME/100,0),1);
  if(music.ctx.state==='suspended')music.ctx.resume().catch(()=>{});
  const pos=fromPosition%song.duration;
  music.startedAt=music.ctx.currentTime+.05-pos;
  music.nextIndex=song.notes.findIndex(n=>n.start>=pos);if(music.nextIndex<0)music.nextIndex=0;
  music.playing=true;musicSchedule();music.timer=setInterval(musicSchedule,100);
  return true;
 }catch(_error){music.playing=false;return false;}
}
function musicStop(remember=true){
 if(!music.playing)return;
 if(remember){music.pausedPosition=musicPosition();music.pausedAt=Date.now();}
 else{music.pausedPosition=0;music.pausedAt=0;}
 music.playing=false;clearInterval(music.timer);music.timer=0;
 for(const osc of music.voices){try{osc.stop();}catch(_error){}}
 music.voices.clear();
}
function musicResume(){
 // v3 case 2: continue only after a short (< 5 s) interruption.
 const recent=music.pausedAt&&Date.now()-music.pausedAt<5000;
 return musicStart(recent?music.pausedPosition:0);
}
function setMusicEnabled(on){
 music.enabled=Boolean(on);
 if(music.enabled){music.pausedAt=0;music.pausedPosition=0;musicStart(0);}else musicStop(false);
 const button=$('musicToggle');if(button)button.textContent='Music: '+(music.enabled?'on':'off');
}
document.addEventListener('visibilitychange',()=>{
 if(!music.enabled)return;if(document.hidden)musicStop(true);else musicResume();
});
// Browsers only allow audio after a user gesture; the first tap starts enabled music.
window.addEventListener('pointerdown',()=>{if(music.enabled&&!music.playing&&!document.hidden)musicResume();},{capture:true});
