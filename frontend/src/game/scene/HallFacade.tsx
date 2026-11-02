import {useEffect,useMemo,type ReactNode} from 'react';
import {useTexture} from '@react-three/drei';
import {SRGBColorSpace} from 'three';
import {useSurface} from './materials';
import {HallStatue} from './MainHall';

/** Courtyard exterior, centred on the existing hall transfer at (0, -9). */
export function HallFacade({children}:{children:ReactNode}){
 const wood=useSurface('wood',[1,3],'#66503d');
 const floor=useSurface('wood',[5,3],'#79604a');
 const stone=useSurface('stone',[1,1],'#b6ad97');
 const source=useTexture('/textures/altar-mural.jpg');
 const mural=useMemo(()=>{const t=source.clone();t.colorSpace=SRGBColorSpace;t.needsUpdate=true;return t;},[source]);
 useEffect(()=>()=>mural.dispose(),[mural]);
 return <group position={[0,0,-13]} name="hall-facade-ready">
  <mesh position={[0,-.035,0]} material={floor} receiveShadow><boxGeometry args={[16,.07,8]}/></mesh>
  <mesh position={[0,2.05,-3.75]} receiveShadow userData={{cameraCollider:true}}><boxGeometry args={[15.3,4.1,.22]}/><meshStandardMaterial color="#b8b09a" roughness={1}/></mesh>
  <mesh position={[0,2.25,-3.6]} material={wood}><boxGeometry args={[10.7,3.65,.12]}/></mesh>
  <mesh position={[0,2.25,-3.52]}><planeGeometry args={[10.4,3.4]}/><meshStandardMaterial map={mural} roughness={1}/></mesh>
  <mesh position={[0,.34,-2.45]} material={wood} castShadow><boxGeometry args={[4.3,.68,1.9]}/></mesh>
  <mesh position={[0,.71,-2.45]} material={wood}><boxGeometry args={[4.55,.12,2]}/></mesh>
  <HallStatue position={[0,.77,-2.55]} scale={.88}/>
  {[-1.75,1.75].map(x=><group key={x} position={[x,.77,-1.85]}>
   <mesh position={[0,.19,0]}><cylinderGeometry args={[.07,.15,.38,12]}/><meshStandardMaterial color="#b59a57" metalness={.6} roughness={.4}/></mesh>
   <mesh position={[0,.48,0]}><cylinderGeometry args={[.07,.07,.24,10]}/><meshStandardMaterial color="#fff0ce" emissive="#8d6e36" emissiveIntensity={.2}/></mesh>
  </group>)}
  {[-1,1].map(side=><group key={side}>
   <mesh position={[side*7.5,2.05,0]} receiveShadow userData={{cameraCollider:true}}><boxGeometry args={[.22,4.1,7.5]}/><meshStandardMaterial color="#b8b09a" roughness={1}/></mesh>
   {/* Solid walls replace the old lattice. Buried trim had coplanar faces
       with the plaster, causing dark flickering as the camera moved. */}
   {/* Closed side bays; only the opening between the two central posts remains. */}
   <mesh position={[side*4.9,2.05,3.02]} material={wood} castShadow receiveShadow userData={{cameraCollider:true}}><boxGeometry args={[5.2,4.1,.18]}/></mesh>
   {Array.from({length:10},(_,i)=>2.5+i*.5).map(x=><mesh key={x} position={[side*x,2.05,3.13]} material={wood}><boxGeometry args={[.055,4,.045]}/></mesh>)}
   {[.45,1.5,2.65,3.75].map(y=><mesh key={y} position={[side*4.9,y,3.15]} material={wood}><boxGeometry args={[5.2,.08,.06]}/></mesh>)}
  </group>)}
  <mesh position={[0,3.85,3.02]} material={wood} castShadow><boxGeometry args={[4.6,.5,.18]}/></mesh>
  {[-7,-4.6,-2.3,2.3,4.6,7].map(x=><group key={x}>
   <mesh position={[x,.1,3.1]} material={stone}><cylinderGeometry args={[.32,.37,.2,16]}/></mesh>
   <mesh position={[x,2.1,3.1]} material={wood} castShadow userData={{cameraCollider:true}}><cylinderGeometry args={[.19,.24,4,20]}/></mesh>
  </group>)}
  {[-3.4,-1.4,.6,2.6].map(z=><mesh key={z} position={[0,4.08,z]} material={wood}><boxGeometry args={[15.3,.23,.25]}/></mesh>)}
  <mesh position={[0,4.19,0]} material={wood}><boxGeometry args={[17.1,.12,9.4]}/></mesh>
  {/* Enclose the raised roof tier so it does not appear to float above the hall. */}
  <mesh position={[0,5.2,0]} material={wood} castShadow><boxGeometry args={[10.8,1.6,5.6]}/></mesh>
  <mesh position={[0,6.13,0]} material={wood}><boxGeometry args={[12.4,.14,6.6]}/></mesh>
  {[-5,5].map(x=><group key={x} position={[x,3.25,2.1]}>
   <mesh><capsuleGeometry args={[.17,.3,4,12]}/><meshStandardMaterial color="#fff0cb" emissive="#ffdfa3" emissiveIntensity={.6}/></mesh>
   <mesh position={[0,.55,0]} material={wood}><cylinderGeometry args={[.018,.018,.6,6]}/></mesh>
  </group>)}
  <pointLight position={[0,3.3,-.7]} color="#ffe6b5" intensity={18} distance={9} decay={2}/>
  {children}
 </group>;
}
