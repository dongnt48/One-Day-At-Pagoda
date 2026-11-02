import {unpackMultiple} from '@colyseus/msgpackr';
export function watchState(page,onState){
 let state;
 page.on('websocket',ws=>ws.on('framereceived',({payload})=>{try{
  const [type,data]=unpackMultiple(payload.subarray(1));
  if(type==='state')state=data;
  else if(type==='state_patch'&&state){
   const next=new Map(state.players.map(p=>[p.id,p]));
   for(const id of data.removed)next.delete(id);for(const p of data.added)next.set(p.id,p);
   for(const [id,x,z,rotationY,action,seat,tray] of data.changed){const p=next.get(id);if(p)next.set(id,{...p,x,z,rotationY,action,seat:seat||undefined,tray});}
   state={...state,players:[...next.values()],...(data.gathering?{gathering:data.gathering}:{})};
  }else return;
  onState(state);
 }catch{}}));
}
