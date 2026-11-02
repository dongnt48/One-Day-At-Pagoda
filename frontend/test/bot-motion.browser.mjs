import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';

test('rendered NPC keeps its position and model while near/far detail changes',{timeout:45000},async()=>{
 const server=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:5194,strictPort:true}});
 let browser;
 try{
  await server.listen();browser=await chromium.launch({args:['--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:800,height:600}}),errors=[];
  page.on('pageerror',e=>errors.push(e.stack||e.message));
  await page.route('**/__bot-motion',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0"></body>'}));
  await page.goto('http://127.0.0.1:5194/__bot-motion');
  await page.evaluate(async()=>{
   const Refresh=(await import('/@react-refresh')).default;Refresh.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;
   const R=(await import('/node_modules/.vite/deps/react.js')).default,D=(await import('/node_modules/.vite/deps/react-dom_client.js')).default,F=await import('/node_modules/.vite/deps/@react-three_fiber.js');
   const {Crowd}=await import('/src/game/characters/Crowd.tsx');
   const host=document.createElement('div');host.style.cssText='position:fixed;inset:0';document.body.append(host);
   window.motionSamples=[];
   function Probe(){
    const previous=R.useRef(null);
    F.useFrame(({scene},dt)=>{
     const character=scene.getObjectByName('character-bot');if(!character?.children[0]?.children[0])return;
     const current={x:character.position.x,z:character.position.z,root:character.uuid,model:character.children[0].children[0].uuid};
     if(previous.current)window.motionSamples.push({...current,dt,distance:Math.hypot(current.x-previous.current.x,current.z-previous.current.z)});
     previous.current=current;
    },-.1);return null;
   }
   function Visitors(){
    const [player,setPlayer]=R.useState({id:'bot',displayName:'NPC',avatar:'male',x:0,y:0,z:0,rotationY:0,action:'walk',isBot:true});
    const [detailed,setDetailed]=R.useState(true);
    window.updateVisitor=(position,detail)=>{setPlayer(p=>({...p,...position}));setDetailed(detail);};
    return R.createElement(Crowd,{players:[player],onSelect:()=>{},detailedIds:new Set(detailed?['bot']:[])});
   }
   D.createRoot(host).render(R.createElement(F.Canvas,{camera:{position:[0,5,15]}},R.createElement('ambientLight',{intensity:2}),R.createElement(R.Suspense,{fallback:null},R.createElement(Visitors),R.createElement(Probe))));
  });
  await page.waitForFunction(()=>window.motionSamples.length>=8,null,{timeout:20000});
  for(const detail of [false,true,false,true]){
   const before=await page.evaluate(detail=>{window.updateVisitor({x:12,z:-10},detail);return window.motionSamples.length;},detail);
   await page.waitForFunction(n=>window.motionSamples.length>=n+8,before);
  }
  const samples=await page.evaluate(()=>window.motionSamples);
  assert.deepEqual(errors,[]);
  assert.equal(new Set(samples.map(s=>s.root)).size,1,'detail changes must preserve the rendered transform');
  assert.equal(new Set(samples.map(s=>s.model)).size,1,'detail changes must preserve the skeleton and animation mixer');
  assert.ok(samples.some(s=>s.distance>0));
  for(const s of samples)assert.ok(s.distance<=3*Math.min(s.dt,.25)+1e-6,JSON.stringify(s));
 }finally{await browser?.close();await server.close();}
});
