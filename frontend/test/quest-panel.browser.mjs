import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {quests,funTitles} from '../../backend/src/quests/catalog.ts';

test('all 300 permanent quests are searchable and fun titles can be equipped without spending merit',async()=>{
 const server=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:5190,strictPort:true}});
 await server.listen();const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:960,height:800}});
  await page.route('**/__quests-check',r=>r.fulfill({contentType:'text/html',body:'<meta name="viewport" content="width=device-width, initial-scale=1"><body></body>'}));
  await page.goto('http://127.0.0.1:5190/__quests-check');
  await page.evaluate(async data=>{
   const Refresh=(await import('/@react-refresh')).default;Refresh.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;
   const R=(await import('/node_modules/.vite/deps/react.js')).default,D=(await import('/node_modules/.vite/deps/react-dom_client.js')).default,{QuestPanel}=await import('/src/components/QuestPanel.tsx');
   const style=document.createElement('style');style.textContent=await(await fetch('/src/app/styles.css?direct')).text();document.head.append(style);
   const host=document.createElement('main');host.className='app playing';document.body.append(host);
   function Harness(){const [state,setState]=R.useState(data);return R.createElement(QuestPanel,{data:state,onClose:()=>{},onRetry:()=>{},onEquip:id=>{window.equipped=id;setState(s=>({...s,profile:{...s.profile,titleId:id}}));}});}
   D.createRoot(host).render(R.createElement(Harness));
  },{catalog:quests,titles:funTitles,profile:{counts:{bows:9},completed:[],merit:150,titleId:null,revision:1}});
  await page.waitForSelector('.quest-card');assert.equal(await page.locator('.quest-card').count(),24);
  assert.match(await page.locator('.quest-status-filter').textContent(),/300/);
  await page.locator('.quest-filters select').selectOption('Lạy');assert.equal(await page.locator('.quest-card').count(),20);
  assert.match(await page.locator('.quest-card').first().textContent(),/3 \/ 3/);
  await page.locator('.quest-filters select').selectOption('Rửa chén');assert.equal(await page.locator('.quest-card').count(),20);
  await page.locator('.quest-tabs button').nth(1).click();assert.equal(await page.locator('.quest-title-card').count(),12);
  assert.equal(await page.locator('.quest-title-card').last().isDisabled(),true);
  await page.locator('.quest-title-card').nth(2).click();assert.equal(await page.evaluate(()=>window.equipped),'broom');assert.equal(await page.locator('.merit-total').textContent(),'150');
  for(const [width,height] of [[320,568],[400,852],[568,320]]){
   await page.setViewportSize({width,height});const dialog=await page.locator('.dialog').boundingBox();
   assert.ok(dialog.x>=0&&dialog.x+dialog.width<=width+1&&dialog.y>=0&&dialog.y+dialog.height<=height,JSON.stringify({width,height,dialog}));
   assert.equal(await page.locator('.dialog').evaluate(e=>e.scrollWidth<=e.clientWidth),true,'no horizontal overflow');
  }
  await page.setViewportSize({width:960,height:800});
  await page.screenshot({path:fileURLToPath(new URL('../../quests-preview.png',import.meta.url))});
 }finally{await browser.close();await server.close();}
});
