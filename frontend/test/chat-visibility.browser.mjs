import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';

test('closing the chat panel does not hide incoming messages from the world',async()=>{
 const server=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:5189,strictPort:true}});
 await server.listen();const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:730,height:900}});
  await page.addInitScript(()=>localStorage.setItem('pagoda-chat','false'));
  await page.route('**/src/game/scene/World.tsx*',r=>r.fulfill({contentType:'application/javascript',body:`import React from '/node_modules/.vite/deps/react.js'; export function World({messages}){return React.createElement('div',{'data-testid':'world-chat'},messages.map(m=>React.createElement('span',{key:m.id},m.text)));}`}));
  await page.route('**/src/game/characters/Character.tsx*',r=>r.fulfill({contentType:'application/javascript',body:'export function Model(){return null;}'}));
  await page.route('**/src/game/audio.ts*',r=>r.fulfill({contentType:'application/javascript',body:'export class Ambience {start(){} stop(){} volume(){} step(){} bell(){}}'}));
  await page.route('**/src/game/multiplayer/client.ts*',r=>r.fulfill({contentType:'application/javascript',body:`
   const handlers={};const guest={id:'self',display_name:'Tester',avatar:'male'};
   const room={roomId:'test',reconnection:{},onMessage:(type,fn)=>{handlers[type]=fn;return ()=>{};},onError(){},onDrop(){},onReconnect(){},onLeave(){},leave:async()=>{},send(type){if(type==='resync')handlers.state({players:[{id:'self',displayName:'Tester',avatar:'male',x:0,y:0,z:11,rotationY:0,action:'idle'}],capacity:100,mapId:'courtyard'});}};
   window.receiveChat=m=>handlers.chat_message(m);export const client={};
   export async function api(path,body){if(path==='me')return {guest:null};if(path==='guest'){window.submittedGuest=body;return {guest:{...guest,display_name:body.displayName}};}return {friends:[],requests:[],sent:[],blocks:[]};}
   export async function enterRoom(){return room;}
  `}));
  await page.goto('http://127.0.0.1:5189');await page.locator('.enter').click();
  assert.match(await page.locator('#display-name').inputValue(),/\S.+ \d{3}$/,'new visitors receive a suggested name');
  await page.locator('#display-name').fill('Tester');await page.locator('.entry-card button[type="submit"],.entry-card .primary').click();
  await page.locator('.chat-show').waitFor();
  assert.equal(await page.evaluate(()=>window.submittedGuest.displayName),'Tester','players can replace the suggestion before joining');
  await page.evaluate(()=>window.receiveChat({id:'hello',playerId:'other',name:'Friend',text:'Hello from the other player',at:Date.now()}));
  await page.waitForFunction(()=>document.querySelector('[data-testid="world-chat"]').textContent.includes('Hello from the other player'),null,{timeout:3000});
  assert.equal(await page.locator('.chat-panel').count(),0,'receiving messages does not force the panel open');
  await page.locator('.chat-show').click();
  assert.match(await page.locator('.chat-messages').textContent(),/Hello from the other player/);
  const sizes=await page.locator('.chat-messages p').evaluate(p=>({text:parseFloat(getComputedStyle(p).fontSize),name:parseFloat(getComputedStyle(p.querySelector('button')).fontSize)}));
  assert.ok(sizes.text>=14&&sizes.name>=14,'chat text and sender names remain legible');
 }finally{await browser.close();await server.close();}
});
