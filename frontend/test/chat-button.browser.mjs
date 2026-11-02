import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';

test('closed chat button stays compact beneath the schedule at intermediate desktop widths',async()=>{
 const server=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:5196,strictPort:true}});
 let browser;
 try{
  await server.listen();browser=await chromium.launch();
  for(const [width,height,touch] of [[1080,950,false],[900,800,false],[760,800,false],[390,844,true],[844,390,true],[1400,900,false]]){
   const page=await browser.newPage({viewport:{width,height},hasTouch:touch,isMobile:touch});
   await page.route('**/__chat-size',r=>r.fulfill({contentType:'text/html',body:'<meta name="viewport" content="width=device-width,initial-scale=1"><body></body>'}));
   await page.goto('http://127.0.0.1:5196/__chat-size');
   await page.evaluate(async()=>{
    const style=document.createElement('style');style.textContent=await(await fetch('/src/app/styles.css?direct')).text();document.head.append(style);
    document.body.innerHTML='<main class="app playing"><header class="topbar"><div class="brand">Chùa</div><div class="schedule-notice">Lịch hôm nay</div><div class="top-actions">Sân chùa</div></header><button class="chat-show pill">Mở chat</button></main>';
    document.querySelector('.chat-show').onclick=()=>window.clicked=true;
   });
   const box=await page.locator('.chat-show').boundingBox();
   assert.ok(box.height<=52,`${width}px: chat button stretched to ${box.height}px`);
   assert.ok(box.width<=160&&box.x>=0&&box.y>=0&&box.y+box.height<=height);
   await page.locator('.chat-show').click();assert.equal(await page.evaluate(()=>window.clicked),true);
   await page.close();
  }
 }finally{await browser?.close();await server.close();}
});
