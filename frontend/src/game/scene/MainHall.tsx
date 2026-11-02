import { IncenseBurner } from './IncenseBurner';
import {useMemo,useEffect,useLayoutEffect,useRef} from 'react';
import {useGLTF,useTexture} from '@react-three/drei';
import {InstancedMesh,Object3D,Mesh,MeshStandardMaterial,SRGBColorSpace,type Material} from 'three';
import {useSurface} from './materials';
import {cushionShape,cushionSpots} from './hallSurface';

type Piece={p:[number,number,number];s:[number,number,number];r?:[number,number,number]};
function Timbers({items,material,name}:{items:Piece[];material:Material;name?:string}){
 const ref=useRef<InstancedMesh>(null);
 useLayoutEffect(()=>{const o=new Object3D();items.forEach((v,i)=>{o.position.set(...v.p);o.scale.set(...v.s);o.rotation.set(...(v.r??[0,0,0]));o.updateMatrix();ref.current!.setMatrixAt(i,o.matrix);});ref.current!.instanceMatrix.needsUpdate=true;ref.current!.computeBoundingSphere();},[items]);
 return <instancedMesh name={name} ref={ref} args={[undefined,material,items.length]} castShadow receiveShadow><boxGeometry/></instancedMesh>;
}
export function HallStatue({position=[0,1.22,-32],scale=2.3}:{position?:[number,number,number];scale?:number}){
 const {scene}=useGLTF('/models/hall-statue.glb');
 const copy=useMemo(()=>{const c=scene.clone(true);c.traverse(o=>{if(o instanceof Mesh){o.castShadow=true;o.receiveShadow=true;}});return c;},[scene]);
 return <primitive object={copy} position={position} scale={scale} dispose={null}/>;
}
function Lantern({x,z}:{x:number;z:number}){
 return <group position={[x,7.8,z]}>
  <mesh position={[0,1.1,0]}><cylinderGeometry args={[.025,.025,1.5,6]}/><meshStandardMaterial color="#282019"/></mesh>
  <mesh><capsuleGeometry args={[.32,.65,5,12]}/><meshStandardMaterial color="#fff5d3" emissive="#ffdb99" emissiveIntensity={.65} roughness={.9}/></mesh>
  {[-.53,.53].map(y=><mesh key={y} position={[0,y,0]}><cylinderGeometry args={[.24,.24,.07,12]}/><meshStandardMaterial color="#382a1b"/></mesh>)}
 </group>;
}

/** Architecture follows existing hall bounds, columns and interaction coordinates. */
export function MainHall(){
 const floor=useSurface('wood',[14,19],'#665040');
 const wood=useSurface('wood',[1,5],'#514032');
 const ground=useSurface('ground',[35,35],'#9a9b73');
 const stone=useSurface('stone',[3,4],'#8e8b78');
 const source=useTexture('/textures/altar-mural.jpg');
 const mural=useMemo(()=>{const t=source.clone();t.colorSpace=SRGBColorSpace;t.needsUpdate=true;return t;},[source]);
 useEffect(()=>()=>mural.dispose(),[mural]);
 const structure=useMemo<Piece[]>(()=>{
  const p:Piece[]=[];
  for(const z of [-34,-26,-18,-10,-2,6,14,22,30,35]){
   // Keep the central sightline clear; tie beams stay over the side aisles.
   for(const side of [-1,1])p.push({p:[side*20,8.7,z],s:[12,.42,.45]});
   for(const side of [-1,1]){
    p.push({p:[side*13,10.3,z],s:[26.4,.2,.26],r:[0,0,-side*.12]});
    p.push({p:[side*24,8.15,z],s:[2.5,.25,1.3]});
   }
  }
  for(const x of [-25.6,-24,0,24,25.6])p.push({p:[x,x===0?12:8.6,0],s:[.38,.42,72]});
  // Lattice stays above the clear lower openings.
  for(const side of [-1,1]){
   for(let z=-34;z<=34;z+=1.15)p.push({p:[side*25.85,6.8,z],s:[.12,3,.09]});
   for(const y of [2.5,5.3,6.1,6.9,7.7,8.4])p.push({p:[side*25.85,y,0],s:[.15,.1,72]});
   for(const z of [-34,-26,-18,-10,-2,6,14,22,30,35])p.push({p:[side*25.85,5.45,z],s:[.18,6,.22]});
  }
  // Rear doorway stays open at the courtyard transfer point.
  for(const side of [-1,1]){
   p.push({p:[side*3.2,3.7,35.8],s:[.5,7.4,.6]});
   p.push({p:[side*14.7,5.4,35.8],s:[22.5,.18,.3]});
  }
  p.push({p:[0,7.6,35.8],s:[7,.4,.7]});
  return p;
 },[]);
 const pads=cushionSpots;
 const cushionMaterials=useMemo(()=>[
  new MeshStandardMaterial({color:'#666959',roughness:1}),
  new MeshStandardMaterial({color:'#828471',roughness:1}),
 ],[]);
 useEffect(()=>()=>cushionMaterials.forEach(m=>m.dispose()),[cushionMaterials]);
 const cushionLayers=useMemo(()=>[
  pads.map(p=>({p:[p.x,cushionShape.baseY,p.z],s:[cushionShape.width,cushionShape.baseHeight,cushionShape.depth]} as Piece)),
  pads.map(p=>({p:[p.x,cushionShape.topY,p.z],s:[cushionShape.topWidth,cushionShape.topHeight,cushionShape.topDepth]} as Piece)),
 ],[pads]);
 return <group name="main-hall-ready">
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.13,0]} material={ground} receiveShadow><planeGeometry args={[210,210]}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.005,0]} material={floor} receiveShadow><planeGeometry args={[52,72]}/></mesh>
  <Timbers items={structure} material={wood}/>
  {[-1,1].map(side=><group key={side}>
   <mesh position={[side*26.15,1.2,0]} receiveShadow userData={{cameraCollider:true}}><boxGeometry args={[.3,2.4,72]}/><meshStandardMaterial color="#b1ac93" roughness={1}/></mesh>
   <mesh position={[side*13,10.4,0]} rotation={[0,0,-side*.12]} material={wood} receiveShadow castShadow userData={{cameraCollider:true}}><boxGeometry args={[26.5,.22,73]}/></mesh>
   {[-26,-10,6,22].map(z=><group key={z} position={[side*24,0,z]}>
    <mesh position={[0,.16,0]} material={stone}><cylinderGeometry args={[.72,.79,.32,16]}/></mesh>
    <mesh position={[0,4.45,0]} material={wood} castShadow userData={{cameraCollider:true}}><cylinderGeometry args={[.52,.61,8.6,20]}/></mesh>
    <mesh position={[0,8.5,0]} material={wood}><boxGeometry args={[1.5,.4,1.5]}/></mesh>
   </group>)}
   {[-38,0,38].map((z,i)=><mesh key={z} position={[side*(68+i*6),-3,z]} scale={[28,12+i*3,30]}><sphereGeometry args={[1,24,12]}/><meshStandardMaterial color={i%2?'#63704c':'#7d835d'} roughness={1}/></mesh>)}
  </group>)}
  <mesh position={[0,5.8,-36.1]} receiveShadow userData={{cameraCollider:true}}><boxGeometry args={[52,11.6,.35]}/><meshStandardMaterial color="#a49c82" roughness={1}/></mesh>
  <mesh position={[0,6,-35.78]} material={wood}><boxGeometry args={[27,10.5,.24]}/></mesh>
  <mesh position={[0,6,-35.62]}><planeGeometry args={[26.5,10]}/><meshStandardMaterial map={mural} roughness={1}/></mesh>
  <mesh position={[0,.6,-32]} material={wood} castShadow><boxGeometry args={[8,1.2,4]}/></mesh>
  <mesh position={[0,1.16,-32]} material={wood}><boxGeometry args={[8.5,.12,4.2]}/></mesh>
  <HallStatue/>
  {[-18,18].map(x=><group key={x}>
   <mesh position={[x,.6,-32]} material={wood} castShadow><boxGeometry args={[8,1.2,4]}/></mesh>
   <mesh position={[x,1.16,-32]} material={wood}><boxGeometry args={[8.5,.12,4.2]}/></mesh>
   <HallStatue position={[x,1.22,-32]} scale={1.9}/>
  </group>)}
  {[-3.1,3.1].map(x=><group key={x} position={[x,1.25,-30.9]}>
   <mesh position={[0,.32,0]}><cylinderGeometry args={[.12,.27,.64,16]}/><meshStandardMaterial color="#aa8848" metalness={.6} roughness={.4}/></mesh>
   <mesh position={[0,.86,0]}><cylinderGeometry args={[.12,.12,.55,12]}/><meshStandardMaterial color="#eee3c8"/></mesh>
   <mesh position={[0,1.2,0]} scale={[.07,.15,.07]}><sphereGeometry args={[1,10,8]}/><meshBasicMaterial color="#ffd989"/></mesh>
  </group>)}
  <IncenseBurner position={[0,0,-23]}/>
  {cushionLayers.map((items,i)=><Timbers key={i} items={items} material={cushionMaterials[i]}/>)}
  {[-16,16].flatMap(x=>[-24,-8,8,24].map(z=><Lantern key={`${x}-${z}`} x={x} z={z}/>))}
  {/* Two broad lights rather than one dynamic shadow light per lantern. */}
  <pointLight position={[0,7,-27]} color="#ffe2ad" intensity={130} distance={24} decay={2}/>
  <pointLight position={[0,7,2]} color="#fff0d4" intensity={90} distance={35} decay={2}/>
 </group>;
}
