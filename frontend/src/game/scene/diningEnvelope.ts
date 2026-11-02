import {BufferGeometry,Float32BufferAttribute} from 'three';

type WallPart={name:string;position:[number,number,number];size:[number,number,number]};
export function diningWallLayout(halfX:number,halfZ:number):WallPart[]{
 const height=5.75,doorHeight=4.1,doorHalf=2.6;
 const panelWidth=halfX+.4-doorHalf;
 return [
  ...[-1,1].map(side=>({name:`side-${side}`,position:[side*(halfX+.2),height/2,0] as [number,number,number],size:[.4,height,halfZ*2+.8] as [number,number,number]})),
  {name:'rear',position:[0,height/2,-halfZ-.2],size:[halfX*2+.8,height,.4]},
  ...[-1,1].map(side=>({name:`front-${side}`,position:[side*(doorHalf+panelWidth/2),height/2,halfZ+.2] as [number,number,number],size:[panelWidth,height,.4] as [number,number,number]})),
  {name:'entrance-lintel',position:[0,(height+doorHeight)/2,halfZ+.2],size:[doorHalf*2,height-doorHeight,.4]},
 ];
}

export function diningGableGeometry(halfX:number){
 const w=halfX+.4,g=new BufferGeometry();
 g.setAttribute('position',new Float32BufferAttribute([-w,5.75,0,w,5.75,0,0,7.85,0,-w,5.75,.4,w,5.75,.4,0,7.85,.4],3));
 g.setIndex([0,2,1,3,4,5,0,1,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,4]);
 g.computeVertexNormals();return g;
}
