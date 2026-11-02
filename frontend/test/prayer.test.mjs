import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Vector3} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {createPrayerPose,prayerPhase,prostrationPhase} from '../src/game/characters/prayerPose.ts';

test('continuous prostration remains kneeling and keeps bowing beyond the three-bow sequence',()=>{
 let peaks=0,previous=false;
 for(let time=0;time<30;time+=.02){
  const phase=prostrationPhase(time),bowing=phase.bow>.9;
  if(bowing&&!previous)peaks++;previous=bowing;
  if(time>2.4){assert.equal(phase.kneel,1);assert.equal(phase.hands,1);}
 }
 assert.ok(peaks>10,'continues bowing after three repetitions');
 assert.equal(prostrationPhase(120).kneel,1);
});

test('prayer has exactly three complete bows between kneeling and standing',()=>{
 let peaks=0,wasBowing=false;
 for(let t=0;t<=12;t+=.02){const bowing=prayerPhase(t).bow>.9;if(bowing&&!wasBowing)peaks++;wasBowing=bowing;}
 assert.equal(peaks,3);
 assert.equal(prayerPhase(.8).kneel,0);
 assert.equal(prayerPhase(2.5).kneel,1);
 assert.equal(prayerPhase(12).kneel,0);
 assert.equal(prayerPhase(12).hands,0);
});
for(const avatar of ['male','female'])test(`${avatar}: joins palms, kneels, bows three times and returns to standing`,async()=>{
 const bytes=readFileSync(new URL(`../public/models/${avatar}_lam.glb`,import.meta.url));
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const model=gltf.scene,pose=createPrayerPose(model,gltf.animations);
 const point=name=>model.worldToLocal(model.getObjectByName(name).getWorldPosition(new Vector3()));
 const sample=(t,action='pray')=>{pose(action,t);model.updateMatrixWorld(true);return {head:point('Head'),left:point('LeftHand'),right:point('RightHand')};};
 const standing=sample(0),palms=sample(.9),kneeling=sample(2.5);
 assert.ok(palms.left.distanceTo(palms.right)<.12,'palms meet in front of the chest');
 assert.ok(palms.left.z>.2&&palms.right.z>.2,'hands stay in front');
 assert.ok(kneeling.head.y<standing.head.y-.15,'body lowers into kneeling');
 for(const t of [3.65,5.75,7.85]){
  const down=sample(t);assert.ok(down.head.y<kneeling.head.y-.25,'each bow lowers the head');
  assert.ok(down.head.z>kneeling.head.z+.3,'bows face forward');
  assert.ok(down.head.y>.4,'head does not pass through the floor');
 }
 const finished=sample(12);assert.ok(finished.head.distanceTo(standing.head)<.001,'ends standing in the original pose');
 for(const t of [14.15,26.75])assert.ok(sample(t,'prostrate').head.y<kneeling.head.y-.25,'continuous action keeps bowing after twelve seconds');
 assert.ok(sample(30,'prostrate').head.y<standing.head.y-.15,'continuous action never stands up on its own');
});
