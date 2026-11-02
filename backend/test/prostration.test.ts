import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mapSpots} from '../src/realtime/maps.js';
process.env.DATABASE_PATH=':memory:';
const {MainHallRoom}=await import('../src/rooms/PublicTempleRoom.js');

test('continuous prostration is available in the hall, stays active, and stops on demand or movement',()=>{
 const room=new MainHallRoom(),handlers=new Map<string,Function>();let tick:Function=()=>{};
 room.listen=(id,fn)=>{handlers.set(id,fn);};room.setSimulationInterval=((fn:Function)=>{tick=fn;}) as any;room.broadcast=(()=>{}) as any;room.onCreate();
 const actor:any={player:{id:'a',x:3,z:0,action:'idle',rotationY:0},dx:0,dz:0,actionAt:0,moveAt:0,until:0};room.actors.set('a',actor);
 const client:any={sessionId:'a',send:()=>{}},act=(id:string)=>{actor.actionAt=0;handlers.get('action')!(client,id);};
 try{
  room.mapId='courtyard';act('prostrate');assert.equal(actor.player.action,'idle');room.mapId='hall';
  actor.player.tray=true;act('prostrate');assert.equal(actor.player.action,'idle');actor.player.tray=false;
  act('prostrate');assert.equal(actor.player.action,'prostrate');assert.equal(actor.until,Infinity);
  handlers.get('move')!(client,{dx:0,dz:0,rotationY:0});assert.equal(actor.player.rotationY,Math.PI,'camera changes must not rotate the kneeling character');
  tick(100);assert.equal(actor.player.action,'prostrate');
  handlers.get('action')!(client,'stand');assert.equal(actor.player.action,'idle','can stop immediately');
  act('prostrate');handlers.get('action')!(client,'prostrate');assert.equal(actor.player.action,'idle','pressing again toggles off');
  act('prostrate');actor.moveAt=0;handlers.get('move')!(client,{dx:1,dz:0,rotationY:0});assert.equal(actor.player.action,'idle');assert.equal(actor.until,0);assert.equal(actor.dx,1,'movement resumes');
 }finally{room.clock.stop();}
});

for(const pose of ['idle','sit','meditate','listen'])test(`stopping prostration restores the previous ${pose} pose and reserves its seat`,()=>{
 const room=new MainHallRoom(),handlers=new Map<string,Function>();let tick:Function=()=>{};
 room.listen=(id,fn)=>{handlers.set(id,fn);};room.setSimulationInterval=((fn:Function)=>{tick=fn;}) as any;room.broadcast=(()=>{}) as any;room.onCreate();
 const seat=pose==='listen'?'listen-0':pose==='meditate'?'meditate--20-0':undefined;
 const actor:any={player:{id:'a',x:3,z:0,action:pose,seat,rotationY:.8},dx:0,dz:0,actionAt:0,moveAt:0,until:pose==='idle'?0:Infinity};room.actors.set('a',actor);
 const other:any={player:{id:'b',x:3,z:0,action:'idle'},dx:0,dz:0,actionAt:0,moveAt:0,until:0};room.actors.set('b',other);
 const client:any={sessionId:'a',send:()=>{}};
 const original=Date.now;Date.now=()=>900_000;
 try{
  for(const stop of ['stand','prostrate']){
   actor.actionAt=0;handlers.get('action')!(client,'prostrate');assert.equal(actor.player.action,'prostrate');assert.equal(actor.player.seat,seat,'seat stays reserved while bowing');
   tick(100);assert.equal(actor.player.action,'prostrate','seated schedule updates cannot override bowing');
   if(seat){
    const spot=mapSpots.hall.find(s=>s.id===seat)!;other.player.x=spot.x;other.player.z=spot.z;other.actionAt=0;
    handlers.get('action')!({sessionId:'b',send:()=>{}},seat);assert.equal(other.player.seat,undefined,'another player cannot take the reserved seat');
   }
   handlers.get('action')!(client,stop);assert.equal(actor.player.action,pose,'restores previous posture');assert.equal(actor.player.seat,seat);assert.equal(actor.player.rotationY,.8);assert.equal(actor.until,pose==='idle'?0:Infinity);
  }
  actor.actionAt=0;handlers.get('action')!(client,'prostrate');actor.moveAt=0;
  handlers.get('move')!(client,{dx:1,dz:0,rotationY:0});assert.equal(actor.player.action,'idle');assert.equal(actor.player.seat,undefined,'walking frees the seat');
  actor.actionAt=0;handlers.get('action')!(client,'prostrate');handlers.get('action')!(client,'stand');assert.equal(actor.player.action,'idle','a later prayer cannot restore an old pose');
 }finally{Date.now=original;room.clock.stop();}
});
