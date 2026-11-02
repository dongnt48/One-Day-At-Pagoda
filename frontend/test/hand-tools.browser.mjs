import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';

test('watering can and broom follow animated wrists without stretching the straw',async()=>{
 const server=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:5182,strictPort:true}});
 await server.listen();const browser=await chromium.launch();
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/__tools-check',route=>route.fulfill({contentType:'text/html',body:'<html><body></body></html>'}));
  await page.goto('http://127.0.0.1:5182/__tools-check');
  await page.evaluate(async()=>{
   const Refresh=(await import('/@react-refresh')).default;Refresh.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;
   const R=(await import('/node_modules/.vite/deps/react.js')).default,D=(await import('/node_modules/.vite/deps/react-dom_client.js')).default,F=await import('/node_modules/.vite/deps/@react-three_fiber.js');
   const {Model}=await import('/src/game/characters/Character.tsx'),{Vector3}=await import('/node_modules/.vite/deps/three.js');window.Vector3=Vector3;
   const host=document.createElement('div');host.style.cssText='position:fixed;inset:0';document.body.append(host);
   function Inspect(){window.scene=F.useThree().scene;return null;}
   const models=['male','female'].flatMap((avatar,i)=>['water','sweep'].map((action,j)=>R.createElement('group',{key:avatar+action,name:avatar+action,position:[i*2,0,j*2]},R.createElement(Model,{avatar,action}))));
   D.createRoot(host).render(R.createElement(F.Canvas,null,R.createElement('ambientLight',{intensity:2}),R.createElement(R.Suspense,{fallback:null},...models),R.createElement(Inspect)));
  });
  await page.waitForFunction(()=>window.scene?.getObjectByName('femalesweep')?.getObjectByName('held-straw-broom'));await page.waitForTimeout(200);
  for(let frame=0;frame<8;frame++){
   const samples=await page.evaluate(()=>['male','female'].flatMap(avatar=>['water','sweep'].map(action=>{
    const model=window.scene.getObjectByName(avatar+action),tool=model.getObjectByName(action==='water'?'held-watering-can':'held-straw-broom');
    const grip=tool.parent.getWorldPosition(new window.Vector3()),hand=model.getObjectByName('RightHand').getWorldPosition(new window.Vector3());
    return {error:grip.distanceTo(hand),headScale:action==='sweep'?model.getObjectByName('broom-straw-head').scale.toArray():null};
   })));
   for(const sample of samples){assert.ok(sample.error<.001,'tools must follow the current animated wrist');if(sample.headScale)assert.deepEqual(sample.headScale,[1,1,1]);}
   await page.waitForTimeout(100);
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();await server.close();}
});
