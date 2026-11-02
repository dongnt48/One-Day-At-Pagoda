import {useMemo,useEffect} from 'react';
import {CanvasTexture,SRGBColorSpace} from 'three';
export function SceneLabel({children,position,rotation,fontSize=.24,color='#fff0ce'}:{children:string;position:[number,number,number];rotation?:[number,number,number];fontSize?:number;color?:string}){
 const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=1024;c.height=96;const ctx=c.getContext('2d')!;ctx.font='48px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(children,512,48,1000);const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;return t;},[children,color]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <mesh position={position} rotation={rotation}><planeGeometry args={[Math.max(2,children.length*fontSize*.65),fontSize*2]}/><meshBasicMaterial map={texture} transparent depthWrite={false}/></mesh>;
}
