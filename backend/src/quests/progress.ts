import {quests,funTitles} from './catalog.js';
export type QuestProgress={version:1;counts:Record<string,number>;unique:Record<string,string[]>;completed:string[];merit:number;titleId:string|null;revision:number;lastMap?:string};
export function newProgress():QuestProgress{return {version:1,counts:{},unique:{},completed:[],merit:0,titleId:null,revision:0};}
export function advanceProgress(p:QuestProgress,delta:Record<string,number>,distinct:Record<string,string>={}):string[]{
 let changed=false;
 for(const [key,value] of Object.entries(delta))if(Number.isFinite(value)&&value>0&&value<=10000){p.counts[key]=Math.round(((p.counts[key]||0)+value)*1e6)/1e6;changed=true;}
 for(const [key,value] of Object.entries(distinct)){
  const items=p.unique[key]??(p.unique[key]=[]);
  if(!items.includes(value)){items.push(value);changed=true;}
 }
 if(!changed)return [];
 p.counts.mapCount=p.unique.maps?.length||0;p.counts.plotCount=p.unique.plots?.length||0;p.counts.altarCount=p.unique.altars?.length||0;
 p.counts.work=['sweep','tree','garden','cook','wash'].reduce((n,key)=>n+(p.counts[key]||0),0);
 p.counts.practice=(p.counts.bows||0)+(p.counts.incense||0)+Math.floor(((p.counts.meditationSeconds||0)+(p.counts.lectureSeconds||0))/60);
 const completed=new Set(p.completed),awarded:string[]=[];
 for(const q of quests)if(!completed.has(q.id)&&q.requirements.every(r=>(p.counts[r.key]||0)>=r.target)){
  completed.add(q.id);p.completed.push(q.id);p.merit+=q.reward;awarded.push(q.id);
 }
 p.revision++;return awarded;
}
export function equipTitle(p:QuestProgress,id:string|null):void {
 const title=funTitles.find(t=>t.id===id);
 if(id!==null&&(!title||p.merit<title.merit))throw Error('Bạn chưa mở pháp danh này.');
 if(p.titleId!==id){p.titleId=id;p.revision++;}
}
export function equippedTitle(p:QuestProgress):string|undefined{return funTitles.find(t=>t.id===p.titleId&&t.merit<=p.merit)?.name;}
