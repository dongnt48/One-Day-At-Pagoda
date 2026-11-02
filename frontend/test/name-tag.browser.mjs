import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';

test('name tag matches the rendered character and camera on every moving frame',async()=>{
 const server=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:5181,strictPort:true}});
 await server.listen();const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:900,height:650}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>errors.push(`${r.url()}: ${r.failure()?.errorText}`));
  await page.route('**/__name-check',route=>route.fulfill({contentType:'text/html',body:'<html><body></body></html>'}));
  await page.goto('http://127.0.0.1:5181/__name-check');
  await page.evaluate(async()=>{
   const Refresh=(await import('/@react-refresh')).default;Refresh.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;
   const R=(await import('/node_modules/.vite/deps/react.js')).default,D=(await import('/node_modules/.vite/deps/react-dom_client.js')).default,F=await import('/node_modules/.vite/deps/@react-three_fiber.js');
   const {Character}=await import('/src/game/characters/Character.tsx'),{Controller}=await import('/src/game/controls/Controller.tsx'),{Vector3}=await import('/node_modules/.vite/deps/three.js');
   const host=document.createElement('div');host.style.cssText='position:fixed;inset:0';document.body.replaceChildren(host);window.samples=[];
   const player={id:'test',displayName:'Moving Player',avatar:'male',x:0,z:11,rotationY:0,action:'walk'};
   const other={...player,id:'other',displayName:'Other Player',x:3,z:8,action:'idle'};
   const room={roomId:'test',send:()=>{}},touchInput={current:{x:0,z:0,lookX:0,lookY:0,zoom:0}};
   function Motion(){F.useFrame(({clock})=>{const t=clock.elapsedTime;player.x=Math.sin(t*2)*3;player.z=11+Math.cos(t*2);touchInput.current.lookX+=2;},-3);return null;}
   function Probe(){F.useFrame(({scene,camera,size,gl,clock})=>{
    window.probeFrames=(window.probeFrames??0)+1;
    const character=scene.getObjectByName('test-character')?.children[0];
    if(character&&clock.elapsedTime>1){
     const wrapper=host.querySelector('div[style*="transform-origin"]');
     if(wrapper){camera.updateMatrixWorld();character.updateWorldMatrix(true,false);const point=character.localToWorld(new Vector3(0,1.95,0)).project(camera),matrix=new DOMMatrix(wrapper.style.transform);
      window.samples.push(Math.hypot(matrix.e-(point.x+1)*size.width/2,matrix.f-(1-point.y)*size.height/2));}
    }
    gl.render(scene,camera);
   },1);return null;}
   D.createRoot(host).render(R.createElement(F.Canvas,{camera:{position:[0,5,25],fov:42},dpr:1},R.createElement('ambientLight',{intensity:2}),R.createElement(R.Suspense,{fallback:null},R.createElement(Motion),R.createElement('group',{name:'test-character'},R.createElement(Character,{player:other,self:false,onSelect:()=>{}})),R.createElement(Controller,{player,room,mapId:'courtyard',enabled:true,touchInput,onNearby:()=>{}}),R.createElement(Probe))));
  });
  try{await page.waitForFunction(()=>window.samples?.length>=35,null,{timeout:15000});}
  catch(error){throw new Error(JSON.stringify({errors,state:await page.evaluate(()=>({frames:window.probeFrames,samples:window.samples?.length,tag:!!document.querySelector('.name-tag'),body:document.body.innerHTML.slice(0,1200)}))}),{cause:error});}
  const samples=await page.evaluate(()=>window.samples.slice(-30));
  assert.deepEqual(errors,[]);assert.ok(Math.max(...samples)<.1,`name tag drifts by ${Math.max(...samples).toFixed(2)} pixels from the current rendered frame`);
 }finally{await browser.close();await server.close();}
});
