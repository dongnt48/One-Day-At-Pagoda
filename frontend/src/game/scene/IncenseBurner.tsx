import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {CanvasTexture,CatmullRomCurve3,Color,Float32BufferAttribute,Group,LatheGeometry,Vector2,Vector3} from 'three';

/** Hollow bronze urn with rolled rim, ash, curved handles and tripod feet. */
export function IncenseBurner({position}:{position:[number,number,number]}){
 const smoke=useRef<Group>(null);
 const body=useMemo(()=>{
  const profile=[[.35,.43],[.47,.46],[.63,.59],[.72,.84],[.73,1.04],[.69,1.18],[.77,1.23],[.77,1.29],[.70,1.31],[.66,1.25],[.65,1.12],[.67,.87],[.58,.65],[.39,.53]];
  const g=new LatheGeometry(profile.map(([r,y])=>new Vector2(r,y)),48),colors=[];
  const p=g.getAttribute('position');
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
   const grain=(Math.sin(x*37+y*53+z*19)+Math.sin(x*83-z*67))/2;
   const c=new Color('#977145').lerp(new Color('#455e50'),Math.max(0,grain)*.45);
   colors.push(c.r,c.g,c.b);
  }
  g.setAttribute('color',new Float32BufferAttribute(colors,3));return g;
 },[]);
 const handles=useMemo(()=>[-1,1].map(s=>new CatmullRomCurve3([[s*.67,1.08,0],[s*.98,1.05,0],[s*1.05,1.34,0],[s*.88,1.51,0],[s*.78,1.33,0]].map(p=>new Vector3(p[0],p[1],p[2])))),[]);
 const texture=useMemo(()=>{
  const c=document.createElement('canvas');c.width=c.height=64;
  const ctx=c.getContext('2d')!,gradient=ctx.createRadialGradient(32,32,0,32,32,32);
  gradient.addColorStop(0,'rgba(220,218,208,.45)');gradient.addColorStop(.45,'rgba(220,218,208,.16)');gradient.addColorStop(1,'rgba(220,218,208,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);return new CanvasTexture(c);
 },[]);
 useEffect(()=>()=>{body.dispose();texture.dispose();},[body,texture]);
 useFrame(({clock})=>{smoke.current?.children.forEach((c,i)=>{
  const t=(clock.elapsedTime*.13+i/10)%1;
  c.position.set(Math.sin(t*5+i*.2)*(.03+t*.12),2+t*1.1,Math.cos(t*3)*.04);
  c.scale.set(.10+t*.4,.22+t*.4,1);
 });});
 return <group name="detailed-incense-burner" position={position}>
  <mesh position={[0,.08,0]} receiveShadow><cylinderGeometry args={[.91,.98,.16,48]}/><meshStandardMaterial color="#89877d" roughness={.95}/></mesh>
  <mesh geometry={body} castShadow receiveShadow><meshStandardMaterial vertexColors metalness={.78} roughness={.48}/></mesh>
  {[.54,1.25].map((y,i)=><mesh key={y} position={[0,y,0]} rotation={[Math.PI/2,0,0]} castShadow><torusGeometry args={[i?.735:.52,.035,8,48]}/><meshStandardMaterial color="#b38b4e" metalness={.8} roughness={.4}/></mesh>)}
  {handles.map((curve,i)=><mesh key={i} castShadow><tubeGeometry args={[curve,20,.055,8,false]}/><meshStandardMaterial color="#9a7948" metalness={.8} roughness={.45}/></mesh>)}
  {[0,1,2].map(i=><group key={i} rotation={[0,i*Math.PI*2/3,0]}>
   <mesh position={[0,.32,.44]} rotation={[-.25,0,0]} castShadow><cylinderGeometry args={[.10,.07,.38,12]}/><meshStandardMaterial color="#80633d" metalness={.75} roughness={.5}/></mesh>
   <mesh position={[0,.20,.49]} scale={[.13,.06,.19]} castShadow><sphereGeometry args={[1,16,8]}/><meshStandardMaterial color="#80633d" metalness={.75} roughness={.5}/></mesh>
  </group>)}
  {/* Raised decorative medallion on both faces; no invented sacred lettering. */}
  {[-1,1].map(s=><group key={s} position={[0,.87,s*.718]}>
   <mesh><torusGeometry args={[.17,.018,8,24]}/><meshStandardMaterial color="#bb9758" metalness={.8} roughness={.45}/></mesh>
   {Array.from({length:8},(_,i)=><mesh key={i} position={[Math.sin(i*Math.PI/4)*.075,Math.cos(i*Math.PI/4)*.075,0]} rotation={[0,0,-i*Math.PI/4]} scale={[.035,.075,.012]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color="#ae884d" metalness={.7} roughness={.5}/></mesh>)}
  </group>)}
  <mesh position={[0,1.205,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><circleGeometry args={[.657,48]}/><meshStandardMaterial color="#a49b87" roughness={1}/></mesh>
  {[-.18,0,.18].map((x,i)=><group key={x} position={[x,1.20,(i%2)*.09]} rotation={[0,0,-x*.12]}>
   <mesh position={[0,.12,0]}><cylinderGeometry args={[.012,.012,.24,6]}/><meshStandardMaterial color="#873e2c"/></mesh>
   <mesh position={[0,.51,0]}><cylinderGeometry args={[.014,.014,.54,8]}/><meshStandardMaterial color="#916344" roughness={1}/></mesh>
   <mesh position={[0,.80,0]}><cylinderGeometry args={[.016,.014,.04,8]}/><meshStandardMaterial color="#c2b9aa" roughness={1}/></mesh>
   <mesh position={[0,.777,0]}><sphereGeometry args={[.015,8,6]}/><meshStandardMaterial color="#c75324" emissive="#b93e16" emissiveIntensity={.8}/></mesh>
  </group>)}
  <group ref={smoke}>{Array.from({length:10},(_,i)=><sprite key={i}><spriteMaterial map={texture} transparent opacity={.32} depthWrite={false}/></sprite>)}</group>
 </group>;
}
