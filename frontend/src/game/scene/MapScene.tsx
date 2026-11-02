import type {Room} from '@colyseus/sdk';

import {memo,useEffect,useLayoutEffect,useMemo,useRef} from 'react';
import {CanvasTexture,SRGBColorSpace,InstancedMesh,Object3D} from 'three';
import {maps,diningTables,diningSeats,type MapId} from '../world';
import {useSurface} from './materials';
import {Temple} from './Temple';

import {MainHall} from './MainHall';
import {DiningKitchen} from './DiningKitchen';
import {DiningWalls} from './DiningWalls';
type BoxItem={position:[number,number,number];scale:[number,number,number]};
function Boxes({items,color}:{items:BoxItem[];color:string}){
 const ref=useRef<InstancedMesh>(null);
 useLayoutEffect(()=>{const o=new Object3D();items.forEach((b,i)=>{o.position.set(...b.position);o.scale.set(...b.scale);o.updateMatrix();ref.current!.setMatrixAt(i,o.matrix);});ref.current!.instanceMatrix.needsUpdate=true;ref.current!.computeBoundingSphere();},[items]);
 return <instancedMesh ref={ref} args={[undefined,undefined,items.length]} castShadow receiveShadow><boxGeometry/><meshStandardMaterial color={color} roughness={.9}/></instancedMesh>;
}
function Sign({text,x,z,y=2,width=5}:{text:string;x:number;z:number;y?:number;width?:number}){
 const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=1024;c.height=160;const ctx=c.getContext('2d')!;ctx.fillStyle='#414d38';ctx.fillRect(0,0,1024,160);ctx.strokeStyle='#cebc8f';ctx.lineWidth=5;ctx.strokeRect(8,8,1008,144);ctx.font='bold 50px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f1e5c8';ctx.fillText(text,512,80,970);const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;return t;},[text]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <group position={[x,y,z]}>
  {[0,Math.PI].map(angle=><mesh key={angle} position={[0,0,angle===0?.006:-.006]} rotation={[0,angle,0]}><planeGeometry args={[width,width/6.4]}/><meshBasicMaterial map={texture}/></mesh>)}
 </group>;
}
export const MapScene=memo(function MapScene({mapId,room}:{mapId:MapId;room?:Room|null}){
 const map=maps[mapId],floor=useSurface(mapId==='courtyard'?'brick':'wood',[18,22],mapId==='courtyard'?'#b6a18d':'#a99a7c');
 const ground=useSurface('ground',[25,25],'#b6bba2'),stone=useSurface('stone',[6,8],'#d3cdbb');
 const wood=useSurface('wood',[2,8],'#87715c');
 const roof=useSurface('roof',[12,16],'#bc8b6c');
 const chairs=useMemo<BoxItem[]>(()=>diningSeats.flatMap(s=>[
  {position:[s.x,.37,s.z],scale:[.85,.12,.8]},
  {position:[s.x,.66,s.z+.36],scale:[.85,.72,.08]},
  ...[-.32,.32].flatMap(dx=>[-.3,.3].map(dz=>({position:[s.x+dx,.16,s.z+dz] as [number,number,number],scale:[.07,.32,.07] as [number,number,number]}))),
 ]),[]);
 const tables=useMemo<BoxItem[]>(()=>diningTables.flatMap(t=>[
  {position:[t.x,.73,t.z],scale:[6.8,.12,1.3]},
  ...[-2.9,2.9].map(dx=>({position:[t.x+dx,.36,t.z] as [number,number,number],scale:[.14,.72,1.2] as [number,number,number]})),
 ]),[]);
 if(mapId==='courtyard')return <Temple room={room}/>;
 if(mapId==='hall')return <MainHall/>;

 return <group name="dining-map-ready">
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.04,0]} material={ground} receiveShadow><planeGeometry args={[130,130]}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} material={floor} receiveShadow><planeGeometry args={[map.halfX*2,map.halfZ*2]}/></mesh>
  <DiningWalls halfX={map.halfX} halfZ={map.halfZ}/>
  {maps[mapId].portals.map(p=><group key={p.id} position={[p.x,0,p.z]}>
    <Boxes color="#775c42" items={[{position:[-2.5,2,0],scale:[.3,4,.3]},{position:[2.5,2,0],scale:[.3,4,.3]},{position:[0,4,0],scale:[6,.5,1]}]}/>
    <mesh position={[0,.015,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.3,1.7,32]}/><meshBasicMaterial color="#cdbb83" transparent opacity={.7}/></mesh>
    <Sign text={p.label} x={0} z={.18} y={3.4} width={4.5}/>
  </group>)}
  {<>
    {/* Both roof slopes meet the sealed side walls and end gables. */}
    {[-1,1].map(side=><mesh key={side} position={[side*map.halfX*.5,6.8,0]} rotation={[0,0,side*-.13]} material={roof} castShadow userData={{cameraCollider:true}}><boxGeometry args={[map.halfX+1,.25,map.halfZ*2]}/></mesh>)}
    <Boxes color="#76533b" items={[-10,-2,6,12].map(z=>({position:[0,6,z],scale:[map.halfX*2,.22,.3]}))}/>
    {[-map.halfX+2,map.halfX-2].flatMap(x=>[-10,-2,6,12].map(z=><mesh key={`${x}-${z}`} position={[x,3,z]} material={wood} castShadow userData={{cameraCollider:true}}><cylinderGeometry args={[.24,.30,6,12]}/></mesh>))}
    {[-8,8].flatMap(x=>[-6,2,10].map(z=><group key={`${x}-${z}`} position={[x,5,z]}><mesh><capsuleGeometry args={[.22,.4,4,16]}/><meshStandardMaterial color="#ffedcb" emissive="#ffcc83" emissiveIntensity={1}/></mesh></group>))}
    {[-6,6].map(x=><pointLight key={x} position={[x,4,0]} color="#ffd5a0" intensity={55} distance={22} decay={2}/>)}
    <Boxes color="#8c7358" items={tables}/><Boxes color="#887158" items={chairs}/>
      <mesh position={[0,.5,-13.2]} material={wood}><boxGeometry args={[28,1,1.5]}/></mesh>
      <Sign text="NHẬN CƠM CHAY" x={-8} z={-12.35} width={5}/><Sign text="TRẢ KHAY" x={8} z={-12.35} width={4}/>
      <Boxes color="#b9bcb0" items={[-12,-10,-8,-6,-4].map(x=>({position:[x,1.1,-13.2],scale:[1.2,.2,.8]}))}/>
      <DiningKitchen/>
  </>}
 </group>;
});
