import React,{Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas,useFrame} from '@react-three/fiber';
import {Environment} from '@react-three/drei';
import {Model} from '/src/game/characters/Character';
function Ready(){useFrame(({scene})=>{let count=0;scene.traverse(o=>{if(o.type==='SkinnedMesh')count++;});if(count>=2)document.body.dataset.ready='true';});return null;}
createRoot(document.getElementById('root')!).render(<div style={{width:'100vw',height:'100vh'}}><Canvas camera={{position:[3,1.8,4],fov:35}} onCreated={({camera})=>camera.lookAt(0,.9,0)}><color attach="background" args={['#b9b3aa']}/><ambientLight intensity={1}/><directionalLight position={[2,5,4]} intensity={2}/><Suspense fallback={null}><Environment files="/textures/morning-sky.hdr"/><group position={[-.75,0,0]}><Model avatar="male" action="incense"/></group><group position={[.75,0,0]}><Model avatar="female" action="incense"/></group></Suspense><Ready/></Canvas></div>);
