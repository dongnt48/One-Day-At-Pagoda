import {Quaternion,Vector3,type AnimationClip} from 'three';

/** Dedicated hand motions work with both existing companion skeletons. */
export function kitchenAnimations(source:AnimationClip[]){
 // Keep the GLB's authored bone orientations and full standing pose.
 return [['cook','idle'],['wash','idle'],['bell','wave'],['seated','eat']].flatMap(([name,base])=>{
  const original=source.find(clip=>clip.name===base);if(!original)return [];
  const clip=original.clone();clip.name=name;
  if(name==='seated'){
   const idle=source.find(c=>c.name==='idle');
   clip.tracks=clip.tracks.map(track=>{
    if(!/^(Left|Right)(Arm|Hand)\./.test(track.name))return track;
    return idle?.tracks.find(t=>t.name===track.name)?.clone()??track;
   });
   return [clip];
  }
  const arm=clip.tracks.find(track=>track.name==='RightArm.quaternion');
  if(arm){
   const q=new Quaternion(),turn=new Quaternion(),axis=new Vector3(0,1,0);
   for(let i=0;i<arm.times.length;i++){
    q.fromArray(arm.values,i*4);turn.setFromAxisAngle(axis,Math.sin(arm.times[i]/clip.duration*Math.PI*2)*.16);
    q.multiply(turn).toArray(arm.values,i*4);
   }
  }
  return [clip];
 });
}
