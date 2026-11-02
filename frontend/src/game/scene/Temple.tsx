import {gardenPlots} from '../maps';
import type {Room} from '@colyseus/sdk';
import { VegetableGarden } from './VegetableGarden';
import { IncenseBurner } from './IncenseBurner';
import { CourtyardLandmarks } from './CourtyardLandmarks';
import { LotusPond } from "./LotusPond";
import { HallFacade } from "./HallFacade";
import { FallenLeaves } from "./FallenLeaves";
import { useMemo, createContext, useContext } from "react";
import { useSurface } from "./materials";
import { Vegetation } from "./Vegetation";
import { RoofTiles, Courtyard, Joinery } from "./ArchitectureDetails";
import type { MeshStandardMaterial } from "three";
const Surfaces=createContext<{wood:MeshStandardMaterial;stone:MeshStandardMaterial}|null>(null);
import {
  BufferGeometry,
  Float32BufferAttribute,
  CanvasTexture,
  SRGBColorSpace,
} from "three";
import { trees } from "../world";
function Box({
  position,
  scale,
  color = "#b5a38b",
  collision = false,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color?: string;
  collision?: boolean;
}) {
  const materials=useContext(Surfaces);
  const wood=["#5d4b38","#786247","#b49a65","#89795a","#846642","#6e6750"].includes(color);
  return (
    <mesh
      material={wood?materials?.wood:materials?.stone}
      position={position}
      castShadow
      receiveShadow
      userData={{ cameraCollider: collision }}
    >
      <boxGeometry args={scale} />

    </mesh>
  );
}
function Sign({
  text,
  position,
  width = 3.5,
}: {
  text: string;
  position: [number, number, number];
  width?: number;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 160;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#4d5340";
    ctx.fillRect(0, 0, 1024, 160);
    ctx.strokeStyle = "#c8b68b";
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, 1000, 136);
    ctx.font = "52px Georgia";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#e7d4a5";
    ctx.fillText(text, 512, 84);
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, [text]);
  return (
    <mesh position={position}>
      <planeGeometry args={[width, 0.56]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}
function Roof({
  width,
  depth,
  y,
}: {
  width: number;
  depth: number;
  y: number;
}) {
  const geometry = useMemo(() => {
    const g = new BufferGeometry(),
      v: number[] = [],
      idx: number[] = [];
    const nx = 16,
      nz = 8;
    for (let i = 0; i <= nx; i++)
      for (let j = 0; j <= nz; j++) {
        const x = (i / nx) * 2 - 1,
          z = (j / nz) * 2 - 1;
        v.push(
          (x * width) / 2,
          1.6 * (1 - Math.abs(z)) +
            0.6 * Math.pow(Math.abs(x), 8) +
            0.23 * Math.pow(Math.abs(z), 8),
          (z * depth) / 2,
        );
      }
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < nz; j++) {
        const a = i * (nz + 1) + j,
          b = a + nz + 1;
        idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
    g.setAttribute("position", new Float32BufferAttribute(v, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, [width, depth]);
  return (
    <group position={[0, y, 0]}>
      <RoofTiles width={width} depth={depth} y={0}/>
      <mesh geometry={geometry} castShadow userData={{ cameraCollider: true }}>
        <meshStandardMaterial color="#9c5744" side={2} roughness={0.95} />
      </mesh>
      <Box
        position={[0, 1.62, 0]}
        scale={[width + 0.15, 0.18, 0.22]}
        color="#c58c63"
      />
      {[-1, 1].map((s) => (
        <Box
          key={s}
          position={[0, 0.2, (s * depth) / 2]}
          scale={[width, 0.16, 0.15]}
          color="#c08761"
        />
      ))}
    </group>
  );
}
function Entrance({position,width=2.4,height=2.8}:{position:[number,number,number];width?:number;height?:number}){
 return <group position={position}>
   {[-1,1].map(side=><group key={side}>
     <Box position={[side*(width/2+.11),height/2,0]} scale={[.22,height+.18,.35]} color="#5d4b38" collision/>
     <group position={[side*width/2,0,.24]} rotation={[0,side*Math.PI,0]}>
       <Box position={[-side*width/4,height/2,0]} scale={[width/2-.08,height-.1,.12]} color="#786247"/>
       {[.5,1.35,2.15].map(y=><Box key={y} position={[-side*width/4,y,.07]} scale={[width/2-.22,.07,.05]} color="#5d4b38"/>)}
     </group>
   </group>)}
   <Box position={[0,height+.05,0]} scale={[width+.5,.25,.38]} color="#5d4b38"/>
   <Box position={[0,.015,.22]} scale={[width+.5,.03,.9]} color="#c3b69d"/>
 </group>;
}
export function Temple({room}:{room?:Room|null}){
 const wood=useSurface('wood',[1,2],'#796454'),stone=useSurface('stone',[1,1],'#b9b3a3');
 return (<Surfaces.Provider value={{wood,stone}}><group><Courtyard/><Joinery/>
      <CourtyardLandmarks room={room}/>
      {gardenPlots.map((p,i)=><group key={i} position={[p.x+11,0,p.z+1]}><VegetableGarden pots={i===2}/></group>)}
      <HallFacade>
        <Sign text="CHÁNH ĐIỆN" position={[0,3.65,3.33]} />
        <Roof width={17.5} depth={9.8} y={4.2}/>
        <Roof width={12.6} depth={6.8} y={6}/>
      </HallFacade>
      <group name="dining-facade-ready" position={[-18,0,3]} rotation={[0,Math.PI/2,0]} scale={[1.5,1,1.15]}>
        <Box position={[0,-.025,0]} scale={[7,.05,6.2]} color="#c3b69d"/>
        <Box position={[0,1.7,-2.8]} scale={[6.8,3.4,.25]} collision/>
        {[-1,1].map(side=><group key={side}>
          <Box position={[side*3.3,1.7,0]} scale={[.22,3.4,5.6]} collision/>
          <Box position={[side*2.45,1.6,2.1]} scale={[1.7,3.2,.24]} collision/>
          <Box position={[side*2.25,1.9,2.25]} scale={[1.35,1.25,.12]} color="#5d4b38"/>
          {[-.48,-.24,0,.24,.48].map(dx=><Box key={dx} position={[side*2.25+dx,1.9,2.34]} scale={[.055,1.13,.05]} color="#b49a65"/>)}
          <Box position={[side*3,1.7,2.65]} scale={[.22,3.4,.22]} color="#5d4b38" collision/>
          <Box position={[side*3,.1,2.65]} scale={[.45,.2,.45]}/>
        </group>)}
        <Entrance position={[0,0,2.15]} width={2.8} height={2.7}/>
        {/* Furnished interior remains visible from the courtyard doorway. */}
        <Box position={[0,.025,-.3]} scale={[6.3,.06,5]} color="#786247"/>
        <Box position={[0,.9,-.6]} scale={[2.4,.14,1.15]} color="#89795a"/>
        {[-.95,.95].flatMap(x=>[-.98,-.22].map(z=><Box key={`${x}-${z}`} position={[x,.44,z]} scale={[.12,.88,.12]} color="#5d4b38"/>))}
        {[-1.55,.4].map(z=><group key={z}>
          <Box position={[0,.45,z]} scale={[2.5,.12,.38]} color="#89795a"/>
          {[-.95,.95].map(x=><Box key={x} position={[x,.22,z]} scale={[.14,.44,.3]} color="#5d4b38"/>)}
        </group>)}
        <Box position={[0,.65,-2.25]} scale={[4.8,1.3,.65]} color="#786247"/>
        {[-.75,0,.75].map(x=><group key={x}>
          <mesh position={[x,1.01,-.6]}><cylinderGeometry args={[.22,.22,.035,20]}/><meshStandardMaterial color="#e7e2d1" roughness={.6}/></mesh>
          <mesh position={[x,1.11,-.6]}><sphereGeometry args={[.13,16,8,0,Math.PI*2,Math.PI/2,Math.PI/2]}/><meshStandardMaterial color="#d4c9ad" side={2}/></mesh>
          <mesh position={[x,1.36,-2.25]}><cylinderGeometry args={[.28,.28,.08,20]}/><meshStandardMaterial color="#a0a6a0" metalness={.35} roughness={.45}/></mesh>
        </group>)}
        <mesh position={[0,2.9,-.5]}><sphereGeometry args={[.18,12,8]}/><meshStandardMaterial color="#fff0ce" emissive="#ffe1a0" emissiveIntensity={1.5}/></mesh>
        <pointLight position={[0,2.6,.2]} color="#ffe2b5" intensity={14} distance={7} decay={2}/>
        <Box position={[0,3.25,2.4]} scale={[6.6,.18,.3]} color="#5d4b38"/>
        <Box position={[0,3.5,0]} scale={[6.9,.28,5.8]} color="#786247"/>
        <Box position={[0,3.05,2.45]} scale={[2.8,.6,.15]} color="#5d4b38"/>
        <Sign text="NHÀ ĂN · CƠM CHAY" position={[0,3.05,2.55]} width={2.7}/>
        <Roof width={8} depth={6.8} y={3.45}/>
        <Box position={[0,.01,3.6]} scale={[2.8,.02,1.4]} color="#c3b69d"/>
      </group>
      <group position={[0, 0, 25.5]}>
        {[-3.6, 3.6].map((x) => (
          <group key={x}>
            <Box
              position={[x, 1.9, 0]}
              scale={[0.8, 3.8, 0.8]}
              color="#c3b894"
              collision
            />
            <Box
              position={[x, 0.2, 0]}
              scale={[1.1, 0.4, 1.1]}
              color="#a99d80"
            />
          </group>
        ))}
        <Roof width={9} depth={2.8} y={3.8} />
        <Box position={[0, 3.2, 0]} scale={[6.4, 0.65, 0.4]} color="#6e6750" />
      </group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box
            position={[s * 28.7, 0.65, 0]}
            scale={[0.35, 1.3, 54]}
            color="#c1b798"
          />
          {[-26.7, 26.7].map((z) => (
            <Box
              key={z}
              position={[s * 16.5, 0.65, z]}
              scale={[24, 1.3, 0.35]}
              color="#c1b798"
            />
          ))}
        </group>
      ))}
      <Vegetation/>
      <group position={[5,0,3]}><LotusPond /></group>
      <IncenseBurner position={[0,0,-5.5]}/>
      <FallenLeaves position={[-5,.045,3]}/>
    </group></Surfaces.Provider>
  );
}
