import {Mesh,type Object3D} from 'three';

/** Sandals are a separate skinned primitive on both existing avatars. */
export function setBarefoot(model:Object3D,barefoot:boolean){
 model.traverse(object=>{
  if(object instanceof Mesh&&!Array.isArray(object.material)&&/sandal/i.test(object.material.name))object.visible=!barefoot;
 });
}
