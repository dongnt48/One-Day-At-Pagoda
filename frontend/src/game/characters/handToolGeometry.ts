import {Color,CylinderGeometry,Float32BufferAttribute,LatheGeometry,Quaternion,Vector2,Vector3} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Hollow bucket: the top remains open, with a thin wall and a solid bottom. */
export function wateringBucketGeometry(){
 return new LatheGeometry([[0,-.44],[.14,-.44],[.19,-.12],[.173,-.12],[.125,-.415],[0,-.415]].map(([r,y])=>new Vector2(r,y)),32);
}

/** Merged low-poly straw strands keep the fan shape to one draw call. */
export function broomStrawGeometry(){
 const up=new Vector3(0,1,0),rotation=new Quaternion();
 const strands=Array.from({length:72},(_,i)=>{
  const u=i/71*2-1,depth=((i%4)-1.5)*.012;
  const top=new Vector3(u*.028,0,depth*.5),tip=new Vector3(u*.20,-.25-(i%3)*.007,depth+.015);
  const direction=top.clone().sub(tip),length=direction.length(),center=top.clone().add(tip).multiplyScalar(.5);
  const g=new CylinderGeometry(.006,.003,length,4,1);
  rotation.setFromUnitVectors(up,direction.normalize());g.applyQuaternion(rotation);g.translate(center.x,center.y,center.z);
  const color=new Color(['#baa16d','#aa8b53','#c7ae79','#b79a62'][i%4]),colors=[];
  for(let vertex=0;vertex<g.getAttribute('position').count;vertex++)colors.push(color.r,color.g,color.b);
  g.setAttribute('color',new Float32BufferAttribute(colors,3));return g;
 });
 const geometry=mergeGeometries(strands)!;strands.forEach(g=>g.dispose());return geometry;
}
