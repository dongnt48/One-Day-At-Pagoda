import {lectureSeats,mapSpots} from '../maps.ts';

// Shared by the visible cushions and both detailed/distant characters.
export const cushionSpots=[...lectureSeats,...mapSpots.hall.filter(s=>s.id.startsWith('meditate'))];
export const cushionShape={width:1.55,depth:1.5,baseY:.055,baseHeight:.11,topY:.115,topHeight:.04,topWidth:1.44,topDepth:1.39};
export function hallSurfaceHeight(x:number,z:number):number {
 const pad=cushionSpots.find(p=>Math.abs(x-p.x)<=cushionShape.width/2+.12&&Math.abs(z-p.z)<=cushionShape.depth/2+.18);
 return pad?cushionShape.topY+cushionShape.topHeight/2+.005:0;
}
