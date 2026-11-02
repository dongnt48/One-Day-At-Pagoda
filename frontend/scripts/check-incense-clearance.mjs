import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {AnimationMixer,Matrix4,Vector3} from 'three';
// Match the visible stick geometry and pitch in Character.tsx.
const tilt=Number(process.env.INCENSE_TILT||.9),bottom=-.05,top=Number(process.env.INCENSE_TOP||.267);
for(const avatar of ['male','female']){
 const bytes=readFileSync(`public/models/${avatar}_lam.glb`);
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const model=gltf.scene;model.updateMatrixWorld(true);
 const head=model.getObjectByName('Head'),hand=model.getObjectByName('RightHand'),body=model.getObjectByName('Body');
 const restBody=body.quaternion.clone();
 const rest=head.matrixWorld.clone(),mixer=new AnimationMixer(model),clip=gltf.animations.find(c=>c.name==='incense');
 assert.ok(Math.abs(clip.duration-6)<.05,'Incense must last six seconds');
 mixer.clipAction(clip).play();let minimum=Infinity,bows=0,lowered=false;
 for(let frame=0;frame<=120;frame++){
  mixer.setTime(clip.duration*frame/120);model.updateMatrixWorld(true);
  const angle=body.quaternion.angleTo(restBody);
  if(angle>.20&&!lowered){bows++;lowered=true;}
  if(angle<.05)lowered=false;
  const undo=new Matrix4().multiplyMatrices(rest,head.matrixWorld.clone().invert());
  const grip=hand.getWorldPosition(new Vector3());
  for(const x of [-.018,0,.018])for(let j=0;j<=30;j++){
   const h=bottom+(top-bottom)*j/30;
   const p=grip.clone().add(new Vector3(x,h*Math.cos(tilt),h*Math.sin(tilt))).applyMatrix4(undo);
   const distance=(p.x/.475)**2+((p.y-1.29)/.445)**2+(p.z/.435)**2;
   minimum=Math.min(minimum,distance);
  }
 }
 assert.ok(minimum>1,`${avatar}: incense intersects padded head volume (${minimum.toFixed(3)})`);
 assert.equal(bows,3,`${avatar}: must complete exactly three distinct bows`);
 console.log(`${avatar}: three bows in six seconds; incense clears face throughout clip (${minimum.toFixed(3)})`);
}
