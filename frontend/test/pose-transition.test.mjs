import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AnimationMixer} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {createPrayerPose,prayerAnimation} from '../src/game/characters/prayerPose.ts';
import {createPoseBaseline} from '../src/game/characters/poseBaseline.ts';

for(const avatar of ['male','female'])for(const nextAction of ['walk','idle','sit','meditate']){
 test(`${avatar}: interrupting a deep bow restores the full ${nextAction} pose`,async()=>{
  const bytes=readFileSync(new URL(`../public/models/${avatar}_lam.glb`,import.meta.url));
  const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const actual=clone(gltf.scene),reference=clone(gltf.scene);
  const mixer=new AnimationMixer(actual),expectedMixer=new AnimationMixer(reference),baseline=createPoseBaseline(actual),pose=createPrayerPose(actual,gltf.animations);
  const prostrate=prayerAnimation(gltf.animations).find(c=>c.name==='prostrate'),next=gltf.animations.find(c=>c.name===nextAction);
  const current=mixer.clipAction(prostrate).play(),expectedCurrent=expectedMixer.clipAction(prostrate).play();
  baseline.restore();mixer.update(.1);baseline.capture();expectedMixer.update(.1);pose('prostrate',3.65);
  assert.ok(actual.getObjectByName('Body').quaternion.angleTo(reference.getObjectByName('Body').quaternion)>1,'starts in the deep bowed pose');
  current.fadeOut(.2);expectedCurrent.fadeOut(.2);mixer.clipAction(next).reset().fadeIn(.2).play();expectedMixer.clipAction(next).reset().fadeIn(.2).play();
  for(let frame=0;frame<120;frame++){
   baseline.restore();mixer.update(1/60);baseline.capture();expectedMixer.update(1/60);pose(nextAction,frame/60);
   for(const name of ['Root','Body','Head','LeftArm','RightArm','LeftLeg','LeftShin','RightLeg','RightShin']){
    const a=actual.getObjectByName(name),b=reference.getObjectByName(name);
    assert.ok(a.position.distanceTo(b.position)<.00001,`${name} translation must not retain kneeling offsets`);
    assert.ok(a.quaternion.clone().normalize().angleTo(b.quaternion.clone().normalize())<.0001,`${name} must not retain the prayer tilt`);
    assert.ok(a.scale.distanceTo(b.scale)<.00001);
   }
  }
  mixer.stopAllAction();expectedMixer.stopAllAction();
 });
}
