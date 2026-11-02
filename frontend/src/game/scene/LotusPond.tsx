import {useRef,useMemo,useEffect,useLayoutEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import {BufferGeometry,Float32BufferAttribute,DataTexture,RepeatWrapping,RGBAFormat,LinearFilter,InstancedMesh,Object3D,Color} from 'three';
import {useSurface} from './materials';
function padGeometry(){
 const center=new Color('#456d36'),p=[0,.045,0],c=[center.r,center.g,center.b],idx:number[]=[];
 for(let i=0;i<=64;i++){
  const a=.14+i/64*(Math.PI*2-.28),r=.50*(1+.035*Math.sin(a*9));
  p.push(Math.cos(a)*r,.012*Math.sin(a*7),Math.sin(a)*r);
  const color=new Color(i%4===0?'#537b41':'#486f39');c.push(color.r,color.g,color.b);if(i>0)idx.push(0,i+1,i);
 }
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(p,3));g.setAttribute('color',new Float32BufferAttribute(c,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
function petalGeometry(){
 const p:number[]=[],c:number[]=[],idx:number[]=[];
 for(let row=0;row<=10;row++)for(let col=0;col<=6;col++){
  const t=row/10,u=col/3-1;p.push(u*Math.sin(Math.PI*t)*.115,.35*t*t+u*u*.035,.34*t);
  const color=new Color('#f6e1d7').lerp(new Color('#bd597e'),t*t);c.push(color.r,color.g,color.b);
  if(row<10&&col<6){const a=row*7+col;idx.push(a,a+7,a+1,a+1,a+7,a+8);}
 }
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(p,3));g.setAttribute('color',new Float32BufferAttribute(c,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
export function LotusPond(){
 const stone=useSurface('stone',[1,1],'#969487'),bottom=useSurface('ground',[4,4],'#555e42');
 const pads=useRef<InstancedMesh>(null),petals=useRef<InstancedMesh>(null),leaf=useMemo(padGeometry,[]),petal=useMemo(petalGeometry,[]);
 const normal=useMemo(()=>{
  const n=128,data=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
   const u=x/n*Math.PI*2,v=y/n*Math.PI*2,i=(y*n+x)*4;
   data[i]=128+25*Math.cos(u*5+v*3)+10*Math.cos(u*11-v*7);data[i+1]=128+22*Math.cos(u*5+v*3)-14*Math.cos(u*11-v*7);data[i+2]=248;data[i+3]=255;
  }
  const t=new DataTexture(data,n,n,RGBAFormat);t.wrapS=t.wrapT=RepeatWrapping;t.magFilter=t.minFilter=LinearFilter;t.repeat.set(3,3);t.needsUpdate=true;return t;
 },[]);
 const flowers=useMemo(()=>[[-2.1,-1.5],[1.8,-2.3],[2.4,1.5],[-1.4,2.9],[-2.5,.8],[.7,3.6]],[]);
 useEffect(()=>()=>{leaf.dispose();petal.dispose();normal.dispose();},[leaf,petal,normal]);
 useFrame(({clock})=>{normal.offset.set(clock.elapsedTime*.009,clock.elapsedTime*.004);});
 useLayoutEffect(()=>{
  const o=new Object3D();
  for(let i=0;i<42;i++){
   const a=i*2.399,r=.9+Math.sqrt((i%13)/13)*2.4;
   o.position.set(Math.cos(a)*r,.105+(i%3)*.008,Math.sin(a)*r*1.3);o.rotation.set(0,a,0);o.scale.setScalar(.65+(i%5)*.13);o.updateMatrix();pads.current!.setMatrixAt(i,o.matrix);
  }
  let k=0;flowers.forEach(([x,z],i)=>{for(let j=0;j<24;j++){
   const layer=Math.floor(j/8),a=(j%8)*Math.PI/4+layer*.35;
   o.position.set(x,.38+(i%3)*.12+layer*.035,z);o.rotation.set(-layer*.34,a,0);o.scale.setScalar(1-layer*.19);o.updateMatrix();petals.current!.setMatrixAt(k++,o.matrix);
  }});pads.current!.instanceMatrix.needsUpdate=true;petals.current!.instanceMatrix.needsUpdate=true;
 },[flowers]);
 return <group position={[11,.04,-1]} name="lotus-pond-ready">
  <mesh rotation={[-Math.PI/2,0,0]} scale={[4.6,5.6,1]} material={bottom} receiveShadow><circleGeometry args={[1,64]}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.065,0]} scale={[4.3,5.3,1]}><circleGeometry args={[1,64]}/><meshStandardMaterial color="#3d5143" normalMap={normal} normalScale={[.12,.12]} metalness={.18} roughness={.23} envMapIntensity={.8} transparent opacity={.92}/></mesh>
  {Array.from({length:52},(_,i)=>{
   const a=i/52*Math.PI*2,r=1+.016*Math.sin(i*8.3);
   return <mesh key={i} position={[Math.cos(a)*4.5*r,.12+(i%4)*.025,Math.sin(a)*5.5*r]} rotation={[i*.31,i*.71,.15]} scale={[.37+(i%3)*.05,.22+(i%4)*.025,.33+(i%5)*.025]} material={stone} castShadow receiveShadow><dodecahedronGeometry args={[1,1]}/></mesh>;
  })}
  <instancedMesh ref={pads} args={[leaf,undefined,42]} receiveShadow><meshStandardMaterial vertexColors roughness={.72} side={2}/></instancedMesh>
  <instancedMesh ref={petals} args={[petal,undefined,flowers.length*24]} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={.65} side={2}/></instancedMesh>
  {flowers.map(([x,z],i)=><group key={i} position={[x,0,z]}>
   <mesh position={[0,.23+(i%3)*.06,0]}><cylinderGeometry args={[.015,.022,.4+(i%3)*.12,8]}/><meshStandardMaterial color="#617747" roughness={.85}/></mesh>
   <mesh position={[0,.42+(i%3)*.12,0]}><cylinderGeometry args={[.07,.045,.055,12]}/><meshStandardMaterial color="#c7ad47" roughness={.8}/></mesh>
  </group>)}
 </group>;
}
