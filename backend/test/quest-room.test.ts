import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mapSpots} from '../src/realtime/maps.js';
process.env.DATABASE_PATH=':memory:';
const {DiningHallRoom,MainHallRoom}=await import('../src/rooms/PublicTempleRoom.js');
const {progressFor}=await import('../src/quests/store.js');

test('room awards only finished validated chores, ignores client counter claims and locks titles',()=>{
 const room=new DiningHallRoom(),handlers=new Map<string,Function>();let tick:Function=()=>{};
 room.listen=(id,fn)=>{handlers.set(id,fn);};room.setSimulationInterval=((fn:Function)=>{tick=fn;}) as any;room.broadcast=(()=>{}) as any;room.onCreate();
 const actor:any={player:{id:'quest-washer',x:0,z:11,action:'idle'},dx:0,dz:0,actionAt:0,moveAt:0,until:0};room.actors.set('a',actor);
 const sent:any[]=[];const client:any={sessionId:'a',send:(type:string,data:any)=>sent.push({type,data})};
 const original=Date.now;let now=100000;Date.now=()=>now;
 try{
  handlers.get('action')!(client,'wash');now+=7000;tick(100);assert.equal(progressFor(actor.player.id).counts.wash,undefined,'remote action rejected');
  const wash=mapSpots.dining.find(s=>s.id==='wash')!;actor.player.x=wash.x;actor.player.z=wash.z;
  handlers.get('action')!(client,'wash');now+=5999;tick(100);assert.equal(progressFor(actor.player.id).counts.wash,undefined);
  now++;tick(100);assert.equal(progressFor(actor.player.id).counts.wash,1);const merit=progressFor(actor.player.id).merit;assert.ok(merit>0);
  tick(100);assert.equal(progressFor(actor.player.id).counts.wash,1);
  handlers.get('quests')!(client,{op:'add',merit:999999,counts:{wash:999}});assert.equal(progressFor(actor.player.id).merit,merit);
  handlers.get('quests')!(client,{op:'equip',titleId:'happy-lotus'});assert.equal(actor.player.title,undefined);assert.ok(sent.some(s=>s.type==='notice'));
  handlers.get('quests')!(client,{op:'equip',titleId:'sprout'});assert.equal(actor.player.title,'Mầm Nhỏ');
  now+=1000;handlers.get('action')!(client,'wash');now+=1000;handlers.get('action')!(client,'wave');now+=6000;tick(100);
  assert.equal(progressFor(actor.player.id).counts.wash,1,'replacing an unfinished wash does not award it');
 }finally{Date.now=original;room.clock.stop();}
});
test('movement interrupting a bow records the completed bow before standing up',()=>{
 const room=new MainHallRoom(),handlers=new Map<string,Function>();room.listen=(id,fn)=>{handlers.set(id,fn);};room.setSimulationInterval=(()=>{}) as any;room.onCreate();
 const actor:any={player:{id:'quest-bower',x:0,z:0,rotationY:0,action:'idle'},dx:0,dz:0,actionAt:0,moveAt:0,until:0};room.actors.set('a',actor);
 const client:any={sessionId:'a',send:()=>{}};const original=Date.now;let now=200000;Date.now=()=>now;
 try{handlers.get('action')!(client,'prostrate');now+=4501;handlers.get('move')!(client,{dx:1,dz:0,rotationY:0});assert.equal(progressFor(actor.player.id).counts.bows,1);assert.equal(actor.player.action,'idle');}
 finally{Date.now=original;room.clock.stop();}
});
