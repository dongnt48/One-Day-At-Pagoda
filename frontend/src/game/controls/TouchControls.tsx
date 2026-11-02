import {useEffect,useRef,useState,type RefObject,type PointerEvent} from 'react';
export type TouchInput={x:number;z:number;lookX:number;lookY:number;zoom:number};
export const emptyTouch=():TouchInput=>({x:0,z:0,lookX:0,lookY:0,zoom:0});
export function useTouchDevice(){
 const [touch,setTouch]=useState(()=>matchMedia('(pointer: coarse)').matches);
 useEffect(()=>{const media=matchMedia('(pointer: coarse)');const update=()=>setTouch(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 return touch;
}
type Contact={id:number;x:number;y:number};
export function TouchControls({input,enabled}:{input:RefObject<TouchInput>;enabled:boolean}){
 const stick=useRef<Contact|null>(null),look=useRef<Contact|null>(null);
 const contacts=useRef(new Map<number,{x:number;y:number}>()),pinch=useRef<number|null>(null);
 const [origin,setOrigin]=useState<{x:number;y:number}|null>(null);
 const [knob,setKnob]=useState({x:0,y:0});
 const reset=()=>{input.current=emptyTouch();stick.current=null;look.current=null;contacts.current.clear();pinch.current=null;setOrigin(null);setKnob({x:0,y:0});};
 useEffect(()=>{reset();window.addEventListener('blur',reset);document.addEventListener('visibilitychange',reset);return()=>{reset();window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',reset);};},[enabled]);
 const start=(e:PointerEvent<HTMLDivElement>)=>{
  if(!enabled)return;
  if(contacts.current.size>=2)return;
  contacts.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
  e.currentTarget.setPointerCapture(e.pointerId);
  if(contacts.current.size===2){
   const [a,b]=[...contacts.current.values()];
   pinch.current=Math.hypot(a.x-b.x,a.y-b.y);
   stick.current=null;look.current=null;setOrigin(null);setKnob({x:0,y:0});
   input.current.x=0;input.current.z=0;input.current.lookX=0;input.current.lookY=0;
   return;
  }
  const r=e.currentTarget.getBoundingClientRect();
  if(e.clientX-r.left<r.width/2){
   if(stick.current)return;
   stick.current={id:e.pointerId,x:e.clientX,y:e.clientY};
   setOrigin({x:e.clientX-r.left,y:e.clientY-r.top});setKnob({x:0,y:0});
  }else{
   if(look.current)return;
   look.current={id:e.pointerId,x:e.clientX,y:e.clientY};
  }
 };
 const move=(e:PointerEvent<HTMLDivElement>)=>{
  if(!enabled)return;
  if(!contacts.current.has(e.pointerId))return;
  contacts.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(contacts.current.size===2&&pinch.current!==null){
   const [a,b]=[...contacts.current.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);
   input.current.zoom+=(pinch.current-distance)*.025;pinch.current=distance;
   return;
  }
  const s=stick.current,p=look.current;
  if(s?.id===e.pointerId){
   const dx=e.clientX-s.x,dy=e.clientY-s.y,length=Math.hypot(dx,dy),scale=40/Math.max(40,length);
   setKnob({x:dx*scale,y:dy*scale});input.current.x=length<7?0:dx*scale/40;input.current.z=length<7?0:dy*scale/40;
  }
  if(p?.id===e.pointerId){input.current.lookX+=e.clientX-p.x;input.current.lookY+=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;}
 };
 const end=(e:PointerEvent<HTMLDivElement>)=>{
  contacts.current.delete(e.pointerId);pinch.current=null;
  if(stick.current?.id===e.pointerId){stick.current=null;input.current.x=0;input.current.z=0;setOrigin(null);setKnob({x:0,y:0});}
  if(look.current?.id===e.pointerId)look.current=null;
 };
 return <div className="touch-controls" hidden={!enabled}>
  <div className="touch-surface" aria-label="Kéo nửa trái để di chuyển, nửa phải để xoay; chụm hoặc tách hai ngón để thu phóng" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
   {origin&&<div className="touch-stick" style={{left:origin.x,top:origin.y}}><span style={{transform:`translate(${knob.x}px,${knob.y}px)`}}/></div>}
  </div>
 </div>;
}
