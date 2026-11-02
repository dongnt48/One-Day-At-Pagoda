import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Ambience,AUDIO_ASSETS} from '../src/game/audio.ts';

function mockAudio(t,{pending=false}={}){
 const original={Audio:globalThis.Audio,AudioContext:globalThis.AudioContext,fetch:globalThis.fetch};
 const elements=[],contexts=[],requests=[];let resolveRequest;
 const node=()=>({connect(){return this;},disconnect(){}});
 globalThis.Audio=class{
  paused=true;currentTime=0;loop=false;preload='';plays=0;
  constructor(src){this.src=src;elements.push(this);}
  play(){this.paused=false;this.plays++;return Promise.resolve();}
  pause(){this.paused=true;}
  removeAttribute(){this.src='';}
  load(){}
 };
 globalThis.AudioContext=class{
  state='suspended';currentTime=0;destination={};sources=[];oscillators=0;
  constructor(){contexts.push(this);}
  createGain(){return {...node(),gain:{value:1,setTargetAtTime(value){this.value=value;},setValueAtTime(value){this.value=value;},exponentialRampToValueAtTime(){}}};}
  createMediaElementSource(){return node();}
  createBufferSource(){const source={...node(),stopped:false,start(){},stop(){this.stopped=true;this.onended?.();}};this.sources.push(source);return source;}
  decodeAudioData(){return Promise.resolve({duration:11.428});}
  resume(){this.state='running';return Promise.resolve();}
  close(){this.state='closed';return Promise.resolve();}
  createOscillator(){this.oscillators++;return {...node(),frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},start(){},stop(){}};}
 };
 globalThis.fetch=(url)=>{requests.push(url);return pending?new Promise(resolve=>{resolveRequest=resolve;}):Promise.resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});};
 t.after(()=>{Object.assign(globalThis,original);});
 return {elements,contexts,requests,resolve:()=>resolveRequest?.({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)})};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('recorded meditation streams in a single looping player and only loads after sound is enabled',async t=>{
 const mock=mockAudio(t),audio=new Ambience();t.after(()=>audio.stop());
 audio.volume(.5);assert.equal(mock.elements.length,0);
 audio.start(.5);audio.start(.7);await flush();
 assert.equal(mock.elements.length,1);assert.equal(mock.elements[0].src,AUDIO_ASSETS.music);assert.equal(mock.elements[0].loop,true);assert.equal(mock.elements[0].paused,false);
 assert.deepEqual(mock.requests,[AUDIO_ASSETS.bell],'only the short bell sample is decoded into memory');
});
test('bell uses the real sample, rings over music, and mute stops it immediately',async t=>{
 const mock=mockAudio(t),audio=new Ambience();t.after(()=>audio.stop());
 audio.start(.6);await flush();audio.bell();audio.bell();await flush();
 assert.equal(mock.contexts[0].sources.length,2);assert.equal(mock.contexts[0].sources[0].buffer.duration,11.428);assert.equal(mock.contexts[0].oscillators,0,'bell must not be synthesized');
 mock.elements[0].currentTime=100;audio.volume(0);
 assert.equal(mock.elements[0].paused,true);assert.ok(mock.contexts[0].sources.every(s=>s.stopped));audio.bell();assert.equal(mock.contexts[0].sources.length,2);
 audio.start(.8);assert.equal(mock.elements[0].currentTime,100,'unmuting resumes the same music');assert.equal(mock.elements[0].paused,false);
});
test('stopping during a pending sample download cannot play a late bell',async t=>{
 const mock=mockAudio(t,{pending:true}),audio=new Ambience();
 audio.start(.5);audio.bell();audio.stop();mock.resolve();await flush();
 assert.equal(mock.contexts[0].state,'closed');assert.equal(mock.contexts[0].sources.length,0);assert.equal(mock.elements[0].paused,true);
});
