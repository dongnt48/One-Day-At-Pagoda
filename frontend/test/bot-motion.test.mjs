import {test} from 'node:test';
import assert from 'node:assert/strict';
import {followBotPosition} from '../src/game/characters/botMotion.ts';

test('delayed bot updates and long frames cannot fling the rendered character',()=>{
 const position={x:0,z:0},target={x:25,z:-15};
 for(const dt of [1/60,1/60,.8,1/30,0,1/60]){
  const before={...position};followBotPosition(position,target,dt);
  assert.ok(Math.hypot(position.x-before.x,position.z-before.z)<=3*Math.min(dt,.25)+1e-9,'visual movement must stay within the speed budget');
 }
 for(let i=0;i<1200;i++)followBotPosition(position,target,1/60);
 assert.ok(Math.hypot(position.x-target.x,position.z-target.z)<.001,'eventually reaches the authoritative position');
});
test('sustained low frame rates do not accumulate NPC position lag',()=>{
 for(const fps of [5,10,15]){
  const position={x:0,z:0};
  for(let frame=0;frame<fps*30;frame++){
   const time=frame/fps,target={x:Math.floor(time*10)*.24,z:0};
   followBotPosition(position,target,1/fps);
   if(time>5)assert.ok(target.x-position.x<.5,`${fps} FPS accumulated ${target.x-position.x}m lag`);
  }
 }
});
test('regular 10Hz bot updates retain their walking speed',()=>{
 const position={x:0,z:0};let previous=0;
 for(let frame=0;frame<600;frame++){
  const target={x:Math.floor(frame/6)*.24,z:0};followBotPosition(position,target,1/60);
  if(frame===300)previous=position.x;
 }
 assert.ok(Math.abs((position.x-previous)/((599-300)/60)-2.4)<.05);
});
