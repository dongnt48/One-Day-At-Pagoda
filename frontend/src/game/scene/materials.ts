import { useTexture } from '@react-three/drei';
import { useMemo,useEffect } from 'react';
import { MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, Vector2 } from 'three';
export type Surface='brick'|'wood'|'bark'|'stone'|'ground'|'roof';
const assets:Record<Surface,string>={brick:'red_brick_pavers',wood:'brown_planks_03',bark:'bark_brown_01',stone:'rock_boulder_dry',ground:'forest_ground_04',roof:'clay_roof_tiles'};
export function useSurface(surface:Surface,repeat:[number,number]=[1,1],color='#ffffff'){
 const textures=useTexture(['color','normal','roughness'].map(k=>`/textures/${assets[surface]}_${k}.jpg`));
 const material=useMemo(()=>{
  const maps=textures.map((t,i)=>{const c=t.clone();c.wrapS=c.wrapT=RepeatWrapping;c.repeat.set(...repeat);c.anisotropy=4;if(i===0)c.colorSpace=SRGBColorSpace;c.needsUpdate=true;return c;});
  return new MeshStandardMaterial({map:maps[0],normalMap:maps[1],roughnessMap:maps[2],roughness:1,color,normalScale:new Vector2(.55,.55)});
 },[textures[0],textures[1],textures[2],repeat[0],repeat[1],color]);
 useEffect(()=>()=>{material.map?.dispose();material.normalMap?.dispose();material.roughnessMap?.dispose();material.dispose();},[material]);
 return material;
}
