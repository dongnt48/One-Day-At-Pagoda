import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';

test('compact controls fit small portrait and landscape viewports and remain tappable',async()=>{
 const server=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:5183,strictPort:true}});
 await server.listen();const browser=await chromium.launch();
 try{
  for(const [width,height,touch] of [[320,568,true],[360,640,true],[400,852,true],[568,320,true],[844,390,true],[360,640,false],[730,900,false]]){
   const page=await browser.newPage({viewport:{width,height},hasTouch:touch,isMobile:touch});
   await page.route('**/__controls-check',route=>route.fulfill({contentType:'text/html',body:'<meta name="viewport" content="width=device-width, initial-scale=1"><body></body>'}));
   await page.goto('http://127.0.0.1:5183/__controls-check');
   await page.evaluate(async()=>{
    const style=document.createElement('style');style.textContent=await(await fetch('/src/app/styles.css?direct')).text();document.head.append(style);
    const icon='<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor"/></svg>';
    document.body.innerHTML='<main class="app playing"><div class="touch-controls"><div class="touch-surface"></div></div><button class="chat-show pill">Mở chat</button><button class="interaction-prompt"><kbd>E</kbd><span class="interaction-label">Nhận cơm chay</span>'+icon.replace('<svg','<svg class="interaction-icon"')+'</button><nav class="game-toolbar">'+['Vẫy tay','Cúi chào','Quỳ xuống','Dừng lạy','Cài đặt'].map(label=>'<button>'+icon+'<span>'+label+'</span><kbd>1</kbd></button>').join('')+'</nav></main>';
    window.clicked=0;document.querySelector('.interaction-prompt').onclick=()=>window.clicked++;
   });
   const geometry=await page.evaluate(()=>{
    const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,right:r.right};};
    return {prompt:rect(document.querySelector('.interaction-prompt')),bar:rect(document.querySelector('.game-toolbar')),buttons:[...document.querySelectorAll('.game-toolbar button')].map(e=>({...rect(e),labelWidth:e.querySelector('span').getBoundingClientRect().width}))};
   });
   assert.ok(geometry.prompt.bottom<=geometry.bar.y-8,`${width}x${height}: prompt is clear of toolbar`);
   for(const rect of [geometry.prompt,geometry.bar])assert.ok(rect.x>=0&&rect.right<=width&&rect.bottom<=height,'controls remain inside the viewport');
   for(const rect of geometry.buttons){assert.ok(rect.w>=44&&rect.h>=44,'comfortable tap targets');assert.ok(rect.labelWidth<=rect.w+1,'labels fit their buttons');}
   if(touch)await page.locator('.interaction-prompt').tap();else await page.locator('.interaction-prompt').click();
   assert.equal(await page.evaluate(()=>window.clicked),1,'touch movement layer must not cover the button');
   await page.evaluate(()=>{
    document.querySelector('.chat-show').remove();
    const chat=document.createElement('section');chat.className='chat-panel';chat.innerHTML='<header class="chat-header"><span>Chuyện trong chùa</span><button>Ẩn</button></header><div class="chat-messages"><p>Một lời chào cùng làm ngày dịu hơn.</p></div><form><input aria-label="Tin nhắn"><button>Gửi</button></form>';
    document.querySelector('main').append(chat);
   });
   const chat=await page.locator('.chat-panel').boundingBox(),prompt=await page.locator('.interaction-prompt').boundingBox();
   assert.ok(chat.y+chat.height<=prompt.y-8,`${width}x${height}: chat must not cover the interaction`);
   const send=await page.locator('.chat-panel form button').boundingBox();assert.ok(send.y+send.height<=chat.y+chat.height+1,JSON.stringify({width,height,chat,send}));
   if(width===730){
    await page.evaluate(async()=>{
     Object.defineProperty(window,'outerHeight',{configurable:true,value:1000});Object.defineProperty(window,'screenY',{configurable:true,value:0});
     Object.defineProperty(window.screen,'availTop',{configurable:true,value:0});Object.defineProperty(window.screen,'availHeight',{configurable:true,value:780});
     const {fitGameViewport}=await import('/src/game/controls/gameViewport.ts');window.stopFitting=fitGameViewport(document.querySelector('main'));
    });
    const bar=await page.locator('.game-toolbar').boundingBox(),prompt=await page.locator('.interaction-prompt').boundingBox();
    assert.ok(bar.y+bar.height<=680,'all gesture buttons fit above the visible screen edge');
    assert.ok(prompt.y+prompt.height<bar.y,'interaction remains above gestures');
    await page.locator('.game-toolbar button').nth(3).click();
    await page.evaluate(()=>window.stopFitting());
   }
   await page.close();
  }
 }finally{await browser.close();await server.close();}
});
