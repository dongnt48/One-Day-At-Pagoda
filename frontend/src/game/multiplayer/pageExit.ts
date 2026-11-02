type LeavingRoom={leave(consented?:boolean):Promise<unknown>};

/** A reload is a voluntary exit, not a network drop awaiting reconnection. */
export function leaveOnPageHide(
 target:EventTarget,
 getRoom:()=>LeavingRoom|null,
 onExit:()=>void,
){
 const exit=()=>{
  const room=getRoom();
  onExit();
  if(room)void room.leave(true).catch(()=>{});
 };
 target.addEventListener('pagehide',exit);
 return()=>target.removeEventListener('pagehide',exit);
}
