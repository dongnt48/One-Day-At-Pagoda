import {useEffect,useMemo,useRef,type RefObject} from 'react';
import {useFrame} from '@react-three/fiber';
import {Group,InstancedMesh,Object3D,Quaternion,Vector3} from 'three';
import {broomStrawGeometry,wateringBucketGeometry} from './handToolGeometry';

/** The handle's upper midpoint is the origin, aligned with the character's palm. */
export function WateringCan(){
 const bucket=useMemo(wateringBucketGeometry,[]),drops=useRef<InstancedMesh>(null);
 const stamp=useMemo(()=>new Object3D(),[]);
 const spout=useMemo(()=>{
  const base=new Vector3(0,-.29,.14),end=new Vector3(0,-.13,.49),direction=end.clone().sub(base);
  return {end,center:base.clone().add(end).multiplyScalar(.5),length:direction.length(),rotation:new Quaternion().setFromUnitVectors(new Vector3(0,1,0),direction.normalize())};
 },[]);
 useEffect(()=>()=>bucket.dispose(),[bucket]);
 useFrame(({clock})=>{
  if(!drops.current)return;
  for(let i=0;i<12;i++){
   const t=(clock.elapsedTime*1.5+i/12)%1;
   stamp.position.set(Math.sin(i*2.4)*(.015+t*.035),-.13-t*t*.36,.54+t*.15);
   stamp.scale.set(.007,.014+t*.012,.007);stamp.updateMatrix();drops.current.setMatrixAt(i,stamp.matrix);
  }
  drops.current.instanceMatrix.needsUpdate=true;
 });
 return <group name="held-watering-can">
  <mesh geometry={bucket} castShadow receiveShadow><meshStandardMaterial color="#71877b" metalness={.6} roughness={.48}/></mesh>
  {[-.12,-.435].map((y,i)=><mesh key={y} position={[0,y,0]} rotation={[Math.PI/2,0,0]} castShadow><torusGeometry args={[i?.14:.183,.009,8,32]}/><meshStandardMaterial color="#a7b3a9" metalness={.75} roughness={.4}/></mesh>)}
  <mesh position={[0,-.16,0]} castShadow><torusGeometry args={[.16,.018,8,24,Math.PI]}/><meshStandardMaterial color="#677b6e" metalness={.65} roughness={.5}/></mesh>
  {[-1,1].map(side=><mesh key={side} position={[side*.16,-.16,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.025,.025,.025,12]}/><meshStandardMaterial color="#a6afa1" metalness={.8} roughness={.35}/></mesh>)}
  <mesh position={spout.center.toArray()} quaternion={spout.rotation} castShadow><cylinderGeometry args={[.035,.05,spout.length,16]}/><meshStandardMaterial color="#71877b" metalness={.65} roughness={.45}/></mesh>
  <group name="watering-sprinkler" position={spout.end.toArray()} quaternion={spout.rotation}>
   <mesh castShadow><cylinderGeometry args={[.074,.04,.065,20]}/><meshStandardMaterial color="#a5b0a5" metalness={.75} roughness={.38}/></mesh>
   {Array.from({length:9},(_,i)=>{const angle=i/8*Math.PI*2,r=i===8?0:.045;return <mesh key={i} position={[Math.cos(angle)*r,.034,Math.sin(angle)*r]}><cylinderGeometry args={[.006,.006,.003,6]}/><meshStandardMaterial color="#3a4942" roughness={.85}/></mesh>;})}
  </group>
  <mesh position={[0,-.20,0]}><cylinderGeometry args={[.159,.159,.006,24]}/><meshStandardMaterial color="#749eaa" transparent opacity={.55} roughness={.2}/></mesh>
  <instancedMesh name="watering-drops" ref={drops} args={[undefined,undefined,12]} frustumCulled={false}><sphereGeometry args={[1,6,4]}/><meshStandardMaterial color="#b4dae0" transparent opacity={.65} roughness={.12}/></instancedMesh>
 </group>;
}

export function StrawBroom({shaft,head}:{shaft:RefObject<Group|null>;head:RefObject<Group|null>}){
 const straw=useMemo(broomStrawGeometry,[]);
 useEffect(()=>()=>straw.dispose(),[straw]);
 return <group name="held-straw-broom">
  <mesh position={[0,.10,0]} castShadow><cylinderGeometry args={[.022,.023,.24,12]}/><meshStandardMaterial color="#8c6b43" roughness={.87}/></mesh>
  <mesh position={[0,.225,0]}><sphereGeometry args={[.023,8,6]}/><meshStandardMaterial color="#98784c" roughness={.9}/></mesh>
  <group ref={shaft} name="broom-shaft"><mesh position={[0,-.5,0]} castShadow><cylinderGeometry args={[.022,.026,1,12]}/><meshStandardMaterial color="#98764b" roughness={.9}/></mesh></group>
  <group ref={head} name="broom-straw-head">
   <mesh geometry={straw} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={1}/></mesh>
   <mesh position={[0,-.012,0]} castShadow><cylinderGeometry args={[.04,.046,.048,12]}/><meshStandardMaterial color="#786044" roughness={1}/></mesh>
   {[-.028,.004].map(y=><mesh key={y} position={[0,y,0]} rotation={[Math.PI/2,0,0]} scale={[1, .8,1]}><torusGeometry args={[.044,.006,6,16]}/><meshStandardMaterial color="#b39662" roughness={.95}/></mesh>)}
  </group>
 </group>;
}
