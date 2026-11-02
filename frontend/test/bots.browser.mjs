import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {mkdirSync} from 'node:fs';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {Client} from '@colyseus/sdk';

test('NPCs render in the game but human counts and social list stay honest',{timeout:60000},async()=>{
 const backend=spawn(process.execPath,['--import','tsx','src/server.ts'],{cwd:fileURLToPath(new URL('../../backend',import.meta.url)),env:{...process.env,NODE_ENV:'test',PUBLIC_ORIGIN:'http://127.0.0.1:5189',PORT:'2581',DATABASE_PATH:':memory:',BOT_COUNT:'20'},stdio:'pipe'});
 let logs='';backend.stderr.on('data',b=>logs+=b);backend.stdout.on('data',b=>logs+=b);
 let vite,browser,peer;
 try{
  let ready=false;
  for(let i=0;i<80;i++){try{if((await fetch('http://127.0.0.1:2581/api/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
  assert.ok(ready,logs);
  vite=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:5189,strictPort:true,proxy:{'/api':'http://127.0.0.1:2581','/matchmake':'http://127.0.0.1:2581','/realtime':{target:'ws://127.0.0.1:2581',ws:true,rewrite:p=>p.replace(/^\/realtime/,'')}}}});
  await vite.listen();browser=await chromium.launch({args:['--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5189');
  await page.getByRole('button',{name:'Vào chùa',exact:true}).click();
  await page.getByLabel('Tên của bạn').fill('Khách Kiểm Tra');
  await page.getByRole('button',{name:'Bắt đầu',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.room-badge')?.textContent.includes('6 khách viếng'),null,{timeout:20000});
  await page.getByRole('dialog',{name:'Một chút hướng dẫn trước khi đi dạo'}).waitFor();
  await page.getByRole('button',{name:'Mình hiểu rồi, đi dạo thôi'}).click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('pagoda-movement-guide-v1')),'true');
  assert.match(await page.locator('.room-badge').textContent(),/1\/100.*6 khách viếng/);
  await page.locator('.name-tag').filter({hasText:'An Nhiên'}).first().waitFor({timeout:20000});
  await page.locator('.name-tag').filter({hasText:'An Nhiên'}).first().dispatchEvent('click');
  assert.equal(await page.locator('.dialog').count(),0,'NPC selection does not open social actions');
  const guest=await fetch('http://127.0.0.1:2581/api/guest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({displayName:'Người Thật Hai',avatar:'female'})});
  const ticket=await fetch('http://127.0.0.1:2581/api/ticket',{method:'POST',headers:{'Content-Type':'application/json',Cookie:guest.headers.get('set-cookie').split(';')[0]},body:'{}'}).then(r=>r.json());
  peer=await new Client('http://127.0.0.1:2581').joinOrCreate('public_temple',{ticket:ticket.ticket});
  for(const type of ['state','state_patch','quest_state','quest_progress','quest_reward'])peer.onMessage(type,()=>{});
  await page.locator('.name-tag').filter({hasText:'Người Thật Hai'}).dispatchEvent('click');
  await page.locator('.dialog').waitFor();
  assert.equal(await page.locator('.person-row').count(),2);
  assert.ok(!(await page.locator('.social-scroll').textContent()).includes('An Nhiên'));
  await page.keyboard.press('Escape');
  mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/bots-courtyard.png'});
  assert.deepEqual(errors,[]);
 }catch(error){
  console.error(error);
  throw error;
 }finally{
  if(peer)await Promise.race([peer.leave().catch(()=>{}),new Promise(r=>setTimeout(r,1000))]);
  await browser?.close();
  if(backend.exitCode===null){const exited=new Promise(r=>backend.once('exit',r));backend.kill();await exited;}
  await vite?.close();
 }
});
