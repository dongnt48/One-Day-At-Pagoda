import {useSurface} from './materials';
/** Compact communal kitchen on the existing counter, clear of the serving bays. */
export function DiningKitchen(){
 const stone=useSurface('stone',[2,1],'#797a72');
 return <group name="dining-kitchen" position={[0,0,-13.2]}>
  <mesh position={[0,1.04,0]} material={stone} receiveShadow><boxGeometry args={[6.5,.12,1.5]}/></mesh>
  {/* Two recessed stovetops with cast iron trivets and stainless stockpots. */}
  {[-1.8,0].map(x=><group key={x} position={[x,1.13,0]}>
   <mesh><boxGeometry args={[1.45,.12,1.2]}/><meshStandardMaterial color="#333637" metalness={.55} roughness={.5}/></mesh>
   <mesh position={[0,.09,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.36,.035,8,32]}/><meshStandardMaterial color="#222321" roughness={.85}/></mesh>
   {[0,Math.PI/2].map(a=><mesh key={a} position={[0,.1,0]} rotation={[0,a,0]}><boxGeometry args={[.87,.045,.045]}/><meshStandardMaterial color="#242424"/></mesh>)}
   <mesh position={[0,.42,0]} castShadow><cylinderGeometry args={[.40,.36,.60,32,1,true]}/><meshStandardMaterial color="#b7bab0" metalness={.8} roughness={.3} side={2}/></mesh>
   <mesh position={[0,.73,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.4,.025,8,32]}/><meshStandardMaterial color="#d1d2c8" metalness={.85} roughness={.25}/></mesh>
   {[-1,1].map(s=><mesh key={s} position={[s*.48,.51,0]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.11,.025,8,16]}/><meshStandardMaterial color="#767a76" metalness={.75} roughness={.4}/></mesh>)}
   <mesh position={[0,.62,0]}><cylinderGeometry args={[.365,.365,.035,32]}/><meshStandardMaterial color="#bc9550" roughness={.35}/></mesh>
   {[-.16,.1].map((dx,i)=><mesh key={dx} position={[dx,.65,i*.18-.09]} rotation={[0,i,0]} scale={[.11,.025,.07]}><sphereGeometry args={[1,10,6]}/><meshStandardMaterial color="#748343"/></mesh>)}
   <mesh position={[.20,.85,.08]} rotation={[0,0,-.25]}><cylinderGeometry args={[.018,.018,.65,8]}/><meshStandardMaterial color="#8c6945"/></mesh>
   <mesh position={[0,-.03,.64]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.06,.06,.06,12]}/><meshStandardMaterial color="#232624"/></mesh>
  </group>)}
  {/* Preparation board and fresh vegetables. */}
  <mesh position={[2,1.14,0]} castShadow><boxGeometry args={[1.45,.08,.85]}/><meshStandardMaterial color="#a17a4e" roughness={.85}/></mesh>
  {[0,1,2,3,4].map(i=><mesh key={i} position={[1.7+i*.13,1.22,Math.sin(i)*.18]} rotation={[0,i*.6,0]} scale={[.17,.035,.09]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color={i%2?'#648041':'#81964f'} roughness={.8}/></mesh>)}
  {/* Wall shelf, bowls and extraction hood replace the oversized signs. */}
  <mesh position={[0,3,-.25]}><boxGeometry args={[4.2,.3,1.2]}/><meshStandardMaterial color="#777d78" metalness={.65} roughness={.45}/></mesh>
  <mesh position={[0,4,-.45]}><boxGeometry args={[.8,1.7,.6]}/><meshStandardMaterial color="#676f69" metalness={.6} roughness={.5}/></mesh>
  <mesh position={[3.1,2.35,-.45]}><boxGeometry args={[1.5,.09,.65]}/><meshStandardMaterial color="#7a6047" roughness={.9}/></mesh>
  {[0,1,2].map(i=><mesh key={i} position={[2.65+i*.45,2.5,-.45]}><cylinderGeometry args={[.17,.09,.22,20,1,true]}/><meshStandardMaterial color="#e4dcc7" roughness={.45} side={2}/></mesh>)}
  {/* Dishwashing station sits beside tray return, with a clear approach. */}
  <group name="dishwashing-station" position={[11.5,0,0]}>
   <mesh position={[0,1.055,0]} receiveShadow><boxGeometry args={[2.65,.1,1.4]}/><meshStandardMaterial color="#a0aaa5" metalness={.7} roughness={.35}/></mesh>
   <mesh position={[-.20,1.115,0]}><boxGeometry args={[1.55,.025,1.02]}/><meshStandardMaterial color="#364948" metalness={.5} roughness={.4}/></mesh>
   <mesh position={[-.20,1.135,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[1.42,.89]}/><meshStandardMaterial color="#9dbab7" transparent opacity={.65} roughness={.18} metalness={.25}/></mesh>
   {[-1,1].map(s=><group key={s}>
    <mesh position={[-.20+s*.79,1.15,0]}><boxGeometry args={[.055,.075,1.1]}/><meshStandardMaterial color="#c7cfca" metalness={.8} roughness={.3}/></mesh>
    <mesh position={[-.20,1.15,s*.53]}><boxGeometry args={[1.6,.075,.055]}/><meshStandardMaterial color="#c7cfca" metalness={.8} roughness={.3}/></mesh>
   </group>)}
   <mesh position={[-.2,1.45,-.48]}><cylinderGeometry args={[.035,.045,.62,12]}/><meshStandardMaterial color="#c0cbc7" metalness={.85} roughness={.25}/></mesh>
   <mesh position={[-.2,1.74,-.27]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.035,.035,.45,12]}/><meshStandardMaterial color="#c0cbc7" metalness={.85} roughness={.25}/></mesh>
   <mesh position={[-.2,1.44,-.06]}><cylinderGeometry args={[.015,.022,.57,8]}/><meshStandardMaterial color="#c2e4e1" transparent opacity={.55} roughness={.12}/></mesh>
   <mesh position={[.97,1.24,-.32]}><cylinderGeometry args={[.07,.065,.25,12]}/><meshStandardMaterial color="#91a477" roughness={.4}/></mesh>
   <mesh position={[.97,1.39,-.32]}><boxGeometry args={[.15,.035,.045]}/><meshStandardMaterial color="#495d4f"/></mesh>
   <mesh position={[.98,1.14,.25]}><boxGeometry args={[.25,.06,.16]}/><meshStandardMaterial color="#bbb16c" roughness={.95}/></mesh>
   <group name="clean-dish-rack" position={[1.8,1.15,0]}>
    <mesh><boxGeometry args={[.85,.06,1.1]}/><meshStandardMaterial color="#7d8983" metalness={.6} roughness={.5}/></mesh>
    {[0,1,2,3].map(i=><mesh key={i} position={[0,.24,-.36+i*.24]} rotation={[Math.PI/2-.2,0,0]}><cylinderGeometry args={[.24,.22,.035,24]}/><meshStandardMaterial color="#e8e2d1" roughness={.35}/></mesh>)}
   </group>
  </group>
 </group>;
}
