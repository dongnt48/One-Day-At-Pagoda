import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {setBarefoot} from '../src/game/characters/footwear.ts';

for(const avatar of ['male','female'])test(`${avatar}: remove sandals in hall and restore them outside without affecting other players`,async()=>{
 const bytes=readFileSync(new URL(`../public/models/${avatar}_lam.glb`,import.meta.url));
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const hall=clone(gltf.scene),outside=clone(gltf.scene);
 const meshes=[];hall.traverse(o=>{if(o.isMesh)meshes.push(o);});
 const sandals=meshes.filter(o=>/sandal/i.test(o.material.name));assert.ok(sandals.length>0);
 setBarefoot(hall,true);
 for(const mesh of meshes)assert.equal(mesh.visible,!sandals.includes(mesh),'only sandals are hidden');
 for(const model of [gltf.scene,outside])model.traverse(o=>{if(o.isMesh)assert.equal(o.visible,true,'shared GLB and other players are unchanged');});
 setBarefoot(hall,false);for(const mesh of meshes)assert.equal(mesh.visible,true,'sandals return after leaving the hall');
 setBarefoot(hall,true);for(const mesh of sandals)assert.equal(mesh.visible,false,'entering again also removes sandals');
});
