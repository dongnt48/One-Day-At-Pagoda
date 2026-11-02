import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';

test('schedule marquee changes on time and fits desktop and small screens',async()=>{
 const server=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:5186,strictPort:true}});
 await server.listen();const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2026-11-01T21:59:59Z')});
  await page.route('**/__schedule-check',route=>route.fulfill({contentType:'text/html',body:'<meta name="viewport" content="width=device-width,initial-scale=1"><body></body>'}));
  await page.goto('http://127.0.0.1:5186/__schedule-check');
  await page.evaluate(async()=>{
   const Refresh=(await import('/@react-refresh')).default;Refresh.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;
   const R=(await import('/node_modules/.vite/deps/react.js')).default,D=(await import('/node_modules/.vite/deps/react-dom_client.js')).default,{ScheduleNotice}=await import('/src/components/ScheduleNotice.tsx');
   const style=document.createElement('style');style.textContent=await(await fetch('/src/app/styles.css?direct')).text();document.head.append(style);
   const main=document.createElement('main');main.className='app playing';document.body.append(main);
   D.createRoot(main).render(R.createElement('header',{className:'topbar'},R.createElement('a',{className:'brand'},R.createElement('svg',{width:29,height:29}),R.createElement('span',null,'MỘT NGÀY ĐI CHÙA')),R.createElement(ScheduleNotice),R.createElement('div',{className:'top-actions'},R.createElement('span',{className:'room-badge'},R.createElement('span',{className:'status-dot'}),R.createElement('span',{className:'room-name'},'Chánh điện · Giảng đường'),R.createElement('i'),R.createElement('span',null,'1/100')),R.createElement('button',{className:'icon-button sound-button'},'♫'))));
  });
  await page.waitForSelector('.schedule-notice');
  await page.clock.runFor(2000);
  assert.match(await page.locator('.schedule-time').textContent(),/05:00–06:00/);
  const before=await page.locator('.schedule-track').evaluate(e=>getComputedStyle(e).transform);
  await page.clock.resume();
  await new Promise(resolve=>setTimeout(resolve,500));
  assert.notEqual(await page.locator('.schedule-track').evaluate(e=>getComputedStyle(e).transform),before,'text scrolls');
  assert.equal(await page.locator('.schedule-track').count(),1);
  await page.locator('.schedule-track').evaluate(e=>e.getAnimations()[0].finish());
  await page.waitForFunction(()=>document.querySelector('.schedule-notice').dataset.resting==='true');
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('.schedule-notice')).opacity==='0');
  assert.equal(await page.locator('.schedule-notice').evaluate(e=>getComputedStyle(e).opacity),'0','notice disappears between passes');
  await page.clock.runFor(8100);
  await page.waitForFunction(()=>document.querySelector('.schedule-notice').dataset.resting==='false');
  await page.evaluate(()=>{const button=document.createElement('button');button.className='chat-show';button.textContent='Chat';document.querySelector('main').append(button);});
  for(const [width,height] of [[1920,1080],[1101,768],[1024,768],[320,568],[400,852],[568,320]]){
   await page.setViewportSize({width,height});
   const notice=await page.locator('.schedule-notice').boundingBox(),chat=await page.locator('.chat-show').boundingBox();
   const badge=await page.locator('.top-actions').boundingBox();
   assert.ok(notice.x+notice.width<=badge.x||notice.y>=badge.y+badge.height,'room controls and notice never overlap');
   assert.ok(notice.x>=0&&notice.x+notice.width<=width&&notice.y+notice.height<=height,'notice fits');
   if(width<=1100)assert.ok(notice.y+notice.height<=chat.y,'chat remains below the notice');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal page overflow');
  }
  await page.setViewportSize({width:1280,height:720});
  await page.screenshot({path:fileURLToPath(new URL('../../schedule-notice-preview.png',import.meta.url))});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.querySelector('.schedule-notice').dataset.reduced==='true');
  assert.equal(await page.locator('.schedule-track').evaluate(e=>e.getAnimations().length),0);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();await server.close();}
});
