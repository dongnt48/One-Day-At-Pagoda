import {maps,mapSpots,walkable,type MapId} from './maps.js';
import {gatheringAt} from './gathering.js';

export type BotPlayer={id:string;displayName:string;avatar:string;x:number;y:number;z:number;rotationY:number;action:string;isBot:boolean;seat?:string;tray?:boolean;title?:string};
type Point={x:number;z:number};
type Destination=Point&{action:string;seat?:string;tray?:boolean;duration:number};
type Bot={player:BotPlayer;path:Point[];destination?:Destination;until:number;meal:'collect'|'eat'|'return'};
const names=['An Nhiên','Thiện Tâm','Minh An','Tịnh Tâm','Diệu An','Tuệ Minh','Thanh Bình','Tâm An','Thiện Hòa','Diệu Hương'];

/** Ambient visitors have no sockets, guest identities, social state or quests. */
export class BotPopulation{
 private bots:Bot[]=[];
 private serial=0;
 private target:number;
 private nextTarget=0;
 private nextArrival=0;
 private grid=new Map<string,Point>();
 private edges=new Map<string,string[]>();
 private baseline:number;
 constructor(private mapId:MapId,count:number,private random= Math.random){
  this.baseline=Number.isFinite(count)?Math.max(0,Math.min(25,Math.floor(count))):0;
  this.target=this.baseline;
  if(!this.baseline)return;
  const map=maps[mapId];
  for(let x=-map.halfX+1;x<map.halfX;x++)for(let z=-map.halfZ+1;z<map.halfZ;z++){
   if(walkable(x,z,mapId))this.grid.set(`${x},${z}`,{x,z});
  }
  for(const [key,p] of this.grid){
   this.edges.set(key,[[1,0],[-1,0],[0,1],[0,-1]].map(([x,z])=>`${p.x+x},${p.z+z}`).filter(k=>this.grid.has(k)&&this.clear(p,this.grid.get(k)!)));
  }
  for(let i=0;i<this.baseline;i++)this.add();
 }
 get players(){return this.bots.map(b=>b.player);}
 private clear(a:Point,b:Point){
  const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.2));
  for(let i=0;i<=steps;i++)if(!walkable(a.x+(b.x-a.x)*i/steps,a.z+(b.z-a.z)*i/steps,this.mapId))return false;
  return true;
 }
 private pick<T>(items:T[]):T{return items[Math.floor(this.random()*items.length)];}
 private add(){
  const point=this.pick([...this.grid.values()]);if(!point)return;
  const index=this.serial++;
  this.bots.push({player:{id:`npc-${this.mapId}-${index}`,displayName:`${names[index%names.length]} · NPC`,avatar:index%2?'female':'male',...point,y:0,rotationY:Math.PI,action:'idle',isBot:true,title:'Khách viếng chùa · NPC'},path:[],until:0,meal:'collect'});
 }
 private route(start:Point,end:Point):Point[]|undefined{
  const near=(p:Point)=>[...this.grid.entries()].filter(([,v])=>Math.hypot(v.x-p.x,v.z-p.z)<1.6&&this.clear(p,v)).sort((a,b)=>Math.hypot(a[1].x-p.x,a[1].z-p.z)-Math.hypot(b[1].x-p.x,b[1].z-p.z))[0];
  const from=near(start),to=near(end);if(!from||!to)return;
  const previous=new Map<string,string|null>([[from[0],null]]),queue=[from[0]];
  for(let i=0;i<queue.length&&!previous.has(to[0]);i++)for(const key of this.edges.get(queue[i])??[]){
   if(previous.has(key))continue;previous.set(key,queue[i]);queue.push(key);
  }
  if(!previous.has(to[0]))return;
  const path:Point[]=[end];let key:string|null=to[0];
  while(key!==null){path.push(this.grid.get(key)!);key=previous.get(key)!;}
  return path.reverse();
 }
 private choose(bot:Bot,occupied:Set<string>):Destination|undefined{
  const spots=mapSpots[this.mapId];
  const duration=8000+this.random()*22000;
  if(this.mapId==='dining'){
   if(bot.meal==='eat'){
    const seats=spots.filter(s=>s.id.startsWith('eat-')&&!occupied.has(s.id));
    if(!seats.length)return;
    const seat=this.pick(seats);return {...seat,seat:seat.id,action:'eat',tray:true,duration};
   }
   const spot=spots.find(s=>s.id===(bot.meal==='collect'?'meal':'return-tray'))!;
   return {x:spot.x,z:spot.z+.9,action:'idle',tray:bot.meal==='collect',duration:1800};
  }
  if(this.random()<.3){const point=this.pick([...this.grid.values()]);return {...point,action:'idle',duration:3000+this.random()*5000};}
  if(this.mapId==='hall'){
   const candidates=spots.filter(s=>(s.id.startsWith('meditate-')||s.id.startsWith('listen-')||s.id.startsWith('pray'))&&!occupied.has(s.id));
   const spot=this.pick(candidates);if(!spot)return;
   if(spot.id.startsWith('pray'))return {x:spot.x,z:spot.z+1,action:'pray',duration:12000};
   return {...spot,seat:spot.id,action:'meditate',duration};
  }
  const spot=this.pick(spots.filter(s=>s.id==='sweep'||s.id==='water'||s.id.startsWith('garden-')));
  return {x:spot.x,z:spot.z+(spot.id.startsWith('garden-')?0:1),action:spot.id==='sweep'?'sweep':'water',duration};
 }
 update(now:number,dt:number,humans:ReadonlyArray<{seat?:string}>,capacity:number){
  if(!this.baseline)return;
  const available=Math.max(0,capacity-humans.length);
  // Yield immediately when humans need room; normal changes are staggered.
  if(this.bots.length>available)this.bots.length=available;
  if(!this.nextTarget)this.nextTarget=now+30000;
  if(now>=this.nextTarget){
   this.target=Math.max(0,this.baseline-5)+Math.floor(this.random()*(Math.min(25,this.baseline+5)-Math.max(0,this.baseline-5)+1));
   this.nextTarget=now+30000+this.random()*30000;
  }
  const desired=Math.min(this.target,available);
  if(now>=this.nextArrival&&this.bots.length!==desired){
   if(this.bots.length<desired)this.add();else this.bots.pop();
   this.nextArrival=now+3000+this.random()*4000;
  }
  const humanSeats=new Set(humans.map(p=>p.seat).filter((s):s is string=>!!s));
  const occupied=new Set([...humanSeats,...this.bots.flatMap(b=>b.destination?.seat?[b.destination.seat]:b.player.seat?[b.player.seat]:[])]);
  for(const bot of this.bots){
   const p=bot.player;
   if((p.seat&&humanSeats.has(p.seat))||(bot.destination?.seat&&humanSeats.has(bot.destination.seat))){
    bot.destination=undefined;bot.path=[];p.seat=undefined;p.action='idle';bot.until=now+1000;
   }
   if(p.seat?.startsWith('listen-'))p.action=gatheringAt(now).active?'listen':'meditate';
   if(now<bot.until)continue;
   if(!bot.destination){
    if(p.seat)occupied.delete(p.seat);p.seat=undefined;
    const destination=this.choose(bot,occupied);
    const path=destination&&this.route(p,destination);
    if(!destination||!path){bot.until=now+2000;continue;}
    bot.destination=destination;bot.path=path;
    if(destination.seat)occupied.add(destination.seat);
   }
   const next=bot.path[0];
   if(next){
    const distance=Math.hypot(next.x-p.x,next.z-p.z),step=Math.min(distance,2.4*Math.min(dt/1000,.1));
    if(distance>.001){p.rotationY=Math.atan2(next.x-p.x,next.z-p.z);p.x+=(next.x-p.x)*step/distance;p.z+=(next.z-p.z)*step/distance;p.action='walk';}
    if(distance<=step+.001)bot.path.shift();
   }
   if(!bot.path.length){
    const destination=bot.destination!;p.action=destination.action;p.seat=destination.seat;p.rotationY=Math.PI;
    if(destination.tray!==undefined)p.tray=destination.tray;
    if(this.mapId==='dining')bot.meal=bot.meal==='collect'?'eat':bot.meal==='eat'?'return':'collect';
    bot.until=now+destination.duration;bot.destination=undefined;
   }
  }
 }
}
