import {writeFileSync,mkdirSync} from 'node:fs';
import {chromium,expect} from '@playwright/test';
mkdirSync('test-results',{recursive:true});
writeFileSync('test-results/crowd.html','<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><div id="root"></div><script type="module" src="/test-results/crowd.tsx"></script></body></html>');
writeFileSync('test-results/crowd.tsx',`
import React from 'react';import{createRoot}from'react-dom/client';import{World}from'/src/game/scene/World';import{lectureSeats}from'/src/game/world';import'/src/app/styles.css';
const players=Array.from({length:lectureSeats.length},(_,i)=>({id:String(i),displayName:'Khách '+(i+1),avatar:i%2?'female':'male',x:i?lectureSeats[i].x:0,y:0,z:i?lectureSeats[i].z:22,rotationY:Math.PI,action:i?'listen':'idle'}));
const room={roomId:'crowd-preview',send:()=>{}};const noop=()=>{};
createRoot(document.getElementById('root')!).render(<div style={{width:'100vw',height:'100dvh'}}><World mapId="hall" room={room as any} players={players as any} me="0" messages={[]} enabled={true} onNearby={noop} onSelect={noop}/></div>);
`);
const browser=await chromium.launch({headless:true,channel:'chromium'}),results=[];
try{
 for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1200,height:800},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.BASE_URL||'http://localhost:5173')+'/test-results/crowd.html');await page.waitForTimeout(5000);
  const frames=await page.evaluate(()=>new Promise(resolve=>{const start=performance.now();let count=0;function frame(){count++;if(performance.now()-start<3000)requestAnimationFrame(frame);else resolve(count);}requestAnimationFrame(frame);}));
  expect(frames).toBeGreaterThan(10);expect(errors).toEqual([]);
  expect(await page.locator('.name-tag').count()).toBeLessThanOrEqual(mobile?12:24);
  await page.screenshot({path:mobile?'test-results/crowd-100-mobile.png':'test-results/crowd-100-desktop.png'});
  results.push({mobile,scenePlayers:50,detailedNameTags:await page.locator('.name-tag').count(),framesInThreeSeconds:frames,note:'Headless Chromium on this computer; not physical mobile FPS.'});await page.close();
 }
 writeFileSync('test-results/crowd-render.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
