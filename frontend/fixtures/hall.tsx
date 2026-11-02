import React,{Suspense} from 'react';
import{createRoot}from'react-dom/client';
import{Canvas,useThree,useFrame}from'@react-three/fiber';
import{MapScene}from'/src/game/scene/MapScene';
import {Model} from '/src/game/characters/Character';
import {Environment} from '@react-three/drei';
function CameraSweep(){useFrame(({camera,clock})=>{if(!new URLSearchParams(location.search).has('motion'))return;camera.position.set(Math.sin(clock.elapsedTime*.7)*4,3,1);camera.lookAt(0,2,-13);});return null;}
function Ready(){const {scene}=useThree();useFrame(()=>{if(scene.getObjectByName(courtyard?'hall-facade-ready':'main-hall-ready'))document.body.dataset.ready='true';});return null;}
const dining=new URLSearchParams(location.search).has('dining');
const close=new URLSearchParams(location.search).has('close');
const courtyard=new URLSearchParams(location.search).has('courtyard')||dining;
createRoot(document.getElementById('root')!).render(<div style={{width:'100vw',height:'100vh'}}><Canvas shadows camera={{position:dining?[0,3.3,4.8]:courtyard?[0,3,0]:close?[0,3,-20]:[0,5,14],fov:65}} onCreated={({camera})=>camera.lookAt(dining?-11:0,dining?1.7:courtyard?2:close?5:4,dining?4.8:courtyard?-15.8:-26)}><color attach="background" args={['#c7d1d0']}/><ambientLight intensity={1.1}/><directionalLight position={[4,15,9]} intensity={2} castShadow/><Suspense fallback={null}><Environment files='/textures/morning-sky.hdr' environmentIntensity={.55}/>{!courtyard&&<><group position={[0,0,6]} rotation={[0,Math.PI,0]}><Model avatar='male'/></group>{[-6.3,-3.1,3.1,6.3].map((x,i)=><group key={x} position={[x,0,-2]} rotation={[0,Math.PI,0]}><Model avatar={i%2?'female':'male'} action='meditate'/></group>)}</>}<MapScene mapId={courtyard?'courtyard':'hall'}/></Suspense><Ready/><CameraSweep/></Canvas></div>);
