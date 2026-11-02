import {writeFileSync,mkdirSync} from 'node:fs';
import {chromium} from '@playwright/test';
mkdirSync('test-results',{recursive:true});
writeFileSync('test-results/activities-preview.html','<html><body style="margin:0"><div id="root"></div><script type="module" src="/test-results/activities-preview.tsx"></script></body></html>');
writeFileSync('test-results/activities-preview.tsx',`
import React,{Suspense} from 'react';import{createRoot}from'react-dom/client';import{Canvas}from'@react-three/fiber';import{Model}from'/src/game/characters/Character';
const action=new URLSearchParams(location.search).get('action')||'meditate';
createRoot(document.getElementById('root')!).render(<div style={{width:'100vw',height:'100vh'}}><Canvas shadows camera={{position:[2,1.8,3.5],fov:35}} onCreated={({camera})=>camera.lookAt(0,.7,0)}><color attach="background" args={['#d9d8cd']}/><ambientLight intensity={1.8}/><directionalLight position={[3,6,4]} intensity={2} castShadow/><Suspense fallback={null}><Model avatar="male" action={action as any} tray={action==='eat'||action==='carry'}/></Suspense><mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[20,20]}/><meshStandardMaterial color="#a6a792"/></mesh>{action==='eat'&&<><mesh position={[0,.37,0]}><boxGeometry args={[.8,.12,.75]}/><meshStandardMaterial color="#705541"/></mesh><mesh position={[0,.73,.8]}><boxGeometry args={[1.5,.12,.6]}/><meshStandardMaterial color="#705541"/></mesh></>}</Canvas></div>);
`);
const browser=await chromium.launch({channel:'chromium',headless:true});
try{const page=await browser.newPage({viewport:{width:800,height:800}});for(const action of ['meditate','eat']){await page.goto('http://localhost:5175/test-results/activities-preview.html?action='+action);await page.waitForTimeout(3000);await page.screenshot({path:'test-results/pose-'+action+'.png'});}}finally{await browser.close();}
