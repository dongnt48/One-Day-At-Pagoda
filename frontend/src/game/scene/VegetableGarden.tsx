import {useMemo,useEffect,useLayoutEffect,useRef} from 'react';
import {BufferGeometry,Float32BufferAttribute,InstancedMesh,Object3D,Color} from 'three';
import {useSurface} from './materials';
function leafGeometry(){
 const p:number[]=[],c:number[]=[],idx:number[]=[];
 for(let row=0;row<=12;row++)for(let col=0;col<=6;col++){
  const t=row/12,u=col/3-1,w=Math.sin(Math.PI*t)**.7*.16;
  p.push(u*w,.42*t-.22*t*t+u*u*.045+Math.sin(t*26)*Math.abs(u)*.012,.40*t);
  const color=new Color(col===3?'#91ab63':'#44753a');color.multiplyScalar(.8+t*.3+(row%3===0?.1:0));c.push(color.r,color.g,color.b);
  if(row<12&&col<6){const a=row*7+col;idx.push(a,a+7,a+1,a+1,a+7,a+8);}
 }
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(p,3));g.setAttribute('color',new Float32BufferAttribute(c,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
export function VegetableGarden({pots=true,cropScale=1}:{pots?:boolean;cropScale?:number}){
 const soil=useSurface('ground',[2,2],'#554331'),geometry=useMemo(leafGeometry,[]),ref=useRef<InstancedMesh>(null);
 const plants=useMemo(()=>[...[-13,-11,-9].flatMap(x=>[-2,-1,0].flatMap(z=>[-.3,.3].map(dx=>({x:x+dx,y:.16,z})))),...(pots?[-13,-10,-7].map(x=>({x,y:.49,z:-5})):[])],[pots]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 useLayoutEffect(()=>{
  const o=new Object3D();let index=0;
  plants.forEach((plant,i)=>{for(let j=0;j<14;j++){
   const inner=j>=9,size=inner?.50+(j-9)*.035:.85+(i%3)*.07;
   o.position.set(plant.x,plant.y+(inner?.04:0),plant.z);o.rotation.set(inner?-.4:.05,j*2.399+i*.7,0);o.scale.setScalar(size*cropScale);o.updateMatrix();
   ref.current!.setMatrixAt(index,o.matrix);ref.current!.setColorAt(index++,new Color().setScalar(.8+(i%5)*.05));
  }});ref.current!.instanceMatrix.needsUpdate=true;if(ref.current!.instanceColor)ref.current!.instanceColor.needsUpdate=true;
 },[plants,cropScale]);
 return <group name="vegetable-garden-ready">
  {[-13,-11,-9].map(x=><mesh key={x} position={[x,.07,-1]} material={soil} receiveShadow scale={[.8,.14,1.65]}><sphereGeometry args={[1,24,12]}/></mesh>)}
  {pots&&[-13,-10,-7].map(x=><group key={x} position={[x,0,-5]}>
   <mesh position={[0,.25,0]} castShadow receiveShadow><cylinderGeometry args={[.43,.29,.5,32,1,true]}/><meshStandardMaterial color="#94644b" roughness={.95} side={2}/></mesh>
   <mesh position={[0,.49,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.42,.035,8,32]}/><meshStandardMaterial color="#ac7a5a" roughness={.9}/></mesh>
   <mesh position={[0,.46,0]} material={soil}><cylinderGeometry args={[.40,.40,.04,24]}/></mesh>
  </group>)}
  <instancedMesh ref={ref} args={[geometry,undefined,plants.length*14]} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={.8} side={2}/></instancedMesh>
 </group>;
}
