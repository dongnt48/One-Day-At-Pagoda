import React,{Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas,useFrame} from '@react-three/fiber';
import {Environment} from '@react-three/drei';
import {Temple} from '/src/game/scene/Temple';
const garden=new URLSearchParams(location.search).has('garden');
function Ready(){useFrame(({scene})=>{if(scene.getObjectByName('lotus-pond-ready')&&scene.getObjectByName('vegetable-garden-ready'))document.body.dataset.ready='true';});return null;}
createRoot(document.getElementById('root')!).render(<div style={{width:'100vw',height:'100vh'}}><Canvas shadows camera={{position:garden?[-5,5,-7]:[4,7,8],fov:55}} onCreated={({camera})=>camera.lookAt(garden?-11:11,.2,garden?-1.5:-1)}><color attach="background" args={['#c7d1d0']}/><ambientLight intensity={.25}/><hemisphereLight intensity={.45}/><directionalLight position={[4,15,9]} intensity={2.1} castShadow/><Suspense fallback={null}><Environment files="/textures/morning-sky.hdr" environmentIntensity={.55}/><Temple/></Suspense><Ready/></Canvas></div>);
