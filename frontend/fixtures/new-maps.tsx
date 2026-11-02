import React,{Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas,useFrame} from '@react-three/fiber';
import {Environment} from '@react-three/drei';
import {MapScene} from '/src/game/scene/MapScene';
const garden=new URLSearchParams(location.search).has('garden');
function Ready(){useFrame(({scene})=>{if(scene.getObjectByName(garden?'hall-facade-ready':'dining-map-ready'))document.body.dataset.ready='true';});return null;}
createRoot(document.getElementById('root')!).render(<div style={{width:'100vw',height:'100vh'}}><Canvas shadows camera={{position:garden?[32,32,42]:[0,4.5,12],fov:65}} onCreated={({camera})=>camera.lookAt(0,garden?0:1.8,-3)}><color attach="background" args={['#c7d1d0']}/><ambientLight intensity={.25}/><hemisphereLight intensity={.45}/><directionalLight position={[4,15,9]} intensity={2.1}/><Suspense fallback={null}><Environment files="/textures/morning-sky.hdr" environmentIntensity={.55}/><MapScene mapId={garden?'courtyard':'dining'}/></Suspense><Ready/></Canvas></div>);
