import {test} from 'node:test';
import assert from 'node:assert/strict';
import {leaveOnPageHide} from '../../frontend/src/game/multiplayer/pageExit.js';

test('page reload leaves the current room with consent and clears local state first',()=>{
 const target=new EventTarget(),calls:string[]=[];
 let current:{leave(consented?:boolean):Promise<number>}|null=null;
 const cleanup=leaveOnPageHide(target,()=>current,()=>{calls.push('exit');current=null;});
 // Registering before joining must still use the latest room, including after travel.
 current={leave:async consented=>{assert.equal(consented,true);assert.equal(current,null);calls.push('leave');return 1000;}};
 target.dispatchEvent(new Event('visibilitychange'));
 assert.deepEqual(calls,[],'backgrounding must not end the session');
 target.dispatchEvent(new Event('pagehide'));
 assert.deepEqual(calls,['exit','leave']);
 cleanup();
 target.dispatchEvent(new Event('pagehide'));
 assert.deepEqual(calls,['exit','leave'],'cleanup removes the listener');
});

test('page exit tolerates a room whose transport already closed',async()=>{
 const target=new EventTarget();
 const cleanup=leaveOnPageHide(target,()=>({leave:async()=>{throw Error('closed');}}),()=>{});
 target.dispatchEvent(new Event('pagehide'));
 await new Promise(resolve=>setImmediate(resolve));
 cleanup();
});
