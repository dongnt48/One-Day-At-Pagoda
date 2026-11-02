import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AnimationMixer,Vector3} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {kitchenAnimations} from '../src/game/characters/kitchenAnimations.ts';
import {createKitchenPose} from '../src/game/characters/kitchenPose.ts';

for(const avatar of ['male','female'])for(const action of ['cook','wash']){
 test(`${avatar} ${action}: hands stay in front, at working height, without stretching arms`,async()=>{
  const bytes=readFileSync(new URL(`../public/models/${avatar}_lam.glb`,import.meta.url));
  const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const model=gltf.scene,mixer=new AnimationMixer(model),pose=createKitchenPose(model);
  mixer.clipAction(kitchenAnimations(gltf.animations).find(c=>c.name===action)).play();
  const local=name=>model.worldToLocal(model.getObjectByName(name).getWorldPosition(new Vector3()));
  for(let i=0;i<40;i++){
   mixer.update(.05);pose(action,i*.05);model.updateMatrixWorld(true);
   const right=local('RightHand'),left=local('LeftHand');
   for(const [side,hand] of [['Right',right],['Left',left]]){
    assert.ok(hand.z>.20,`${side} hand must face the work surface, never behind the body`);
    assert.ok(hand.y>.95&&hand.y<1.30,`${side} hand must stay around counter height`);
    assert.ok(Math.abs(hand.distanceTo(local(`${side}Arm`))-.397)<.02,'arm length is preserved');
   }
   if(action==='wash')assert.ok(right.distanceTo(left)<.25,'sponge stays close enough to scrub the plate');
  }
  mixer.stopAllAction();mixer.uncacheRoot(model);
 });
}
