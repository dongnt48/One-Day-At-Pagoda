import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {Client,type Room} from '@colyseus/sdk';
import {applyPatch} from '../../frontend/src/game/multiplayer/state.js';

test('two real clients see the same NPC identities and movement in all three maps',{timeout:20000},async()=>{
 const origin='http://127.0.0.1:2578';
 const server=spawn(process.execPath,['--import','tsx','src/server.ts'],{env:{...process.env,NODE_ENV:'test',PORT:'2578',DATABASE_PATH:':memory:',BOT_COUNT:'20',ROOM_MAX_CLIENTS:'100'},stdio:'pipe'});
 let logs='';server.stdout.on('data',b=>logs+=b);server.stderr.on('data',b=>logs+=b);
 const rooms:Room[]=[];
 const delay=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
 try{
  let ready=false;
  for(let i=0;i<80;i++){try{if((await fetch(origin+'/api/health')).ok){ready=true;break;}}catch{}await delay(100);}
  assert.ok(ready,logs);
  let person=0;
  async function connect(type:string){
   const guest=await fetch(origin+'/api/guest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({displayName:`Khách ${++person}`,avatar:'male'})});
   const cookie=guest.headers.get('set-cookie')!.split(';')[0];
   const ticket=await fetch(origin+'/api/ticket',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:'{}'}).then(r=>r.json());
   const room=await new Client(origin).joinOrCreate(type,{ticket:ticket.ticket});rooms.push(room);
   const state={players:[] as any[],changes:0};
   room.onMessage('state',(s:any)=>state.players=s.players);
   room.onMessage('state_patch',(patch:any)=>{state.players=applyPatch(state.players,patch);state.changes+=patch.changed.filter((row:any[])=>String(row[0]).startsWith('npc-')).length;});
   room.onMessage('quest_state',()=>{});room.onMessage('quest_progress',()=>{});room.onMessage('quest_reward',()=>{});
   room.send('resync');return {room,state};
  }
  for(const type of ['public_temple','main_hall','dining_hall']){
   const a=await connect(type),b=await connect(type);assert.equal(a.room.roomId,b.room.roomId);
   await delay(500);
   const bots=(state:typeof a.state)=>state.players.filter(p=>p.isBot).map(p=>p.id).sort();
   assert.equal(bots(a.state).length,type==='public_temple'?6:20);assert.deepEqual(bots(a.state),bots(b.state));
   assert.equal(a.state.players.filter(p=>!p.isBot).length,2);
   assert.ok(a.state.changes>0&&b.state.changes>0,'NPC movement travels over the real patch protocol');
   await a.room.leave();rooms.splice(rooms.indexOf(a.room),1);
   await b.room.leave();rooms.splice(rooms.indexOf(b.room),1);
  }
 }finally{
  await Promise.all(rooms.map(r=>r.leave().catch(()=>{})));
  if(server.exitCode===null){const exited=new Promise(resolve=>server.once('exit',resolve));server.kill();await exited;}
 }
});
