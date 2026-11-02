import type {Player,Gathering} from '../types';
export type StatePatch={added:Player[];removed:string[];changed:[string,number,number,number,Player['action'],string,boolean,string?][];gathering?:Gathering};
export function applyPatch(players:Player[],patch:StatePatch):Player[]{
 const next=new Map(players.map(p=>[p.id,p]));
 for(const id of patch.removed)next.delete(id);
 for(const p of patch.added)next.set(p.id,p);
 for(const [id,x,z,rotationY,action,seat,tray,title] of patch.changed){const p=next.get(id);if(p)next.set(id,{...p,x,z,rotationY,action,seat:seat||undefined,tray,...(title!==undefined?{title:title||undefined}:{})});}
 return [...next.values()];
}
