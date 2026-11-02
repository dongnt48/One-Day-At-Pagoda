import {useEffect,useRef,useState} from 'react';
import {BellRing} from 'lucide-react';
import {activityTimeRange,scheduledActivityAt} from '../game/schedule';

export function ScheduleNotice(){
 const [activity,setActivity]=useState(()=>scheduledActivityAt(new Date()));
 const [resting,setResting]=useState(false),[cycle,setCycle]=useState(0),[reduced,setReduced]=useState(false);
 const viewport=useRef<HTMLDivElement>(null),track=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const refresh=()=>setActivity(scheduledActivityAt(new Date()));
  const timer=window.setInterval(refresh,1000);
  document.addEventListener('visibilitychange',refresh);
  window.addEventListener('focus',refresh);
  return ()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',refresh);window.removeEventListener('focus',refresh);};
 },[]);
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);
  return ()=>media.removeEventListener('change',update);
 },[]);
 useEffect(()=>{
  const container=viewport.current,text=track.current;if(!container||!text)return;
  let animation:Animation|undefined,timer:number|undefined,disposed=false;
  const rest=()=>{
   if(disposed)return;
   setResting(true);timer=window.setTimeout(()=>setCycle(c=>c+1),8000);
  };
  const play=()=>{
   animation?.cancel();window.clearTimeout(timer);setResting(false);
   if(reduced){timer=window.setTimeout(rest,12000);return;}
   const width=container.clientWidth,length=text.scrollWidth;
   animation=text.animate([{transform:`translateX(${width}px)`},{transform:`translateX(${-length}px)`}],{duration:(width+length)/65*1000,easing:'linear',fill:'forwards'});
   void animation.finished.then(rest).catch(()=>{});
  };
  let previousWidth=container.clientWidth;play();
  const observer=new ResizeObserver(()=>{if(container.clientWidth!==previousWidth){previousWidth=container.clientWidth;play();}});observer.observe(container);
  return ()=>{disposed=true;observer.disconnect();animation?.cancel();window.clearTimeout(timer);};
 },[activity.id,cycle,reduced]);
 const message=`${activityTimeRange(activity)} · ${activity.title} · ${activity.location} — ${activity.description}`;
 return <aside className="schedule-notice" data-resting={resting} data-reduced={reduced} role="status" aria-live="polite" aria-atomic="true" aria-label="Lịch sinh hoạt theo giờ Việt Nam" title={`${message} (Giờ Việt Nam)`}>
  <div className="schedule-marker" aria-hidden="true"><BellRing size={18}/></div>
  <div className="schedule-heading"><small>LỊCH HÔM NAY</small><span className="schedule-time">{activityTimeRange(activity)}</span></div>
  <div className="schedule-viewport" ref={viewport}><div className="schedule-track" ref={track}>
   <strong>{activity.title}</strong><span className="schedule-location"> · {activity.location}</span><span> — {activity.description}</span>
  </div></div>
 </aside>;
}
