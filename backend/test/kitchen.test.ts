import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mapSpots,nearestInteraction,walkable} from '../src/realtime/maps.js';
import {mapSpots as visualSpots} from '../../frontend/src/game/maps.js';
process.env.DATABASE_PATH=':memory:';
const {DiningHallRoom}=await import('../src/rooms/PublicTempleRoom.js');

test('cooking and washing require a nearby dining station and empty hands, animate and expire',()=>{
 const room=new DiningHallRoom(),handlers=new Map<string,Function>();let tick:Function=()=>{};
 room.listen=(type,handler)=>{handlers.set(type,handler);};room.setSimulationInterval=((fn:Function)=>{tick=fn;}) as any;room.broadcast=(()=>{}) as any;room.onCreate();
 const actor:any={player:{id:'cook',x:0,z:11,action:'idle'},dx:1,dz:1,moveAt:0,actionAt:0,until:0};room.actors.set('cook',actor);
 const client:any={sessionId:'cook',send:()=>{}};
 const act=(id:string)=>{actor.actionAt=0;handlers.get('action')!(client,id);};
 try{
  for(const id of ['cook','wash']){
   const spot=mapSpots.dining.find(s=>s.id===id);assert.ok(spot,`${id} station exists`);
   assert.deepEqual(visualSpots.dining.find(s=>s.id===id),spot);
   actor.player.x=0;actor.player.z=11;actor.player.action='idle';act(id);assert.equal(actor.player.action,'idle','remote use rejected');
   actor.player.x=spot.x;actor.player.z=spot.z;assert.ok(walkable(spot.x,spot.z,'dining'));
   assert.equal(nearestInteraction('dining',spot.x,spot.z)?.id,id);
   actor.player.tray=true;act(id);assert.equal(actor.player.action,'idle','must return tray first');actor.player.tray=false;
   act(id);assert.equal(actor.player.action,id);assert.equal(actor.player.rotationY,Math.PI);assert.equal(actor.dx,0);assert.equal(actor.dz,0);assert.ok(actor.until>Date.now());
   const original=Date.now;try{Date.now=()=>actor.until+1;tick(100);assert.equal(actor.player.action,'idle','activity ends');}finally{Date.now=original;}
   room.mapId='courtyard';act(id);assert.equal(actor.player.action,'idle','cannot use a kitchen action on another map');room.mapId='dining';
  }
 }finally{room.clock.stop();}
});
