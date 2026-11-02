import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BoxGeometry,Group,Mesh,MeshBasicMaterial,Raycaster,Vector3} from 'three';
import {diningWallLayout,diningGableGeometry} from '../src/game/scene/diningEnvelope.ts';

test('dining walls enclose all sides up to the roof and leave only the entrance open',()=>{
 const room=new Group(),material=new MeshBasicMaterial();
 for(const part of diningWallLayout(16,14)){
  const mesh=new Mesh(new BoxGeometry(...part.size),material);mesh.position.set(...part.position);room.add(mesh);
 }
 const gable=diningGableGeometry(16);
 for(const z of [-14.4,14]){const mesh=new Mesh(gable,material);mesh.position.z=z;room.add(mesh);}
 room.updateMatrixWorld(true);
 const hits=(x,y,z,dx,dz)=>new Raycaster(new Vector3(x,y,z),new Vector3(dx,0,dz),0,40).intersectObject(room,true).length>0;
 for(const y of [.15,1,1.3,2.5,3.85,4.5,5.6]){
  for(const z of [-13,-10,-2,6,13])for(const side of [-1,1])assert.ok(hits(0,y,z,side,0),`side wall y=${y} z=${z}`);
  for(const x of [-15,-8,0,8,15])assert.ok(hits(x,y,0,0,-1),`rear wall x=${x} y=${y}`);
  for(const x of [-15,-8,-3,3,8,15])assert.ok(hits(x,y,0,0,1),`front wall x=${x} y=${y}`);
 }
 for(const y of [.2,1.5,3.8])assert.equal(hits(0,y,12,0,1),false,'entrance remains open');
 for(const y of [4.3,5.6,6.5,7.5])for(const side of [-1,1])assert.ok(hits(0,y,0,0,side),'lintel and gables meet the roof');
 for(const child of room.children)if(child.geometry!==gable)child.geometry.dispose();gable.dispose();material.dispose();
});
