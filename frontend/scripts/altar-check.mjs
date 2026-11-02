import {chromium} from '@playwright/test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const glb=readFileSync(new URL('../public/models/buddha-altar.glb',import.meta.url));
assert.equal(glb.toString('ascii',0,4),'glTF');
const json=JSON.parse(glb.toString('utf8',20,20+glb.readUInt32LE(12)));
assert.equal(json.meshes.length,4);
const triangles=json.meshes.flatMap(m=>m.primitives).reduce((n,p)=>n+json.accessors[p.indices].count/3,0);
assert.ok(triangles<75000,`Too many triangles: ${triangles}`);
assert.ok(glb.length<2_000_000,`Asset too large: ${glb.length}`);
const hall=readFileSync(new URL('../public/models/hall-statue.glb',import.meta.url));
const hallJson=JSON.parse(hall.toString('utf8',20,20+hall.readUInt32LE(12)));
const hallTriangles=hallJson.meshes.flatMap(m=>m.primitives).reduce((n,p)=>n+hallJson.accessors[p.indices].count/3,0);
assert.ok(hallTriangles<60000);
assert.ok(hall.length<3_000_000);
const browser=await chromium.launch();
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  for(const map of ['hall','courtyard','close','robe']){
   await page.goto(`http://localhost:5175/fixtures/${map==='robe'?'robe':'hall'}.html${map==='courtyard'?'?courtyard':map==='close'?'?close':''}`);
   await page.waitForSelector('body[data-ready="true"]',{timeout:60000});
   await page.waitForTimeout(1200);
   await page.screenshot({path:`test-results/altar-${map}-${mobile?'mobile':'desktop'}.png`});
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log(JSON.stringify({courtyardTriangles:triangles,hallTriangles,hallBytes:hall.length,views:8,errors:0}));
}finally{await browser.close();}
