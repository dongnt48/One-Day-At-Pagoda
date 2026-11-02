import {db} from '../db/store.js';
import {quests,funTitles} from './catalog.js';
import {newProgress,advanceProgress,equipTitle,equippedTitle,type QuestProgress} from './progress.js';

db.exec('CREATE TABLE IF NOT EXISTS quest_progress(guest_id TEXT PRIMARY KEY, data TEXT NOT NULL)');
const cache=new Map<string,{profile:QuestProgress;savedAt:number;dirty:boolean}>();
export function progressFor(id:string):QuestProgress{
 let entry=cache.get(id);if(entry)return entry.profile;
 const row=db.prepare('SELECT data FROM quest_progress WHERE guest_id=?').get(id) as {data:string}|undefined;
 const profile=row?JSON.parse(row.data) as QuestProgress:newProgress();
 entry={profile,savedAt:Date.now(),dirty:false};cache.set(id,entry);return profile;
}
export function saveProgress(id:string,force=false):void{
 const entry=cache.get(id);if(!entry||!entry.dirty)return;
 if(!force&&Date.now()-entry.savedAt<5000)return;
 db.prepare('INSERT INTO quest_progress(guest_id,data) VALUES(?,?) ON CONFLICT(guest_id) DO UPDATE SET data=excluded.data').run(id,JSON.stringify(entry.profile));
 entry.savedAt=Date.now();entry.dirty=false;
}
export function recordProgress(id:string,delta:Record<string,number>,distinct:Record<string,string>={}):{awarded:string[];merit:number}{
 const p=progressFor(id),before=p.merit,revision=p.revision;
 const awarded=advanceProgress(p,delta,distinct);
 if(p.revision!==revision){cache.get(id)!.dirty=true;saveProgress(id,awarded.length>0);}
 return {awarded,merit:p.merit-before};
}
export function visitMap(id:string,map:string):void{
 const p=progressFor(id);if(p.lastMap===map)return;
 p.lastMap=map;recordProgress(id,{visits:1},{maps:map});saveProgress(id,true);
}
export function selectTitle(id:string,titleId:string|null):string|undefined{
 const p=progressFor(id);equipTitle(p,titleId);cache.get(id)!.dirty=true;saveProgress(id,true);return equippedTitle(p);
}
export function releaseProgress(id:string):void{saveProgress(id,true);cache.delete(id);}
export function questSnapshot(id:string){const p=progressFor(id);return {profile:{counts:p.counts,completed:p.completed,merit:p.merit,titleId:p.titleId,revision:p.revision},catalog:quests,titles:funTitles};}
export function questUpdate(id:string){const p=progressFor(id);return {counts:p.counts,completed:p.completed,merit:p.merit,titleId:p.titleId,revision:p.revision};}
export {equippedTitle};
