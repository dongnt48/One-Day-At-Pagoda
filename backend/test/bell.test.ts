import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mapSpots,nearestInteraction,walkable} from '../src/realtime/maps.js';
process.env.DATABASE_PATH=':memory:';
const {PublicTempleRoom}=await import('../src/rooms/PublicTempleRoom.js');

test('bell can be struck inside the tower, with proximity, tray and shared cooldown checks',()=>{
 const room=new PublicTempleRoom(),handlers=new Map<string,Function>(),events:any[]=[];
 room.listen=(type,handler)=>{handlers.set(type,handler);};room.setSimulationInterval=(()=>{}) as any;room.broadcast=((...args:any[])=>events.push(args)) as any;room.onCreate();
 const actor:any={player:{id:'a',x:0,z:11,action:'idle'},actionAt:0,until:0,dx:1,dz:1};room.actors.set('a',actor);
 const client:any={sessionId:'a',send:()=>{}};
 const act=()=>{actor.actionAt=0;handlers.get('action')!(client,'bell');};
 try{
  const spot=mapSpots.courtyard.find(s=>s.id==='bell');assert.ok(spot,'bell interaction exists');
  act();assert.equal(events.length,0,'remote request rejected');
  actor.player.x=spot.x;actor.player.z=spot.z;assert.ok(walkable(spot.x,spot.z));assert.equal(nearestInteraction('courtyard',spot.x,spot.z)?.id,'bell');
  actor.player.tray=true;act();assert.equal(events.length,0,'tray must be put down');actor.player.tray=false;
  act();assert.equal(actor.player.action,'bell');assert.equal(actor.dx,0);assert.ok(actor.until>Date.now());assert.equal(events[0][0],'bell');
  const other:any={...actor,player:{...actor.player,id:'b',action:'idle'},actionAt:0};room.actors.set('b',other);
  handlers.get('action')!({sessionId:'b',send:()=>{}},'bell');
  assert.equal(events.length,1,'shared cooldown prevents a second player from ringing immediately');
  const original=Date.now;try{Date.now=()=>room.bellAt+4001;handlers.get('action')!({sessionId:'b',send:()=>{}},'bell');assert.equal(events.length,2,'bell can ring again after its cooldown');}finally{Date.now=original;}
  room.mapId='hall';act();assert.equal(events.length,2,'bell only belongs to courtyard');
 }finally{room.clock.stop();}
});
