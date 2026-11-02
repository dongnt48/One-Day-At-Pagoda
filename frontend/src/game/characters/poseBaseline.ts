import {type Object3D} from 'three';

/** Undo last frame's procedural offsets before the mixer's cached tracks run. */
export function createPoseBaseline(model:Object3D){
 const nodes:{object:Object3D;position:Object3D['position'];quaternion:Object3D['quaternion'];scale:Object3D['scale']}[]=[];
 model.traverse(object=>nodes.push({object,position:object.position.clone(),quaternion:object.quaternion.clone(),scale:object.scale.clone()}));
 return {
  restore(){for(const pose of nodes){pose.object.position.copy(pose.position);pose.object.quaternion.copy(pose.quaternion);pose.object.scale.copy(pose.scale);}},
  capture(){for(const pose of nodes){pose.position.copy(pose.object.position);pose.quaternion.copy(pose.object.quaternion);pose.scale.copy(pose.object.scale);}},
 };
}
