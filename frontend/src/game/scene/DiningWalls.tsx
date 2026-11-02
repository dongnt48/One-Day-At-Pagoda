import {useEffect,useMemo} from 'react';
import {diningWallLayout,diningGableGeometry} from './diningEnvelope';
import {useSurface} from './materials';

export function DiningWalls({halfX,halfZ}:{halfX:number;halfZ:number}){
 const parts=useMemo(()=>diningWallLayout(halfX,halfZ),[halfX,halfZ]);
 const gable=useMemo(()=>diningGableGeometry(halfX),[halfX]);
 const wood=useSurface('wood',[1,4],'#796450');
 useEffect(()=>()=>gable.dispose(),[gable]);
 return <group name="dining-walls-ready">
  {parts.map(part=><mesh key={part.name} name={`dining-wall-${part.name}`} position={part.position} castShadow receiveShadow userData={{cameraCollider:true}}><boxGeometry args={part.size}/><meshStandardMaterial color="#c9b89a" roughness={1}/></mesh>)}
  {[-1,1].map(side=><group key={side}>
   <mesh geometry={gable} position={[0,0,side<0?-halfZ-.4:halfZ]} castShadow receiveShadow userData={{cameraCollider:true}}><meshStandardMaterial color="#c9b89a" roughness={1}/></mesh>
   <mesh position={[side*(halfX-.015),.18,0]} receiveShadow><boxGeometry args={[.06,.36,halfZ*2]}/><meshStandardMaterial color="#a49b84" roughness={1}/></mesh>
   <mesh position={[side*(halfX-.015),5.55,0]} material={wood} castShadow><boxGeometry args={[.10,.22,halfZ*2]}/></mesh>
   {[-10,-6,-2,2,6,10].map(z=><mesh key={z} position={[side*(halfX-.015),3.05,z]} material={wood} receiveShadow><boxGeometry args={[.07,5.05,.10]}/></mesh>)}
  </group>)}
 </group>;
}
