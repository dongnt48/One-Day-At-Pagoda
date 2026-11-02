import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  for(const view of ['pond','garden']){
   await page.goto(`http://localhost:5175/fixtures/nature.html${view==='garden'?'?garden':''}`);
   await page.waitForSelector('body[data-ready="true"]',{timeout:60000});await page.waitForTimeout(1500);
   await page.screenshot({path:`test-results/nature-${view}-${mobile?'mobile':'desktop'}.png`});
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('Pond and garden: 4 desktop/mobile views, no loading or browser errors.');
}finally{await browser.close();}
