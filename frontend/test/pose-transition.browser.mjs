import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';

test('moving during a deep prostration restores upright animated characters',async()=>{
 const server=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:5185,strictPort:true}});
 await server.listen();const browser=await chromium.launch();
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/__pose-check',route=>route.fulfill({contentType:'text/html',body:'<body></body>'}));
  await page.goto('http://127.0.0.1:5185/__pose-check');
  await page.evaluate(async()=>{
   const Refresh=(await import('/@react-refresh')).default;Refresh.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;
   const R=(await import('/node_modules/.vite/deps/react.js')).default,D=(await import('/node_modules/.vite/deps/react-dom_client.js')).default,F=await import('/node_modules/.vite/deps/@react-three_fiber.js'),{Model}=await import('/src/game/characters/Character.tsx');
   const host=document.createElement('div');host.style.cssText='position:fixed;inset:0';document.body.append(host);
   function Actors(){const [action,setAction]=R.useState('prostrate');window.changeAction=setAction;return ['male','female'].map((avatar,i)=>R.createElement('group',{key:avatar,name:avatar,position:[i*2-1,0,0]},R.createElement(Model,{avatar,action,barefoot:true})));}
   function Inspect(){window.scene=F.useThree().scene;return null;}
   D.createRoot(host).render(R.createElement(F.Canvas,{camera:{position:[0,2,5]}},R.createElement('ambientLight',{intensity:2}),R.createElement(R.Suspense,{fallback:null},R.createElement(Actors)),R.createElement(Inspect)));
  });
  await page.waitForFunction(()=>['male','female'].every(name=>Math.abs(window.scene?.getObjectByName(name)?.getObjectByName('Body')?.quaternion.x??0)>.58),null,{timeout:15000});
  await page.evaluate(()=>window.changeAction('walk'));await page.waitForTimeout(350);
  for(let frame=0;frame<8;frame++){
   const poses=await page.evaluate(()=>['male','female'].map(name=>{const model=window.scene.getObjectByName(name);return {body:model.getObjectByName('Body').quaternion.toArray(),root:model.getObjectByName('Root').position.toArray()};}));
   for(const pose of poses){assert.ok(Math.abs(pose.body[0])<.05,'torso must stand upright before walking');assert.ok(Math.abs(pose.root[1])<.001&&Math.abs(pose.root[2])<.001,'no kneeling translation remains');}
   await page.waitForTimeout(100);
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();await server.close();}
});
