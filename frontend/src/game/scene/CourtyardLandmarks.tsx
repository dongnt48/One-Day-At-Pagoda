import {useEffect,useMemo,useRef,type RefObject} from 'react';
import {useFrame} from '@react-three/fiber';
import type {Room} from '@colyseus/sdk';
import {BufferGeometry,Float32BufferAttribute,Group,LatheGeometry,Vector2,type Material} from 'three';
import {courtyardLandmarks} from '../maps';
import {useSurface} from './materials';

function Beam({position,size,material,collider=false}:{position:[number,number,number];size:[number,number,number];material:Material;collider?:boolean}){
 return <mesh position={position} material={material} castShadow receiveShadow userData={{cameraCollider:collider}}><boxGeometry args={size}/></mesh>;
}

/** Ring profiles form sloping tiled roofs with raised eaves. */
function EavedRoof({radius,y,sides=8,height=.85}:{radius:number;y:number;sides?:number;height?:number}){
 const material=useSurface('roof',[3,2],'#a67459');
 const geometry=useMemo(()=>{
  const positions:number[]=[],uv:number[]=[],indices:number[]=[];
  const profile=[[1,.18],[.86,0],[.56,.42],[.18,1]];
  for(const [r,h] of profile)for(let i=0;i<=sides;i++){
   const a=i/sides*Math.PI*2+Math.PI/4;
   positions.push(Math.cos(a)*r,h,Math.sin(a)*r);uv.push(i/sides*4,r);
  }
  for(let ring=0;ring<profile.length-1;ring++)for(let i=0;i<sides;i++){
   const a=ring*(sides+1)+i,b=a+sides+1;
   indices.push(a,b,a+1,a+1,b,b+1);
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
 },[sides]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <group position={[0,y,0]}>
  <mesh geometry={geometry} scale={[radius,height,radius]} material={material} castShadow receiveShadow userData={{cameraCollider:true}}/>
  <mesh position={[0,.04,0]} rotation={[0,-Math.PI/4,0]}><cylinderGeometry args={[radius*.85,radius,.12,sides]}/><meshStandardMaterial color="#644331" roughness={.9}/></mesh>
  {Array.from({length:sides},(_,i)=>{
   const a=i/sides*Math.PI*2+Math.PI/4;
   return <mesh key={i} position={[Math.cos(a)*radius*.97,height*.18,Math.sin(a)*radius*.97]} rotation={[0,-a,Math.PI/2-.28]} castShadow><coneGeometry args={[.075,.48,6]}/><meshStandardMaterial color="#b68c60" roughness={.75}/></mesh>;
  })}
 </group>;
}

function BronzeBell({struckAt}:{struckAt:RefObject<number>}){
 const swing=useRef<Group>(null);
 useFrame(()=>{
  if(!swing.current)return;
  const elapsed=(performance.now()-struckAt.current)/1000;
  swing.current.rotation.x=elapsed<4?Math.sin(elapsed*18)*.055*Math.exp(-elapsed):0;
 });
 const geometry=useMemo(()=>new LatheGeometry([[.98,0],[1.03,.09],[.98,.18],[.79,.30],[.72,1.32],[.59,1.68],[.27,1.87],[.16,1.87],[.49,1.60],[.62,1.27],[.68,.26],[.90,.12],[.93,0]].map(([r,y])=>new Vector2(r,y)),40),[]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <group ref={swing} name="ringing-bronze-bell" position={[0,4.15,0]}><group position={[0,-2.4,0]}>
  <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color="#8e7140" metalness={.78} roughness={.46} side={2}/></mesh>
  {[.12,.38,1.25,1.52].map((y,i)=><mesh key={y} position={[0,y,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[i===0?.99:i===1?.79:i===2?.73:.65,.035,8,40]}/><meshStandardMaterial color="#c09b56" metalness={.8} roughness={.42}/></mesh>)}
  <mesh position={[0,2.04,0]}><torusGeometry args={[.19,.065,8,20]}/><meshStandardMaterial color="#71552f" metalness={.7} roughness={.5}/></mesh>
  <mesh position={[0,2.4,0]}><cylinderGeometry args={[.045,.045,.6,8]}/><meshStandardMaterial color="#46382b" metalness={.6}/></mesh>
  {Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return <mesh key={i} position={[Math.sin(a)*.74,.92,Math.cos(a)*.74]} scale={[.07,.14,.07]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color="#b18b4e" metalness={.75} roughness={.5}/></mesh>;})}
 </group></group>;
}

function BellTower({room}:{room?:Room|null}){
 const wood=useSurface('wood',[1,3],'#68503c'),stone=useSurface('stone',[2,2],'#b8afa0');
 const struckAt=useRef(-Infinity);
 useEffect(()=>room?.onMessage('bell',()=>{struckAt.current=performance.now();}),[room]);
 const p=courtyardLandmarks.bellTower;
 return <group name="bell-tower-ready" position={[p.x,0,p.z]}>
  <Beam position={[0,.015,0]} size={[6.4,.03,6.4]} material={stone}/>
  {[-1,1].flatMap(x=>[-1,1].map(z=><group key={`${x}-${z}`}>
   <Beam position={[x*2.25,.18,z*2.25]} size={[.7,.35,.7]} material={stone}/>
   <mesh position={[x*2.25,2.35,z*2.25]} material={wood} castShadow userData={{cameraCollider:true}}><cylinderGeometry args={[.20,.25,4.35,12]}/></mesh>
   <Beam position={[x*2.25,4.35,z*2.25]} size={[.75,.25,.75]} material={wood}/>
  </group>))}
  {[-1,1].map(s=><group key={s}>
   <Beam position={[0,4.5,s*2.25]} size={[5.1,.3,.3]} material={wood}/>
   <Beam position={[s*2.25,4.5,0]} size={[.3,.3,5.1]} material={wood}/>
  </group>)}
  <Beam position={[0,1.25,-2.25]} size={[4.4,.16,.15]} material={wood} collider/>
  <Beam position={[0,4.3,0]} size={[.3,.38,4.8]} material={wood}/>
  <BronzeBell struckAt={struckAt}/>
  <EavedRoof radius={4.9} y={4.65} sides={4} height={1.35}/>
  <EavedRoof radius={3.6} y={6.05} sides={4} height={1.15}/>
  <Beam position={[0,7.25,0]} size={[3.3,.16,.16]} material={wood}/>
 </group>;
}

function NineStoreyPagoda(){
 const stone=useSurface('stone',[2,3],'#c3b39a'),wood=useSurface('wood',[1,2],'#594233');
 const p=courtyardLandmarks.pagoda;
 return <group name="nine-storey-pagoda-ready" position={[p.x,0,p.z]}>
  {[0,1,2].map(i=><mesh key={i} position={[0,.12+i*.2,0]} material={stone} receiveShadow castShadow userData={{cameraCollider:true}}><cylinderGeometry args={[3.3-i*.25,3.45-i*.25,.24,8]}/></mesh>)}
  {Array.from({length:p.levels},(_,level)=>{
   const radius=2.35-level*.15,y=.65+level*1.48;
   return <group key={level} name={`pagoda-level-${level+1}`} position={[0,y,0]}>
    <mesh position={[0,.58,0]} material={stone} castShadow receiveShadow userData={{cameraCollider:true}}><cylinderGeometry args={[radius*.92,radius,1.16,8]}/></mesh>
    <mesh position={[0,.12,0]} material={stone} receiveShadow><cylinderGeometry args={[radius*1.08,radius*1.08,.16,8]}/></mesh>
    {Array.from({length:8},(_,side)=>{
     const angle=(side+.5)*Math.PI/4;
     return <group key={side} rotation={[0,angle,0]}>
      <Beam position={[0,.62,radius*.936]} size={[radius*.36,.64,.055]} material={wood}/>
      <Beam position={[0,.98,radius*.946]} size={[radius*.45,.10,.09]} material={stone}/>
     </group>;
    })}
    <EavedRoof radius={radius+1.02} y={1.08} height={.66}/>
   </group>;
  })}
  <group position={[0,.65+(p.levels-1)*1.48+1.75,0]}>
   <mesh position={[0,.7,0]} castShadow><coneGeometry args={[.20,1.4,8]}/><meshStandardMaterial color="#a48546" metalness={.65} roughness={.45}/></mesh>
   {[0,.25,.50].map((y,i)=><mesh key={y} position={[0,y+.12,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.30-i*.06,.045,8,20]}/><meshStandardMaterial color="#b99a57" metalness={.7} roughness={.45}/></mesh>)}
  </group>
 </group>;
}

export function CourtyardLandmarks({room}:{room?:Room|null}){return <group name="courtyard-landmarks"><BellTower room={room}/><NineStoreyPagoda/></group>;}
