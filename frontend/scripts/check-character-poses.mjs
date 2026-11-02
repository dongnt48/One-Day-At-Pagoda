import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {AnimationMixer,Vector3,Box3} from 'three';
for(const name of ['male','female']){
 const b=readFileSync(`public/models/${name}_lam.glb`);const gltf=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 const a=clone(gltf.scene),other=clone(gltf.scene);assert.notEqual(a.getObjectByName('Head'),other.getObjectByName('Head'));
 const mixer=new AnimationMixer(a);let idleHeight;
 for(const clip of gltf.animations){mixer.stopAllAction();mixer.clipAction(clip).play();mixer.update(clip.duration*.5);a.updateMatrixWorld(true);const head=a.getObjectByName('Head').getWorldPosition(new Vector3());a.traverse(o=>{if(o.isSkinnedMesh)o.computeBoundingBox();});const box=new Box3().setFromObject(a);assert.ok(Number.isFinite(head.y)&&box.max.y<3&&box.min.y>-.25,`${name} ${clip.name}: invalid bounds ${box.min.y}..${box.max.y}`);if(clip.name==='idle')idleHeight=head.y;console.log(name,clip.name,'headY',head.y.toFixed(2));}
 const idle=gltf.animations.find(a=>a.name==='idle'),sit=gltf.animations.find(a=>a.name==='sit');mixer.stopAllAction();mixer.clipAction(idle).play();mixer.update(.2);a.updateMatrixWorld(true);idleHeight=a.getObjectByName('Head').getWorldPosition(new Vector3()).y;mixer.stopAllAction();mixer.clipAction(sit).play();mixer.update(.2);a.updateMatrixWorld(true);assert.ok(a.getObjectByName('Head').getWorldPosition(new Vector3()).y<idleHeight-.15,'Kneeling must lower the body');
}
