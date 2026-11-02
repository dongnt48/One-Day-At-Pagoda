import {AnimationClip,Quaternion,Vector3,type Object3D} from 'three';

export const PRAYER_SECONDS=12;
const smooth=(from:number,to:number,t:number)=>{const x=Math.max(0,Math.min(1,(t-from)/(to-from)));return x*x*(3-2*x);};
export function prayerPhase(time:number){
 const t=Math.max(0,time);
 let bow=0;
 for(const start of [2.8,4.9,7])if(t>=start&&t<=start+1.7)bow=Math.sin((t-start)/1.7*Math.PI)**2;
 return {kneel:smooth(.9,2.3,t)*(1-smooth(9,10.8,t)),hands:smooth(0,.9,t)*(1-smooth(10.8,12,t)),bow};
}

export function prostrationPhase(time:number){
 const t=Math.max(0,time),cycle=Math.max(0,t-2.8)%2.1;
 return {kneel:smooth(.9,2.3,t),hands:smooth(0,.9,t),bow:t>=2.8&&cycle<1.7?Math.sin(cycle/1.7*Math.PI)**2:0};
}

export function prayerAnimation(source:AnimationClip[]){
 const idle=source.find(c=>c.name==='idle');
 if(!idle)return [];
 const clip=idle.clone();clip.name='pray';clip.duration=PRAYER_SECONDS;
 const continuous=idle.clone();continuous.name='prostrate';return [clip,continuous];
}

/** Preserve each GLB's bone axes while blending standing and kneeling poses. */
export function createPrayerPose(model:Object3D,source:AnimationClip[]){
 const idle=source.find(c=>c.name==='idle'),kneeling=source.find(c=>c.name==='sit');
 // Sample the authored pose keys once; no per-frame skeleton cloning is needed.
 const vectors:{node:Object3D;property:'position'|'scale';standing:Vector3;kneeling:Vector3}[]=[];
 const rotations:{node:Object3D;standing:Quaternion;kneeling:Quaternion}[]=[];
 for(const track of idle?.tracks??[]){
  const match=/^(.*)\.(position|quaternion|scale)$/.exec(track.name);if(!match)continue;
  const node=model.getObjectByName(match[1]);if(!node)continue;
  const other=kneeling?.tracks.find(t=>t.name===track.name)??track;
  if(match[2]==='quaternion')rotations.push({node,standing:new Quaternion().fromArray(track.values),kneeling:new Quaternion().fromArray(other.values)});
  else vectors.push({node,property:match[2] as 'position'|'scale',standing:new Vector3().fromArray(track.values),kneeling:new Vector3().fromArray(other.values)});
 }
 const body=model.getObjectByName('Body'),root=model.getObjectByName('Root');
 const arms=['Left','Right'].map(side=>({side,arm:model.getObjectByName(`${side}Arm`),hand:model.getObjectByName(`${side}Hand`)}));
 const target=new Vector3(),current=new Vector3(),direction=new Vector3(),axis=new Vector3(1,0,0);
 const turn=new Quaternion(),base=new Quaternion(),desired=new Quaternion();
 return(action:string,time:number)=>{
  if(action!=='pray'&&action!=='prostrate')return;
  const phase=action==='prostrate'?prostrationPhase(time):prayerPhase(time);
  for(const p of vectors)p.node[p.property].lerpVectors(p.standing,p.kneeling,phase.kneel);
  for(const p of rotations)p.node.quaternion.slerpQuaternions(p.standing,p.kneeling,phase.kneel);
  if(body)body.quaternion.multiply(turn.setFromAxisAngle(axis,phase.bow*1.35));
  if(root)root.position.z+=phase.bow*.04;
  model.updateWorldMatrix(true,true);
  const hip=(root?.position.y??0)+(body?.position.y??.56);
  for(const {side,arm,hand} of arms){
   if(!arm?.parent||!hand)continue;
   const sign=side==='Left'?-1:1;
   target.set(sign*(.025+phase.bow*.20),(hip+.34)*(1-phase.bow)+.08*phase.bow,.29+phase.bow*.22);
   model.localToWorld(target);arm.parent.worldToLocal(target);
   direction.copy(target).sub(arm.position).normalize();
   current.copy(hand.position).applyQuaternion(arm.quaternion).normalize();
   turn.setFromUnitVectors(current,direction);base.copy(arm.quaternion);desired.copy(base).premultiply(turn);
   arm.quaternion.slerpQuaternions(base,desired,phase.hands);arm.updateWorldMatrix(false,true);
  }
 };
}
