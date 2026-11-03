import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';

test('movement guide adapts to desktop and touch and can be dismissed',{timeout:30000},async()=>{
 const vite=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:5195,strictPort:true}});
 let browser;
 try{
  await vite.listen();browser=await chromium.launch();
  for(const [width,height,touch,visibleHeight] of [[1000,800,false,800],[390,844,true,844],[320,568,true,568],[568,320,true,320],[740,360,false,360],[900,800,false,300]]){
   const context=await browser.newContext({hasTouch:touch,isMobile:touch,viewport:{width,height}});
   const page=await context.newPage();
   await page.route('**/__guide',r=>r.fulfill({contentType:'text/html',body:'<meta name="viewport" content="width=device-width, initial-scale=1"><body></body>'}));
   await page.goto('http://127.0.0.1:5195/__guide');
   await page.evaluate(async()=>{
    const Refresh=(await import('/@react-refresh')).default;Refresh.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;
    const R=(await import('/node_modules/.vite/deps/react.js')).default,D=(await import('/node_modules/.vite/deps/react-dom_client.js')).default,{MovementGuide}=await import('/src/components/MovementGuide.tsx');
    const style=document.createElement('style');style.textContent=await(await fetch('/src/app/styles.css?direct')).text();document.head.append(style);
    const host=document.createElement('main');host.className='app playing';document.body.append(host);
    const root=D.createRoot(host);root.render(R.createElement(MovementGuide,{onClose:()=>root.render(null)}));
   });
   await page.getByRole('dialog').waitFor();
   await page.evaluate(h=>document.querySelector('main').style.setProperty('--game-view-height',`${h}px`),visibleHeight);
   const content=await page.getByRole('dialog').textContent();
   assert.ok(content.includes(touch?'nửa trái màn hình':'W'));
   assert.ok(content.includes(touch?'hai ngón tay':'bánh xe chuột'));
   const box=await page.getByRole('dialog').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1);
   assert.ok(box.y>=0&&box.y+box.height<=visibleHeight,`${width}x${visibleHeight}: dialog exceeds visible game area ${JSON.stringify(box)}`);
   assert.equal(await page.getByRole('dialog').evaluate(e=>e.scrollWidth<=e.clientWidth),true);
   const close=await page.getByRole('button',{name:'Đóng',exact:true}).boundingBox();
   assert.ok(close.width>=44&&close.height>=44,'close button must remain easy to tap');
   const confirm=await page.getByRole('button',{name:'Mình hiểu rồi, đi dạo thôi'}).boundingBox();
   assert.ok(confirm.y>=box.y&&confirm.y+confirm.height<=box.y+box.height,'confirmation stays visible without scrolling');
   await page.getByRole('button',{name:'Mình hiểu rồi, đi dạo thôi'}).click();
   assert.equal(await page.getByRole('dialog').count(),0);
   await context.close();
  }
 }finally{await browser?.close();await vite.close();}
});
