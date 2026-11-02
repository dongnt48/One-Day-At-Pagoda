import {test} from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_PATH=':memory:';
const {recordVisit,visitStats,analyticsRouter}=await import('../src/analytics.js');
import express from 'express';
import {createServer} from 'node:http';

test('visits count page opens and anonymous browsers across Vietnam midnight',()=>{
 const before=Date.parse('2026-11-01T16:59:59Z'),after=before+2000;
 recordVisit('one',before);recordVisit('one',before);recordVisit('two',before);recordVisit('one',after);
 const stats=visitStats(after);
 assert.equal(stats.totalViews,4);assert.equal(stats.totalBrowsers,2);
 assert.equal(stats.todayViews,1);assert.equal(stats.todayBrowsers,1);
 assert.equal(stats.days[0].day,'2026-11-02');
});
test('private statistics require configured credentials and exclude themselves from visits',async()=>{
 process.env.ANALYTICS_PATH='my-private-stats-123';process.env.ANALYTICS_PASSWORD='a-long-test-password';
 const app=express();app.use('/api',analyticsRouter());const server=createServer(app);
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
 const address=server.address() as {port:number},base=`http://127.0.0.1:${address.port}/api`;
 try{
  const path=base+'/private/my-private-stats-123',count=visitStats().totalViews;
  assert.equal((await fetch(path)).status,401);
  assert.equal((await fetch(path,{headers:{Authorization:'Basic '+Buffer.from('admin:wrong').toString('base64')}})).status,401);
  const response=await fetch(path,{headers:{Authorization:'Basic '+Buffer.from('admin:a-long-test-password').toString('base64')}});
  assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
  assert.match(await response.text(),/Thống kê truy cập/);assert.equal(visitStats().totalViews,count);
  const visit=await fetch(base+'/visit',{method:'POST'});assert.equal(visit.status,204);
  const cookie=visit.headers.get('set-cookie')!.split(';')[0];
  await fetch(base+'/visit',{method:'POST',headers:{Cookie:cookie}});
  assert.equal(visitStats().totalViews,count+2);assert.equal(visitStats().totalBrowsers,3);
 }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));delete process.env.ANALYTICS_PATH;delete process.env.ANALYTICS_PASSWORD;}
});
test('management stays disabled without a strong configured password',async()=>{
 process.env.ANALYTICS_PATH='my-private-stats-123';process.env.ANALYTICS_PASSWORD='short';
 const app=express();app.use('/api',analyticsRouter());const server=createServer(app);
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
 try{
  const {port}=server.address() as {port:number};
  assert.equal((await fetch(`http://127.0.0.1:${port}/api/private/my-private-stats-123`)).status,404);
 }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));delete process.env.ANALYTICS_PATH;delete process.env.ANALYTICS_PASSWORD;}
});
