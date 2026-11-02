import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BotPopulation} from '../src/realtime/bots.js';
import {walkable, type MapId} from '../src/realtime/maps.js';

function random(seed=19){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
for(const map of ['courtyard','hall','dining'] as MapId[]){
 test(`${map}: visitors move safely, perform activities and fluctuate gradually`,()=>{
  const population=new BotPopulation(map,20,random());
  const positions=new Map(population.players.map(p=>[p.id,{x:p.x,z:p.z}]));
  const actions=new Set<string>();const counts=new Set<number>();let previous=20;
  assert.equal(population.players.length,20);
  for(let now=0;now<240000;now+=100){
   population.update(now,100,[],100);
   const players=population.players;counts.add(players.length);
   assert.ok(Math.abs(players.length-previous)<=1,'visitors arrive or leave individually');previous=players.length;
   const seats=players.map(p=>p.seat).filter(Boolean);
   assert.equal(new Set(seats).size,seats.length,'seats cannot overlap');
   for(const p of players){
    assert.equal(p.isBot,true);assert.ok(walkable(p.x,p.z,map),`${p.id} at ${p.x},${p.z}`);
    const before=positions.get(p.id);
    if(before)assert.ok(Math.hypot(p.x-before.x,p.z-before.z)<=.251,'no teleporting');
    positions.set(p.id,{x:p.x,z:p.z});actions.add(p.action);
   }
  }
  assert.ok(actions.has('walk'));
  assert.ok(map==='hall'?actions.has('meditate')||actions.has('listen'):actions.has(map==='courtyard'?'water':'eat'));
  assert.ok(counts.size>1);assert.ok([...counts].every(n=>n>=15&&n<=25));
 });
}
test('disabled population stays empty',()=>{
 const population=new BotPopulation('hall',0,random());population.update(100000,100,[],100);
 assert.equal(population.players.length,0);
});
test('real visitors take priority over NPC capacity and seats',()=>{
 const population=new BotPopulation('dining',20,random());
 for(let now=0;now<60000;now+=100)population.update(now,100,[],50);
 const seated=population.players.find(p=>p.seat);assert.ok(seated);
 const human={...seated,id:'human',isBot:false};
 population.update(60000,100,[human],50);
 assert.ok(population.players.every(p=>p.seat!==human.seat));
 population.update(60100,100,Array.from({length:49},(_,i)=>({...human,id:`human-${i}`})),50);
 assert.ok(population.players.length<=1);
});
test('a moderately populated room retains ambient visitors when capacity allows',()=>{
 const population=new BotPopulation('courtyard',20,random());
 const humans=Array.from({length:25},()=>({}));
 for(let now=0;now<120000;now+=100)population.update(now,100,humans,100);
 assert.ok(population.players.length>=15&&population.players.length<=25);
});
test('walking visitors keep their speed through straight route waypoints',()=>{
 const population=new BotPopulation('hall',20,random());
 let checked=0;
 for(let now=0;now<30000;now+=100){
  const before=new Map(population.players.map(p=>[p.id,{...p}]));
  population.update(now,100,[],100);
  for(const p of population.players){
   const previous=before.get(p.id);
   if(!previous||p.action!=='walk'||previous.action!=='walk')continue;
   const distance=Math.hypot(p.x-previous.x,p.z-previous.z);
   assert.ok(distance>0.001,'walking cannot pause at a waypoint');
   if(Math.abs(p.rotationY-previous.rotationY)<.001){
    assert.ok(Math.abs(distance-.08)<.001,`cruising speed dropped to ${distance}`);checked++;
   }
  }
 }
 assert.ok(checked>100);
});
for(const map of ['hall','dining'] as MapId[])test(`${map}: most visitors start seated and remain settled`,()=>{
 const population=new BotPopulation(map,20,random());
 assert.ok(population.players.filter(p=>p.seat).length>=15);
 for(let now=0;now<600000;now+=100){
  population.update(now,100,[],100);
  const players=population.players;
  assert.ok(players.filter(p=>p.seat).length>=Math.floor(players.length*.7),'most visitors stay seated');
  assert.ok(players.filter(p=>p.action==='walk').length<=Math.max(1,Math.floor(players.length*.2)),'only a few visitors walk at once');
 }
});
test('courtyard visitors mostly rest or do chores, with occasional shared bell events',()=>{
 const bells:number[]=[];let time=0;
 const population=new BotPopulation('courtyard',20,random(),()=>bells.push(time));
 const actions=new Set(population.players.map(p=>p.action));
 assert.ok(actions.has('sweep')&&actions.has('water'));
 for(time=0;time<360000;time+=100){
  population.update(time,100,[],100);
  assert.ok(population.players.filter(p=>p.action==='walk').length<=Math.max(1,Math.floor(population.players.length*.2)));
 }
 assert.ok(bells.length>=1&&bells.length<=4);
 for(let i=1;i<bells.length;i++)assert.ok(bells[i]-bells[i-1]>=90000);
});
test('new arrivals respect seats reserved by visitors still walking to their meal',()=>{
 for(let seed=1;seed<=30;seed++){
  const population=new BotPopulation('dining',20,random(seed));
  for(let now=0;now<360000;now+=100){
   population.update(now,100,[],50);
   const seats=population.players.map(p=>p.seat).filter(Boolean);
   assert.equal(new Set(seats).size,seats.length,`duplicate dining seat with seed ${seed} at ${now}`);
  }
 }
});
