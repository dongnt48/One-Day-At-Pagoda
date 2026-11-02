import {Quaternion,Vector3,type Object3D} from 'three';

/** Aim each authored arm toward a working point in front of the character. */
export function createKitchenPose(model:Object3D){
 const arms=['Left','Right'].map(side=>({
  side,arm:model.getObjectByName(`${side}Arm`),hand:model.getObjectByName(`${side}Hand`),
 }));
 const target=new Vector3(),current=new Vector3(),direction=new Vector3(),turn=new Quaternion();
 return(action:string,time:number)=>{
  if(action!=='cook'&&action!=='wash')return;
  model.updateWorldMatrix(true,true);
  for(const {side,arm,hand} of arms){
   if(!arm?.parent||!hand)continue;
   if(action==='cook'){
    if(side==='Right')target.set(.18+Math.cos(time*3)*.04,1.13,.32+Math.sin(time*3)*.05);
    else target.set(-.25,1.02,.34);
   }else{
    if(side==='Right')target.set(-.01+Math.sin(time*9)*.035,1.08,.34+Math.cos(time*9)*.02);
    else target.set(-.13,1.02,.34);
   }
   model.localToWorld(target);arm.parent.worldToLocal(target);
   direction.copy(target).sub(arm.position).normalize();
   current.copy(hand.position).applyQuaternion(arm.quaternion).normalize();
   turn.setFromUnitVectors(current,direction);
   arm.quaternion.premultiply(turn).normalize();
   arm.updateWorldMatrix(false,true);
  }
 };
}
