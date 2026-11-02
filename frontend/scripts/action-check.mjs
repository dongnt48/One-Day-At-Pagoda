import {chromium,expect} from '@playwright/test';
import {unpackMultiple} from '@colyseus/msgpackr';
import {watchState} from './state-watch.mjs';
const browser=await chromium.launch({headless:true,channel:'chromium'});
try{
 const page=await browser.newPage({viewport:{width:1200,height:800}}),moves=[],errors=[];
 let me,mapId;watchState(page,s=>{me=s.players.find(p=>p.displayName==='Kiểm Tra Cử Chỉ');mapId=s.mapId;});
 async function go(x,z){for(const [axis,target,negative,positive] of [['x',x,'a','d'],['z',z,'w','s']]){const deadline=Date.now()+30000;while(Math.abs(me[axis]-target)>.6){if(Date.now()>deadline)throw Error('Blocked '+JSON.stringify(me));const key=me[axis]<target?positive:negative;await page.keyboard.down(key);await page.waitForTimeout(Math.min(190,Math.max(60,Math.abs(me[axis]-target)/5*1000)));await page.keyboard.up(key);await page.waitForTimeout(110);}}}
 page.on('pageerror',e=>errors.push(e.message));
 page.on('websocket',ws=>ws.on('framesent',({payload})=>{try{const a=unpackMultiple(payload.subarray(1));if(a[0]==='move')moves.push(a[1]);}catch{}}));
 await page.goto(process.env.BASE_URL||'http://localhost:5173');
 await page.getByRole('button',{name:'Vào chùa',exact:true}).click();
 await page.getByLabel('Tên của bạn').fill('Kiểm Tra Cử Chỉ');
 await page.getByRole('button',{name:'Bắt đầu',exact:true}).click();
 await page.getByRole('navigation',{name:'Tương tác'}).waitFor();
 await page.waitForTimeout(1500);
 await page.keyboard.down('w');await page.waitForTimeout(180);
 const initial=moves.at(-1).rotationY;
 await page.mouse.move(500,300);await page.waitForTimeout(180);
 expect(moves.at(-1).rotationY).toBeCloseTo(initial,4);
 await page.mouse.down();await page.mouse.move(620,300,{steps:8});await page.waitForTimeout(180);
 const dragged=moves.at(-1).rotationY;
 expect(Math.abs(Math.sin(dragged-initial))).toBeGreaterThan(.2);
 await page.mouse.up();await page.mouse.move(750,320,{steps:8});await page.waitForTimeout(180);
 expect(moves.at(-1).rotationY).toBeCloseTo(dragged,4);
 expect(await page.evaluate(()=>document.pointerLockElement===null)).toBe(true);
 await page.keyboard.up('w');
 // Restore camera yaw before travelling to the activity spots.
 await page.mouse.move(220,300);await page.mouse.down();await page.mouse.move(100,300,{steps:8});await page.mouse.up();
 await page.keyboard.down('w');await page.waitForTimeout(200);await page.keyboard.up('w');
 expect(moves.at(-1).rotationY).toBeCloseTo(initial,3);
 await page.getByRole('button',{name:/Quỳ xuống/}).click();
 await page.getByRole('button',{name:/Đứng lên/}).waitFor();
 await page.waitForTimeout(800);await page.screenshot({path:'test-results/kneeling.png'});
 await page.getByRole('button',{name:/Đứng lên/}).click();
 await go(-5,3);
 const sweep=page.getByRole('button',{name:/Quét sân/});await sweep.waitFor({timeout:5000});await sweep.click();
 await page.waitForTimeout(900);await page.screenshot({path:'test-results/sweeping.png'});
 await page.waitForTimeout(3500);
 await go(-3,-9);await go(0,-9);await expect(page.locator('.interaction-prompt')).toContainText('Chính điện');await page.keyboard.press('e');await expect.poll(()=>mapId).toBe('hall');await page.waitForTimeout(1000);
 await go(0,-21);
 const incense=page.getByRole('button',{name:/Thắp hương/});await incense.waitFor({timeout:5000});await incense.click();
 await page.waitForTimeout(900);await page.screenshot({path:'test-results/incense.png'});
 expect(errors).toEqual([]);
 console.log('Actions passed: left drag only, release holds yaw, no pointer lock, kneel, sweep, incense.');
}finally{await browser.close();}
