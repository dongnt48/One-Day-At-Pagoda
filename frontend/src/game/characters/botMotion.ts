type Position={x:number;z:number};

/** Follow server positions without letting a delayed update fling an NPC. */
export function followBotPosition(position:Position,target:Position,dt:number){
 // Preserve ordinary low-FPS time; only cap unusually long frame stalls.
 const frame=Math.max(0,Math.min(dt,.25)),dx=target.x-position.x,dz=target.z-position.z;
 const distance=Math.hypot(dx,dz);
 if(distance<1e-9)return;
 const step=Math.min(distance*(1-Math.exp(-16*frame)),3*frame);
 position.x+=dx/distance*step;
 position.z+=dz/distance*step;
}
