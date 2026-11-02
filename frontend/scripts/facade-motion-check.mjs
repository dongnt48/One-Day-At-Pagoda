import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:5175/fixtures/hall.html?courtyard&motion');
 await page.waitForSelector('body[data-ready="true"]',{timeout:60000});
 for(let i=0;i<3;i++){
  await page.waitForTimeout(1500);
  await page.screenshot({path:`test-results/facade-motion-${i}.png`});
 }
 assert.deepEqual(errors,[]);
 console.log('Moving courtyard camera: three views captured, no browser errors.');
}finally{await browser.close();}
