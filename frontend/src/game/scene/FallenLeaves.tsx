import {useLayoutEffect,useMemo,useRef,useEffect} from 'react';
import {BufferGeometry,Float32BufferAttribute,InstancedMesh,Object3D,Color} from 'three';

/** One draw call; deterministic leaf scatter marks the sweep interaction. */
export function FallenLeaves({position}:{position:[number,number,number]}){
 const ref=useRef<InstancedMesh>(null);
 const geometry=useMemo(()=>{
  const g=new BufferGeometry();
  g.setAttribute('position',new Float32BufferAttribute([0,0,-.22,-.09,0,0,0,.025,.02,.09,0,0,0,0,.22],3));
  g.setIndex([0,1,2,0,2,3,1,4,2,2,4,3]);g.computeVertexNormals();return g;
 },[]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 useLayoutEffect(()=>{
  const o=new Object3D(),colors=['#b1813f','#81643b','#b39a54','#796a39'];
  for(let i=0;i<36;i++){
   const angle=i*2.39996,r=.2+Math.sqrt(i/36)*1.15;
   o.position.set(Math.cos(angle)*r,(i%4)*.004,Math.sin(angle)*r*.7);
   o.rotation.set(0,angle+.7,0);o.scale.setScalar(.55+(i%7)*.1);o.updateMatrix();
   ref.current!.setMatrixAt(i,o.matrix);ref.current!.setColorAt(i,new Color(colors[i%4]));
  }
  ref.current!.instanceMatrix.needsUpdate=true;
  if(ref.current!.instanceColor)ref.current!.instanceColor.needsUpdate=true;
 },[]);
 return <instancedMesh name="sweep-fallen-leaves" ref={ref} position={position} args={[geometry,undefined,36]} receiveShadow><meshStandardMaterial roughness={1} side={2}/></instancedMesh>;
}
