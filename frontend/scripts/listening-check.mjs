import {chromium,expect} from '@playwright/test';
import {watchState} from './state-watch.mjs';
const browser=await chromium.launch({headless:true,channel:'chromium'});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
 let me,gathering,mapId;
 page.on('pageerror',e=>errors.push(e.message));
 watchState(page,s=>{me=s.players.find(p=>p.displayName==='Khách Nghe Pháp');gathering=s.gathering;mapId=s.mapId;});
 await page.goto(process.env.BASE_URL||'http://localhost:5173');
 await page.getByRole('button',{name:'Vào chùa',exact:true}).tap();await page.getByLabel('Tên của bạn').fill('Khách Nghe Pháp');await page.getByRole('button',{name:'Bắt đầu',exact:true}).tap();
 await expect.poll(()=>gathering?.active).toBe(true);
 await page.waitForTimeout(1000);
 async function move(axis,target,negative,positive){const deadline=Date.now()+30000;while(Math.abs(me[axis]-target)>.6){if(Date.now()>deadline)throw Error('Blocked '+JSON.stringify(me));const key=me[axis]<target?positive:negative;await page.keyboard.down(key);await page.waitForTimeout(Math.min(190,Math.max(55,Math.abs(me[axis]-target)/5*1000)));await page.keyboard.up(key);await page.waitForTimeout(110);}}
 await move('x',-3,'a','d');await move('z',-9,'w','s');await move('x',0,'a','d');
 await page.locator('.interaction-prompt').tap();await expect.poll(()=>mapId).toBe('hall');await page.waitForTimeout(1000);
 await move('x',-3.1,'a','d');await move('z',8.8,'w','s');
 await expect(page.locator('.interaction-prompt')).toContainText('Nghe pháp');await page.locator('.interaction-prompt').tap();await expect.poll(()=>me.action).toBe('listen');
 await expect(page.getByText('Nội dung chữ mẫu để duyệt · chưa có âm thanh')).toBeVisible();
 await expect(page.getByRole('heading',{name:gathering.title})).toBeVisible();
 await page.screenshot({path:'test-results/listening-mobile.png'});
 await page.getByRole('button',{name:'Đứng lên / rời chỗ',exact:true}).tap();await expect.poll(()=>!!me.seat).toBe(false);
 await expect(page.getByRole('heading',{name:gathering.title})).toHaveCount(0);
 expect(errors).toEqual([]);console.log('Passed: scheduled gathering, mobile join/read/leave without blocking other activities.');
}finally{await browser.close();}
