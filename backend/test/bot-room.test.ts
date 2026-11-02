import {test} from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_PATH=':memory:';
const {PublicTempleRoom,MainHallRoom,DiningHallRoom}=await import('../src/rooms/PublicTempleRoom.js');

test('each room publishes shared NPCs without creating human actors or consuming clients',()=>{
 const previous=process.env.BOT_COUNT;process.env.BOT_COUNT='20';
 try{
  for(const Room of [PublicTempleRoom,MainHallRoom,DiningHallRoom]){
   const room=new Room();let tick:Function=()=>{};const messages:any[]=[];
   room.setSimulationInterval=((fn:Function)=>{tick=fn;}) as any;
   room.broadcast=((type:string,payload:any)=>messages.push({type,payload})) as any;
   try{
    room.onCreate();tick(100);
    const client={sessionId:'spectator',send:(type:string,payload:any)=>messages.push({type,payload})} as any;
    room.snapshot(client);
    const snapshot=messages.find(m=>m.type==='state').payload;
    assert.equal(snapshot.players.length,room.mapId==='courtyard'?6:20);
    assert.ok(snapshot.players.every((p:any)=>p.isBot&&p.id.startsWith(`npc-${room.mapId}-`)));
    assert.equal(room.actors.size,0);assert.equal(room.clients.length,0);
    const added=messages.find(m=>m.type==='state_patch').payload.added;
    assert.equal(added.length,room.mapId==='courtyard'?6:20);
    assert.deepEqual(new Set(added.map((p:any)=>p.id)),new Set(snapshot.players.map((p:any)=>p.id)));
   }finally{room.clock.stop();}
  }
 }finally{if(previous===undefined)delete process.env.BOT_COUNT;else process.env.BOT_COUNT=previous;}
});
