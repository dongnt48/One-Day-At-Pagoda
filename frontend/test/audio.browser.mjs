import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';

test('real music and bell decode, play, mute and resume in the browser',async()=>{
 const server=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:5184,strictPort:true}});
 await server.listen();const browser=await chromium.launch();
 try{
  const page=await browser.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/audio/'))requests.push(r.url());});
  await page.route('**/__audio-check',route=>route.fulfill({contentType:'text/html',body:'<button id="start">Start audio</button>'}));
  await page.goto('http://127.0.0.1:5184/__audio-check');
  await page.evaluate(async()=>{
   const {Ambience}=await import('/src/game/audio.ts');window.ambience=new Ambience();
   document.querySelector('#start').onclick=()=>window.ambience.start(.7);
  });
  assert.equal(requests.length,0,'sound files do not load before the user enables audio');
  await page.locator('#start').click();
  await page.waitForFunction(()=>{const a=window.ambience;return a.music?.currentTime>.2&&a.bellBuffer&&a.ctx.state==='running';},null,{timeout:20000});
  const media=await page.evaluate(()=>{
   const a=window.ambience,data=a.bellBuffer.getChannelData(0);let peak=0,firstSound=-1;
   for(let i=0;i<data.length;i++){peak=Math.max(peak,Math.abs(data[i]));if(firstSound<0&&Math.abs(data[i])>.01)firstSound=i;}
   return {music:a.music.duration,source:new URL(a.music.src).pathname,bell:a.bellBuffer.duration,loop:a.music.loop,peak,onset:firstSound/a.bellBuffer.sampleRate};
  });
  assert.equal(media.source,'/audio/nhac_nen.mp3');assert.ok(Number.isFinite(media.music)&&media.music>60,'background MP3 decodes');assert.ok(Number.isFinite(media.bell)&&media.bell>0,`temple bell decodes (${media.bell}s)`);assert.ok(media.peak>.01,'bell contains recorded audio');assert.equal(media.loop,true);
  await page.evaluate(()=>{
   const a=window.ambience;window.originalMusic=a.music;a.music.currentTime=60;
   window.analyser=a.ctx.createAnalyser();a.gain.connect(window.analyser);a.bell();
  });
  assert.equal(await page.evaluate(()=>window.ambience.voices.size),1);
  await page.waitForFunction(()=>{
   const data=new Float32Array(window.analyser.fftSize);window.analyser.getFloatTimeDomainData(data);
   return data.some(value=>Math.abs(value)>.0001);
  },null,{timeout:5000});
  await page.evaluate(()=>window.ambience.volume(0));
  assert.equal(await page.evaluate(()=>window.ambience.music.paused&&window.ambience.voices.size===0),true);
  await page.locator('#start').click();
  await page.waitForFunction(()=>window.ambience.music.currentTime>60&&!window.ambience.music.paused);
  assert.equal(await page.evaluate(()=>window.ambience.music===window.originalMusic),true,'sound toggle must not create duplicate music players');
  await page.evaluate(()=>window.ambience.stop());assert.equal(await page.evaluate(()=>window.ambience.ctx),null);
  assert.deepEqual(errors,[]);
  console.log(`Decoded meditation ${media.music.toFixed(1)}s, bell ${media.bell.toFixed(2)}s, bell onset ${media.onset.toFixed(3)}s`);
 }finally{await browser.close();await server.close();}
});
