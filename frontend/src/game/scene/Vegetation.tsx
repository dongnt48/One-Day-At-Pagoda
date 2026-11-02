import {useMemo,useLayoutEffect,useRef} from 'react';
import {BufferGeometry,Float32BufferAttribute,InstancedMesh,Object3D,Color,Vector3} from 'three';
import {trees} from '../world';
import {useSurface} from './materials';
const random=(n:number)=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
function leafGeometry(){
 const g=new BufferGeometry(),positions=[0,.018,.16],uv=[.5,.5],indices:number[]=[];
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;positions.push(Math.sin(a)*.085,0,.16+Math.cos(a)*.16);uv.push(.5+Math.sin(a)*.5,.5+Math.cos(a)*.5);indices.push(0,i+1,(i+1)%12+1);}
 g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function Vegetation(){
 const leaves=useRef<InstancedMesh>(null),branches=useRef<InstancedMesh>(null);const bark=useSurface('bark',[1,3],'#a8a08b');
 const geometry=useMemo(leafGeometry,[]);
 const count=trees.length*1100;
 useLayoutEffect(()=>{
  const o=new Object3D(),up=new Vector3(0,1,0);let branchIndex=0;
  trees.forEach(([x,z],tree)=>{
   for(let b=0;b<13;b++){
    const a=b*2.399+tree,base=new Vector3(x,1.9+(b%3)*.35,z),tip=new Vector3(x+Math.cos(a)*(b?1.8:.1),b?3.8+random(b+tree)*1.6:5.6,z+Math.sin(a)*(b?1.7:.1));
    o.position.copy(base).add(tip).multiplyScalar(.5);o.quaternion.setFromUnitVectors(up,tip.clone().sub(base).normalize());o.scale.set(b?.11:.25,base.distanceTo(tip),b?.11:.25);o.updateMatrix();branches.current!.setMatrixAt(branchIndex++,o.matrix);
   }
   for(let j=0;j<1100;j++){
    const seed=tree*1100+j,angle=random(seed+1)*Math.PI*2,r=Math.sqrt(random(seed+2))*2.6;
    const crown=1-r*r/8;
    o.position.set(x+Math.cos(angle)*r,3.6+crown*1.8+(random(seed+3)-.5)*1.7,z+Math.sin(angle)*r);
    o.rotation.set(random(seed+4)*2.3,random(seed+5)*6.28,random(seed+6)*6.28);o.scale.setScalar(.65+random(seed+7)*.8);o.updateMatrix();leaves.current!.setMatrixAt(seed,o.matrix);
    leaves.current!.setColorAt(seed,new Color().setHSL(.22+random(seed+8)*.065,.42+random(seed+9)*.18,.09+random(seed+10)*.09));
   }
  });leaves.current!.instanceMatrix.needsUpdate=true;branches.current!.instanceMatrix.needsUpdate=true;
 },[]);
 return <group><instancedMesh ref={branches} args={[undefined,undefined,trees.length*13]} material={bark} castShadow receiveShadow><cylinderGeometry args={[.7,1,1,9]}/></instancedMesh><instancedMesh ref={leaves} args={[geometry,undefined,count]} castShadow receiveShadow><meshStandardMaterial color="white" roughness={.85} side={2}/></instancedMesh>{trees.map(([x,z],i)=><mesh key={i} position={[x,1.4,z]} material={bark} castShadow receiveShadow userData={{cameraCollider:true}}><cylinderGeometry args={[.22,.37,2.8,12]}/></mesh>)}</group>;
}
