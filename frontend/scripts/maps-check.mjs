import {chromium,expect} from '@playwright/test';
import {watchState} from './state-watch.mjs';
const browser=await chromium.launch({headless:true,channel:'chromium'});
try{
 const page=await browser.newPage({viewport:{width:1200,height:800}}),errors=[];
 let state,me;watchState(page,s=>{state=s;me=s.players.find(p=>p.displayName==='Khách Ba Khu');});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.BASE_URL||'http://localhost:5173');await page.getByRole('button',{name:'Vào chùa',exact:true}).click();await page.getByLabel('Tên của bạn').fill('Khách Ba Khu');await page.getByRole('button',{name:'Bắt đầu',exact:true}).click();
 await expect.poll(()=>state?.mapId,{timeout:15000}).toBe('courtyard');expect(state.capacity).toBe(100);await page.waitForTimeout(1500);
 const originalId=me.id;
 async function go(x,z){for(const [axis,target,negative,positive] of [['x',x,'a','d'],['z',z,'w','s']]){const deadline=Date.now()+45000;while(Math.abs(me[axis]-target)>.6){if(Date.now()>deadline)throw Error('Blocked '+JSON.stringify(me));const key=me[axis]<target?positive:negative;await page.keyboard.down(key);await page.waitForTimeout(Math.min(190,Math.max(60,Math.abs(me[axis]-target)/5*1000)));await page.keyboard.up(key);await page.waitForTimeout(110);}}}
 async function interact(label){await expect(page.locator('.interaction-prompt')).toContainText(label);await page.keyboard.press('e');await page.waitForTimeout(850);}
 await go(-3,-9);await go(0,-9);await interact('Chính điện');await expect.poll(()=>state.mapId).toBe('hall');expect(state.capacity).toBe(100);expect(me.id).toBe(originalId);await page.waitForTimeout(1200);
 await page.screenshot({path:'test-results/map-hall.png'});
 await go(-20,10);await interact('tĩnh tâm');await expect.poll(()=>me.action).toBe('meditate');await interact('Đứng lên');
 await go(0,32);await interact('Sân chùa');await expect.poll(()=>state.mapId).toBe('courtyard');await page.waitForTimeout(1100);
 await go(-14,3);await interact('Nhà ăn');await expect.poll(()=>state.mapId).toBe('dining');expect(state.capacity).toBe(50);await page.waitForTimeout(1200);
 await page.screenshot({path:'test-results/map-dining.png'});
 // Walk through the broad aisle between tables, then approach the counter.
 await go(0,-11);await go(-8,-11);await interact('Nhận cơm');await expect.poll(()=>me.tray).toBe(true);
 await go(0,-11);await go(0,-6.8);await go(-8,-6.8);await interact('Ngồi ăn');await expect.poll(()=>me.action).toBe('eat');await interact('Đứng lên');
 await go(0,-6.8);await go(0,-11);await go(8,-11);await interact('Trả khay');await expect.poll(()=>me.tray).toBe(false);
 await go(0,-11);await go(0,13);await interact('Sân chùa');await expect.poll(()=>state.mapId).toBe('courtyard');expect(me.id).toBe(originalId);
 await page.waitForTimeout(1000);await go(0,15.6);await go(-18,15.6);await interact('Tưới rau');await expect.poll(()=>me.action).toBe('water');
 await page.screenshot({path:'test-results/map-garden.png'});await page.waitForTimeout(4200);
 await interact('Tưới rau');await expect.poll(()=>me.action).toBe('water');expect(state.mapId).toBe('courtyard');
 expect(errors).toEqual([]);console.log('Passed: restored courtyard, portals, same identity, 100 capacity in hall, 50 in dining, meditation, meal lifecycle, garden watering and return.');
}finally{await browser.close();}
