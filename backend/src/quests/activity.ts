type Observation={action:string;startedAt:number;until:number;seat?:string;tray?:boolean;x:number;z:number};
type Activity={token:string;state:Observation;context?:string;last:number;bows:number;completed:boolean};
type Recorder=(delta:Record<string,number>,distinct?:Record<string,string>)=>void;

/** Observes server-validated actions; clients cannot submit counters or rewards. */
export class QuestActivity{
 private current?:Activity;
 private tray=false;
 private eatingMs=0;
 constructor(private record:Recorder){}
 sample(state:Observation,now:number,context?:string,nearby=false):void{
  if(this.current)this.consume(now,nearby);
  if(state.tray&&!this.tray)this.eatingMs=0;
  if(!state.tray&&this.tray){if(this.eatingMs>=5000)this.record({meals:1});this.eatingMs=0;}
  this.tray=!!state.tray;
  const token=`${state.action}:${state.startedAt}:${state.until}:${state.seat||''}`;
  if(this.current?.token!==token)this.current={token,state:{...state},context,last:now,bows:0,completed:false};
 }
 private consume(now:number,nearby:boolean):void{
  const a=this.current!,s=a.state,dt=Math.max(0,Math.min(1,(now-a.last)/1000));a.last=now;
  const age=Math.max(0,(Math.min(now,s.until||now)-s.startedAt)/1000);
  if(s.action==='pray'||s.action==='prostrate'){
   const count=s.action==='pray'?[4.5,6.6,8.7].filter(t=>age>=t).length:age>=4.5?1+Math.floor((age-4.5)/2.1):0;
   if(count>a.bows){this.record({bows:count-a.bows});a.bows=count;}
  }
  if(dt>0&&['meditate','listen'].includes(s.action)){
   if(s.seat?.startsWith('listen-'))this.record({lectureSeconds:dt});
   else if(s.seat?.startsWith('meditate-'))this.record({meditationSeconds:dt});
  }
  if(s.action==='eat'&&this.tray)this.eatingMs+=Math.round(dt*1000);
  if(a.completed||!Number.isFinite(s.until)||s.until<=s.startedAt||now<s.until)return;
  a.completed=true;
  const metrics:Record<string,string>={incense:'incense',sweep:'sweep',cook:'cook',wash:'wash',bell:'bell'};
  if(s.action==='water'){
   if(a.context?.startsWith('garden-'))this.record({garden:1},{plots:a.context});
   else this.record({tree:1});
  }else if(s.action==='pray')this.record({prayers:1},a.context?.startsWith('pray')?{altars:a.context}:{});
  else if(metrics[s.action])this.record({[metrics[s.action]]:1});
  else if(nearby&&['wave','bow'].includes(s.action))this.record({greetings:1});
 }
}
