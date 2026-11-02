import {useLayoutEffect,useMemo,useRef} from 'react';
import {InstancedMesh,Object3D,Color,BufferGeometry,Float32BufferAttribute} from 'three';
import {useSurface} from './materials';
export function RoofTiles({width,depth,y}:{width:number;depth:number;y:number}){
 const ref=useRef<InstancedMesh>(null),columns=Math.floor(width/.24),rows=Math.ceil(depth/.42);
 const material=useSurface('roof',[.18,.18],'#a07761');
 const geometry=useMemo(()=>{
  const g=new BufferGeometry(),v:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let z=0;z<=1;z++)for(let j=0;j<=8;j++){const a=j/8*Math.PI;v.push(Math.cos(a)*.12,Math.sin(a)*.065,z*.47);uv.push(j/8,z);}
  for(let j=0;j<8;j++)indices.push(j,j+1,j+9,j+1,j+10,j+9);
  g.setAttribute('position',new Float32BufferAttribute(v,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
 },[]);
 useLayoutEffect(()=>{const o=new Object3D();let index=0;
  for(let c=0;c<columns;c++)for(let r=0;r<rows;r++){
   const x=(c+.5)/columns*width-width/2,z=(r+.5)/rows*depth-depth/2;
   const norm=z/(depth/2),edge=x/(width/2);
   o.position.set(x,y+.035+1.6*(1-Math.abs(norm))+.6*Math.pow(Math.abs(edge),8)+.23*Math.pow(Math.abs(norm),8),z);
   const slope=-Math.sign(norm)*3.2/depth+Math.sign(norm)*1.84/depth*Math.pow(Math.abs(norm),7);
   o.rotation.set(-Math.atan(slope),0,0);o.scale.set(1,1,1);o.updateMatrix();ref.current!.setMatrixAt(index,o.matrix);ref.current!.setColorAt(index++,new Color().setScalar(.7+.25*((Math.sin(c*73+r*17)+1)/2)));
  }ref.current!.instanceMatrix.needsUpdate=true;
 },[width,depth,y,columns,rows]);
 return <instancedMesh ref={ref} args={[geometry,material,columns*rows]} castShadow receiveShadow/>;
}
export function Courtyard(){const brick=useSurface('brick',[2,4],'#c4b4a2'),ground=useSurface('ground',[48,48],'#9b9d80'),stone=useSurface('stone',[6,6],'#b6b1a2');return <group><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.012,0]} material={ground} receiveShadow><planeGeometry args={[400,400]}/></mesh><mesh rotation={[-Math.PI/2,0,0]} position={[0,.032,7]} material={brick} receiveShadow><planeGeometry args={[22,35]}/></mesh><mesh rotation={[-Math.PI/2,0,0]} position={[0,.018,-6.8]} material={stone} receiveShadow><planeGeometry args={[16,4.3]}/></mesh></group>;}
export function Joinery(){const wood=useSurface('wood',[1,3],'#716050');return <group position={[0,0,-13]}>{[-7,-4.6,-2.3,2.3,4.6,7].map(x=><group key={x}><mesh position={[x,3.9,2.75]} material={wood} castShadow><boxGeometry args={[.4,.24,1.5]}/></mesh><mesh position={[x,3.65,3.25]} rotation={[0,0,.6]} material={wood} castShadow><boxGeometry args={[.16,.7,.2]}/></mesh></group>)}{[3.9,4.1].map(y=><mesh key={y} position={[0,y,3.2]} material={wood} castShadow><boxGeometry args={[15,.18,.25]}/></mesh>)}</group>;}
