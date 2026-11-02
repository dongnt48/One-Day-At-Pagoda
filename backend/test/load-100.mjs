import assert from 'node:assert/strict';
import {performance,monitorEventLoopDelay} from 'node:perf_hooks';
import {mkdirSync,writeFileSync} from 'node:fs';
process.env.PORT=process.env.PORT||'2581';process.env.DATABASE_PATH=':memory:';process.env.ROOM_MAX_CLIENTS='100';
const mapId=process.env.LOAD_MAP||'hall';
const capacity=mapId==='dining'?50:100;
await import('../dist/server.js');
const {maps}=await import('../dist/realtime/maps.js');
const {Client}=await import('@colyseus/sdk');
const client=new Client(`ws://localhost:${process.env.PORT}`),rooms=[],guests=[];
const origin=`http://localhost:${process.env.PORT}`;
async function ticket(cookie){const r=await fetch(origin+'/api/ticket',{method:'POST',headers:{cookie,'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,200);return(await r.json()).ticket;}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
let snapshot,patches=0,jsonBytes=0,lastChange=0,disconnects=0;
const loop=monitorEventLoopDelay({resolution:10});loop.enable();
const started=performance.now();
try{
 for(let i=0;i<capacity+1;i++){
  const registration=await fetch(origin+'/api/guest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({displayName:`Load ${i}`,avatar:i%2?'female':'male'})});
  assert.equal(registration.status,200,'101 guests can register through HTTP on one IP');
  const {guest}=await registration.json(),cookie=registration.headers.get('set-cookie').split(';')[0];guests.push({...guest,cookie});
  const room=await client.joinOrCreate(maps[mapId].roomType,{ticket:await ticket(cookie)});rooms.push(room);
  room.onMessage('state',s=>{if(i===0)snapshot=s;});
  room.onMessage('state_patch',p=>{if(i===0){patches++;jsonBytes+=Buffer.byteLength(JSON.stringify(p));if(p.changed.length)lastChange=performance.now();}});
  room.onMessage('notice',()=>{});room.onLeave(()=>{disconnects++;});
 }
 rooms[0].send('resync');await delay(300);
 assert.equal(snapshot.capacity,capacity);assert.equal(snapshot.mapId,mapId);assert.equal(snapshot.players.length,capacity);
 assert.ok(rooms.slice(0,capacity).every(r=>r.roomId===rooms[0].roomId));assert.notEqual(rooms[capacity].roomId,rooms[0].roomId,'101st user needs another room');
 for(const guest of guests){const r=await fetch(origin+'/api/social',{headers:{cookie:guest.cookie}});assert.equal(r.status,200,'social polling uses per-guest limits on shared Wi-Fi');}
 const idleBefore=patches;await delay(1000);const idlePatches=patches-idleBefore;
 assert.ok(idlePatches<=1,'idle room must not resend unchanged players every tick');
 const initialBytes=jsonBytes,initialPatches=patches,movingStarted=performance.now();
 const timer=setInterval(()=>{const direction=Math.floor((performance.now()-movingStarted)/1500)%2?1:-1;for(const room of rooms.slice(0,capacity))room.send('move',{dx:direction,dz:0,rotationY:direction*Math.PI/2});},100);
 await delay(30000);clearInterval(timer);
 const movingSeconds=(performance.now()-movingStarted)/1000;
 for(const room of rooms.slice(0,capacity))room.send('move',{dx:0,dz:0,rotationY:Math.PI});
 assert.ok(lastChange>movingStarted+29000,'all-moving room continues publishing updates');
 assert.ok(patches-initialPatches>=180,'at least six updates/s during 100-client movement');
 assert.equal(disconnects,0,'no users dropped under load');
 await rooms[25].leave();await delay(200);
 const replacement=await client.joinById(rooms[0].roomId,{ticket:await ticket(guests[25].cookie)});replacement.onMessage('state',()=>{});replacement.onMessage('state_patch',()=>{});rooms.push(replacement);
 rooms[0].send('resync');await delay(200);assert.equal(snapshot.players.length,capacity,'vacated place is reusable');
 const report={mapId,clientsInRoom:capacity,overflowRoom:true,idlePatches,movingUpdates:patches-initialPatches,movingSeconds:Number(movingSeconds.toFixed(2)),jsonPayloadKiBPerSecondPerClient:Number(((jsonBytes-initialBytes)/1024/movingSeconds).toFixed(1)),eventLoopP95Ms:Number((loop.percentile(95)/1e6).toFixed(1)),processRssMiB:Math.round(process.memoryUsage().rss/1024/1024),elapsedSeconds:Number(((performance.now()-started)/1000).toFixed(1)),note:`Local server plus ${capacity+1} headless network clients in one process; JSON payload estimate, not wire bandwidth or mobile FPS.`};
 mkdirSync('test-results',{recursive:true});writeFileSync(`test-results/load-${capacity}-${mapId}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 await Promise.race([Promise.allSettled(rooms.map(r=>r.leave())),delay(500)]);loop.disable();process.exit(0);
}catch(error){console.error(error);await Promise.race([Promise.allSettled(rooms.map(r=>r.leave())),delay(500)]);process.exit(1);}
