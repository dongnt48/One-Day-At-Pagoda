import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gatheringAt} from '../src/realtime/gathering.js';
import {mapSpots,maps,lectureSeats,diningSeats,walkable,type MapId} from '../src/realtime/world.js';
process.env.DATABASE_PATH=':memory:';
const {PublicTempleRoom,MainHallRoom,DiningHallRoom}=await import('../src/rooms/PublicTempleRoom.js');

test('rotated dining entrance is reachable from the courtyard and walls stay solid',()=>{
  const entrance=maps.courtyard.portals.find(p=>p.target==='dining')!;
  for(let step=0;step<=40;step++)assert.ok(walkable(entrance.x*step/40,entrance.z,'courtyard'));
  assert.equal(walkable(-18,3,'courtyard'),false,'interior facade is not a walk-through');
  assert.equal(walkable(-14.9525,-1.5,'courtyard'),false,'rotated porch column');
  assert.equal(walkable(-11,8.5,'courtyard'),true,'old frontage is now outside the wall');
});

test('courtyard incense burner moves outward with its interaction and collision',()=>{
  const incense=mapSpots.courtyard.find(p=>p.id==='incense')!;
  assert.equal(incense.z,-5.5);
  assert.equal(walkable(0,-5.5,'courtyard'),false);
  assert.equal(walkable(0,-7,'courtyard'),true,'old urn position is clear');
  assert.equal(walkable(0,-4.3,'courtyard'),true,'front approach stays reachable');
  assert.ok(Math.hypot(incense.x,incense.z+4.3)<incense.radius!);
});
test('gathering schedule boundaries and late arrivals share the same paragraph',()=>{
  assert.equal(gatheringAt(0).active,true);
  assert.notEqual(gatheringAt(0).paragraph,gatheringAt(60_000).paragraph);
  assert.equal(gatheringAt(299_999).active,true);
  assert.equal(gatheringAt(300_000).active,false);
  assert.equal(gatheringAt(839_999).upcoming,false);
  assert.equal(gatheringAt(840_000).upcoming,true);
  assert.equal(gatheringAt(900_000).active,true);
});
test('meal lifecycle, exclusive seats, voluntary exit, and session end',()=>{
  const room=new PublicTempleRoom(),handlers=new Map<string,Function>();
  room.mapId='dining';
  let tick:Function=()=>{};
  room.listen=(type,fn)=>{handlers.set(type,fn);};
  room.setSimulationInterval=((fn:Function)=>{tick=fn;}) as any;
  room.broadcast=(()=>{}) as any;
  room.onCreate();
  const actor=(id:string):any=>({player:{id,displayName:id,avatar:'male',x:0,y:0,z:11,rotationY:0,action:'idle'},dx:0,dz:0,moveAt:0,chatAt:0,actionAt:0,until:0,ip:'test'});
  const a=actor('a'),b=actor('b');room.actors.set('a',a);room.actors.set('b',b);
  const act=(who:any,id:string,near=true)=>{
    who.actionAt=0;
    const spot=mapSpots[room.mapId].find(s=>s.id===id);
    if(spot&&near){who.player.x=spot.x;who.player.z=spot.z;}
    handlers.get('action')!({sessionId:who.player.id,send:()=>{}},id);
  };
  try{
    act(a,'meal',false);assert.equal(a.player.tray,undefined,'remote pickup rejected');
    act(a,'eat-0',false);assert.equal(a.player.seat,undefined,'must still approach the chair');
    act(a,'eat-0');assert.equal(a.player.seat,'eat-0','can sit without a tray');assert.equal(a.player.action,'seated');assert.equal(a.player.tray,undefined);
    tick(100);assert.equal(a.player.action,'seated','sitting lasts until the player leaves');
    act(b,'eat-0');assert.equal(b.player.seat,undefined,'occupied chair is blocked even without a tray');
    act(a,'eat-0');assert.equal(a.player.seat,undefined,'same chair toggles standing without a tray');
    act(a,'meal');assert.equal(a.player.tray,true);
    act(a,'eat-0');assert.equal(a.player.action,'eat');assert.equal(a.player.seat,'eat-0');
    act(b,'meal');act(b,'eat-0');assert.equal(b.player.seat,undefined,'occupied seat rejected');
    act(b,'eat-1');assert.equal(b.player.action,'eat');
    handlers.get('move')!({sessionId:'a'},{dx:1,dz:0,rotationY:0});assert.equal(a.player.seat,undefined,'walking leaves seat');
    act(a,'return-tray');assert.equal(a.player.tray,false);
    act(a,'listen-0');assert.equal(a.player.seat,undefined,'other-map actions are rejected');
    room.mapId='hall';
    act(a,'meditate--20-0');assert.equal(a.player.action,'meditate');
    handlers.get('action')!({sessionId:'a',send:()=>{}},'stand');
    assert.equal(a.player.seat,undefined,'leave is never delayed by action cooldown');
    act(a,'meditate--20-0');
    act(a,'meditate--20-0');assert.equal(a.player.seat,undefined,'E toggles seat');
    const original=Date.now;
    try{
      Date.now=()=>900_000;
      act(a,'listen-0');assert.equal(a.player.action,'listen');
      Date.now=()=>1_200_000;tick(66);assert.equal(a.player.action,'meditate','session end keeps quiet sitting');
      act(a,'stand');act(a,'listen-0');assert.equal(a.player.seat,'listen-0','can sit outside scheduled gatherings');
      assert.equal(a.player.action,'meditate','quiet sitting outside a gathering');
      Date.now=()=>1_800_000;tick(66);assert.equal(a.player.action,'listen','seated players join when a gathering starts');
      assert.equal(a.player.seat,'listen-0','schedule changes do not remove the seat');
    }finally{Date.now=original;}
    room.onDrop({sessionId:'b'} as any,4008);assert.equal(b.player.seat,undefined,'disconnect frees seat');
    for(const mapId of Object.keys(maps) as MapId[])for(const spot of mapSpots[mapId].filter(s=>s.id!=='incense'))assert.ok(walkable(spot.x,spot.z,mapId),`${mapId}/${spot.id} must be reachable`);
  }finally{room.clock.stop();}
});
test('hall has 100 seats and dining keeps 50 unique, reachable seats',()=>{
 for(const [mapId,seats] of [['hall',lectureSeats],['dining',diningSeats]] as const){
  const capacity=mapId==='hall'?100:50;
  assert.equal(seats.length,capacity);assert.equal(new Set(seats.map(s=>`${s.x}:${s.z}`)).size,capacity);
  for(const s of seats)assert.ok(walkable(s.x,s.z,mapId));
 }
 assert.equal(new PublicTempleRoom().maxClients,100);assert.equal(new MainHallRoom().maxClients,100);assert.equal(new DiningHallRoom().maxClients,50);
});
test('all 100 lecture seats can be occupied; portal range and map isolation are enforced',()=>{
 const room=new PublicTempleRoom();room.mapId='hall';
 const handlers=new Map<string,Function>(),sent:any[]=[];
 room.listen=(key,fn)=>{handlers.set(key,fn);};room.setSimulationInterval=(()=>{}) as any;room.onCreate();
 const original=Date.now;Date.now=()=>900_000;
 try{
  for(const [i,spot] of lectureSeats.entries()){
   const id=String(i),actor:any={player:{id,displayName:id,avatar:'male',x:spot.x,y:0,z:spot.z,rotationY:0,action:'idle'},dx:0,dz:0,moveAt:0,chatAt:0,actionAt:0,until:0,ip:'test'};
   room.actors.set(id,actor);handlers.get('action')!({sessionId:id,send:(...args:any[])=>sent.push(args)},spot.id);assert.equal(actor.player.seat,spot.id);
  }
  assert.equal(new Set([...room.actors.values()].map(a=>a.player.seat)).size,100);
  const a=room.actors.get('0')!,client={sessionId:'0',send:(...args:any[])=>sent.push(args)};
  handlers.get('action')!(client,'stand');a.actionAt=0;handlers.get('action')!(client,'portal-courtyard');assert.equal(sent.at(-1)[0],'notice');
  a.player.x=0;a.player.z=32;a.actionAt=0;handlers.get('action')!(client,'portal-courtyard');assert.deepEqual(sent.at(-1),['travel',{mapId:'courtyard'}]);
  a.actionAt=0;handlers.get('action')!(client,'sweep');assert.notEqual(a.player.action,'sweep');
 }finally{Date.now=original;room.clock.stop();}
});
test('delta publication sends changed rows and removals, with no idle spam',()=>{
 const room=new PublicTempleRoom(),events:any[]=[];room.broadcast=((...args:any[])=>events.push(args)) as any;
 const actor:any={player:{id:'a',displayName:'A',avatar:'male',x:0,y:0,z:5,rotationY:0,action:'idle'}};
 room.actors.set('a',actor);room.publish(900_000);assert.equal(events[0][1].added.length,1);
 room.publish(900_100);assert.equal(events.length,1);
 actor.player.x=1;room.publish(900_200);assert.equal(events.at(-1)[1].changed[0][1],1);
 room.actors.delete('a');room.publish(900_300);assert.deepEqual(events.at(-1)[1].removed,['a']);room.clock.stop();
});
