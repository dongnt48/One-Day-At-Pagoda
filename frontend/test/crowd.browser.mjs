import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';

test('distant male and female companions retain the original models and animated limbs',async()=>{
 const server=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:5188,strictPort:true}});
 await server.listen();const browser=await chromium.launch();
 try{
  const page=await browser.newPage();
  await page.route('**/__crowd-check',r=>r.fulfill({contentType:'text/html',body:'<body></body>'}));
  await page.goto('http://127.0.0.1:5188/__crowd-check');
  await page.evaluate(async()=>{
   const Refresh=(await import('/@react-refresh')).default;Refresh.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;
   const R=(await import('/node_modules/.vite/deps/react.js')).default,D=(await import('/node_modules/.vite/deps/react-dom_client.js')).default,F=await import('/node_modules/.vite/deps/@react-three_fiber.js'),{Crowd}=await import('/src/game/characters/Crowd.tsx'),{Model}=await import('/src/game/characters/Character.tsx');
   const host=document.createElement('div');host.style.cssText='position:fixed;inset:0';document.body.append(host);
   function Inspect(){const state=F.useThree();window.scene=state.scene;window.camera=state.camera;return null;}
   const players=['male','female'].map((avatar,i)=>({id:avatar,avatar,displayName:avatar,x:i*2,y:0,z:0,rotationY:0,action:'walk'}));
   function Companions(){const [bubbles,setBubbles]=R.useState(new Map());window.setBubbles=setBubbles;return R.createElement(Crowd,{players,bubbles,barefoot:true,onSelect:()=>{}});}
   const style=document.createElement('style');style.textContent=await(await fetch('/src/app/styles.css?direct')).text();document.head.append(style);
   D.createRoot(host).render(R.createElement(F.Canvas,{camera:{position:[2,3,7]}},R.createElement('ambientLight',{intensity:2}),R.createElement(R.Suspense,{fallback:null},R.createElement(Companions),...players.map(p=>R.createElement('group',{name:'reference-'+p.avatar,key:p.id,position:[p.x,0,-3]},R.createElement(Model,{avatar:p.avatar})))),R.createElement(Inspect)));
  });
  await page.waitForFunction(()=>['male','female'].every(id=>window.scene?.getObjectByName('character-'+id)?.getObjectByName('LeftHand')),null,{timeout:15000});
  const models=await page.evaluate(()=>['male','female'].map(id=>{
   const actual=window.scene.getObjectByName('character-'+id),reference=window.scene.getObjectByName('reference-'+id),a=[],b=[];
   actual.traverse(o=>{if(o.isSkinnedMesh)a.push(o);});reference.traverse(o=>{if(o.isSkinnedMesh)b.push(o);});
   return {id,count:a.length,referenceCount:b.length,sameGeometry:a.every((m,i)=>m.geometry===b[i].geometry&&m.material===b[i].material),ownSkeleton:a.every((m,i)=>m.skeleton!==b[i].skeleton),limbs:['LeftArm','RightArm','LeftHand','RightHand','LeftFoot','RightFoot'].every(name=>!!actual.getObjectByName(name)),barefoot:a.filter(m=>/sandal/i.test(m.material.name)).every(m=>!m.visible)};
  }));
  for(const model of models){assert.ok(model.count>0);assert.equal(model.count,model.referenceCount);assert.equal(model.sameGeometry,true,'identical original appearance');assert.equal(model.ownSkeleton,true,'independent animation');assert.equal(model.limbs,true);assert.equal(model.barefoot,true);}
  const arm=()=>page.evaluate(()=>window.scene.getObjectByName('character-male').getObjectByName('LeftArm').quaternion.toArray());
  const before=await arm();await page.waitForTimeout(250);assert.notDeepEqual(await arm(),before,'walking animation plays at distance');
  assert.equal(await page.locator('.name-tag').count(),0,'distant labels stay hidden');
  await page.evaluate(()=>window.setBubbles(new Map([['male','Hello from far away']])));
  await page.locator('.bubble').waitFor();
  assert.equal(await page.locator('.bubble').textContent(),'Hello from far away');
  assert.match(await page.locator('.name-tag').textContent(),/male/,'sender name accompanies distant chat');
  const shortName=await page.locator('.name-tag').boundingBox();
  await page.evaluate(()=>window.setBubbles(new Map([['male','A longer chat message that wraps onto several lines and must never move the player name down towards the character.']])));
  await page.waitForFunction(()=>document.querySelector('.bubble').textContent.startsWith('A longer'));
  const longName=await page.locator('.name-tag').boundingBox();
  assert.ok(Math.abs(shortName.y-longName.y)<1,'name remains fixed when bubble height changes');
  const labelStyle=await page.locator('.name-tag').evaluate(e=>{const s=getComputedStyle(e);return {background:s.backgroundColor,shadow:s.boxShadow};});
  assert.equal(labelStyle.background,'rgba(0, 0, 0, 0)');assert.equal(labelStyle.shadow,'none');
  for(const position of [[2,3,7],[25,18,30]]){
   await page.evaluate(position=>{window.camera.position.set(...position);window.camera.lookAt(0,1,0);},position);
   await page.waitForTimeout(150);
   const sizes=await page.locator('.overhead').evaluate(e=>[...e.children].map(child=>({font:parseFloat(getComputedStyle(child).fontSize),scale:child.getBoundingClientRect().height/child.offsetHeight})));
   for(const size of sizes){assert.ok(size.font>=14);assert.ok(Math.abs(size.scale-1)<.02,'text stays readable in screen pixels at every distance');}
  }
 }finally{await browser.close();await server.close();}
});
