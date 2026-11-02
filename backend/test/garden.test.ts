import {test} from 'node:test';
import assert from 'node:assert/strict';

import {maps,mapSpots,diningSeats,walkable,gardenPlots,nearestInteraction} from '../src/realtime/maps.js';
process.env.DATABASE_PATH=':memory:';
const {PublicTempleRoom}=await import('../src/rooms/PublicTempleRoom.js');
test('garden actions only animate players, allow shared use and reject remote requests',()=>{
 const room=new PublicTempleRoom(),handlers=new Map<string,Function>();
 room.listen=(type,fn)=>{handlers.set(type,fn);};room.setSimulationInterval=(()=>{}) as any;
 room.broadcast=(()=>{throw Error('No crop state should be broadcast');}) as any;room.onCreate();
 const spot=mapSpots.courtyard.find(s=>s.id==='garden-0')!;
 const a:any={player:{id:'a',x:0,z:11,action:'idle'},actionAt:0,until:0,dx:0,dz:0};
 room.actors.set('a',a);
 const act=()=>{a.actionAt=0;handlers.get('action')!({sessionId:'a',send:()=>{}},spot.id);};
 try{
  act();assert.equal(a.player.action,'idle');
  a.player.x=spot.x;a.player.z=spot.z;act();assert.equal(a.player.action,'water');assert.ok(a.until>Date.now());
  a.player.action='idle';act();assert.equal(a.player.action,'water','repeat without crop progress');
  const plot=gardenPlots[0];
  for(const [dx,dz] of [[3.5,0],[0,-2.6],[0,2.6]]){
   a.player.x=plot.x+dx;a.player.z=plot.z+dz;a.player.action='idle';
   assert.ok(walkable(a.player.x,a.player.z));
   assert.equal(nearestInteraction('courtyard',a.player.x,a.player.z)?.id,spot.id,'any adjacent edge offers watering');
   act();assert.equal(a.player.action,'water','watering works along the bed instead of at the sign');
  }
  a.player.x=plot.x;a.player.z=plot.z+4.2;a.player.action='idle';
  assert.notEqual(nearestInteraction('courtyard',a.player.x,a.player.z)?.id,spot.id);
  act();assert.equal(a.player.action,'idle','cannot water from far outside the bed');
  assert.equal('garden' in room,false);assert.equal(handlers.has('garden-sync'),false);
 }finally{room.clock.stop();}
});
test('compact dining and garden keep seats, interaction approaches and spawn lanes clear',()=>{
 assert.equal(diningSeats.length,50);
 for(const id of ['dining','courtyard'] as const){
  for(const s of [...mapSpots[id],...maps[id].portals].filter(s=>s.id!=='incense'))assert.ok(walkable(s.x,s.z,id),s.id);
  for(let i=0;i<50;i++)assert.ok(walkable(((i%10)-4.5)*(id==='dining'?.6:1.1),maps[id].spawn.z-Math.floor(i/10)*.8,id),`${id} spawn ${i}`);
 }
 assert.ok(walkable(-11,-7.5,'courtyard'));
 assert.equal(walkable(-18,13,'courtyard'),false);
});
