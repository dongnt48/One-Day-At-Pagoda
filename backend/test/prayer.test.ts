import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mapSpots,walkable,nearestInteraction} from '../src/realtime/maps.js';
import {mapSpots as visualSpots} from '../../frontend/src/game/maps.js';
process.env.DATABASE_PATH=':memory:';
const {MainHallRoom}=await import('../src/rooms/PublicTempleRoom.js');

for(const prayerId of ['pray','pray-left','pray-right'])test(`${prayerId}: prayer runs once for twelve seconds without interruption, then stands`,()=>{
 const room=new MainHallRoom(),handlers=new Map<string,Function>();let tick:Function=()=>{};
 room.listen=(id,handler)=>{handlers.set(id,handler);};room.setSimulationInterval=((fn:Function)=>{tick=fn;}) as any;room.broadcast=(()=>{}) as any;room.onCreate();
 const actor:any={player:{id:'a',x:0,z:11,rotationY:0,action:'idle'},dx:0,dz:0,actionAt:0,moveAt:0,until:0};room.actors.set('a',actor);
 const client:any={sessionId:'a',send:()=>{}};
 const original=Date.now;let now=2_000_000;Date.now=()=>now;
 try{
  handlers.get('action')!(client,prayerId);assert.equal(actor.player.action,'idle','must approach the altar');
  const spot=mapSpots.hall.find(s=>s.id===prayerId);assert.ok(spot,'each altar offers prayer');
  assert.deepEqual(visualSpots.hall.find(s=>s.id===prayerId),spot);
  assert.ok(walkable(spot.x,spot.z,'hall'));assert.equal(nearestInteraction('hall',spot.x,spot.z)?.id,prayerId);
  actor.player.x=spot.x;actor.player.z=spot.z;
  actor.player.tray=true;handlers.get('action')!(client,prayerId);assert.equal(actor.player.action,'idle');actor.player.tray=false;
  handlers.get('action')!(client,prayerId);assert.equal(actor.player.action,'pray');assert.equal(actor.until-now,12000);assert.equal(actor.player.rotationY,Math.PI);
  for(const elapsed of [1000,4000,8000,11900]){
   now=2_000_000+elapsed;handlers.get('move')!(client,{dx:1,dz:1,rotationY:0});
   for(const action of ['wave','stand','pray'])handlers.get('action')!(client,action);
   assert.equal(actor.until,2_012_000,'repeated inputs cannot restart or shorten the sequence');tick(100);
   assert.equal(actor.player.action,'pray');assert.equal(actor.player.x,spot.x);assert.equal(actor.player.z,spot.z);assert.equal(actor.player.rotationY,Math.PI);
  }
  now=2_012_001;tick(100);assert.equal(actor.player.action,'idle');
  handlers.get('move')!(client,{dx:1,dz:0,rotationY:0});assert.equal(actor.dx,1,'movement resumes after standing');
 }finally{Date.now=original;room.clock.stop();}
});
