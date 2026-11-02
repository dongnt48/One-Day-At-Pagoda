export type MapId='courtyard'|'hall'|'dining';
export type Spot={id:string;label:string;x:number;z:number;radius?:number;rotationY?:number};
export type Portal={id:string;label:string;x:number;z:number;target:MapId};
export const SPEED=5;
export const kitchenStations:Spot[]=[
 {id:'cook',label:'Nấu cơm chay',x:-.9,z:-11.3,radius:1.6},
 {id:'wash',label:'Rửa chén',x:11.5,z:-11.3,radius:1.6},
];
export const courtyardLandmarks={
 bellTower:{x:-17,z:-16,halfSize:3.4},
 pagoda:{x:17,z:-16,radius:3.6,levels:9},
};
export const gardenPlots=[{x:-18,z:13},{x:-18,z:20},{x:-24,z:13}];
export const maps:Record<MapId,{label:string;roomType:string;halfX:number;halfZ:number;spawn:{x:number;z:number};portals:Portal[]}>= {
 courtyard:{label:'Sân chùa',roomType:'public_temple',halfX:28,halfZ:26,spawn:{x:0,z:11},portals:[{id:'portal-hall',label:'Đến Chính điện',x:0,z:-9,target:'hall'},{id:'portal-dining',label:'Đến Nhà ăn',x:-14,z:3,target:'dining'}]},
 hall:{label:'Chính điện · Giảng đường',roomType:'main_hall',halfX:26,halfZ:36,spawn:{x:0,z:26},portals:[{id:'portal-courtyard',label:'Về Sân chùa',x:0,z:32,target:'courtyard'}]},
 dining:{label:'Nhà ăn',roomType:'dining_hall',halfX:16,halfZ:14,spawn:{x:0,z:11.5},portals:[{id:'portal-courtyard',label:'Về Sân chùa',x:0,z:13,target:'courtyard'}]},
};
export const lectureSeats:Spot[]=Array.from({length:100},(_,i)=>{
 const col=i%10,row=Math.floor(i/10);
 return {id:`listen-${i}`,label:`Nghe pháp · chỗ ${i+1}`,x:(col-4.5)*3.2+(col<5?-1.5:1.5),z:-14+row*4,radius:1.3};
});
export const diningTables=Array.from({length:10},(_,i)=>({x:(i%2===0?-8:8),z:-8+Math.floor(i/2)*4}));
export const diningSeats:Spot[]=diningTables.flatMap((table,i)=>Array.from({length:5},(_,j)=>({id:`eat-${i*5+j}`,label:`Ngồi ghế · chỗ ${i*5+j+1}`,x:table.x+(j-2)*1.4,z:table.z+1.2,radius:.85})));
export const mapSpots:Record<MapId,Spot[]>={
 courtyard:[{id:'bell',label:'Gõ chuông',x:courtyardLandmarks.bellTower.x,z:courtyardLandmarks.bellTower.z+1.7,radius:1.1},...gardenPlots.map((p,i)=>({id:`garden-${i}`,label:'Tưới rau',x:p.x,z:p.z+2.6,radius:1.2})),{id:'sweep',label:'Quét sân',x:-5,z:3},{id:'water',label:'Tưới cây',x:-22,z:-8},{id:'incense',label:'Thắp hương',x:0,z:-5.5,radius:2.8}],
 hall:[{id:'incense',label:'Thắp hương',x:0,z:-23,radius:2.8},{id:'pray',label:'Lễ Phật',x:0,z:-27},{id:'pray-left',label:'Lễ Phật · bàn trái',x:-18,z:-27},{id:'pray-right',label:'Lễ Phật · bàn phải',x:18,z:-27},...[-20,20].flatMap(x=>[-20,-10,0,10].map((z,i)=>({id:`meditate-${x}-${i}`,label:'Ngồi tĩnh tâm',x,z,radius:1.5}))),...lectureSeats],
 dining:[...kitchenStations,{id:'meal',label:'Nhận cơm chay',x:-8,z:-11},{id:'return-tray',label:'Trả khay',x:8,z:-11},...diningSeats],
};
export const trees=[[-25,-17],[-25,-7],[-25,4],[-25,16],[25,-15],[25,-4],[25,8],[24,22],[-9,22],[10,22]];
export const SPAWN=maps.courtyard.spawn;
export const spots=mapSpots.courtyard;
export function walkable(x:number,z:number,mapId:MapId='courtyard'){
 const map=maps[mapId];
 if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>map.halfX||Math.abs(z)>map.halfZ)return false;
 if(mapId==='courtyard'){
  const {bellTower,pagoda}=courtyardLandmarks;
  if(Math.hypot(x-bellTower.x,z-bellTower.z)<1.15)return false;
  if([-1,1].some(sx=>[-1,1].some(sz=>Math.hypot(x-bellTower.x-sx*2.25,z-bellTower.z-sz*2.25)<.55)))return false;
  if(Math.abs(x-bellTower.x)<2.35&&Math.abs(z-bellTower.z+2.25)<.25)return false;
  if(Math.hypot(x-pagoda.x,z-pagoda.z)<pagoda.radius)return false;
  if(gardenPlots.some(p=>Math.abs(x-p.x)<3.1&&Math.abs(z-p.z)<2))return false;
  if(((x-16)/5.1)**2+((z-2)/6.1)**2<1)return false;
  if(Math.abs(x)<8.4&&z < -9.4)return false;
  if(Math.abs(x)<1.25&&Math.abs(z+5.5)<.95)return false;
  // Dining facade: solid side wings; approach the open central doorway.
  const diningX=-(z-3)/1.5,diningZ=(x+18)/1.15;
  if(diningX>-3.5&&diningX<3.5&&diningZ>-3.1&&diningZ<2.15)return false;
  if([-3,3].some(cx=>Math.hypot(diningX-cx,diningZ-2.65)<.35))return false;
  if((Math.abs(x-3.6)<.75||Math.abs(x+3.6)<.75)&&Math.abs(z-25.5)<.8)return false;
  if(trees.some(([tx,tz])=>Math.hypot(x-tx,z-tz)<.9))return false;
 }
 if(mapId==='hall'){
  if(Math.abs(x)<4.5&&z<-29)return false;
  if([-18,18].some(cx=>Math.abs(x-cx)<4.5)&&z<-29)return false;
  if(Math.abs(x)<1.3&&Math.abs(z+23)<.85)return false;
  if([-24,24].some(cx=>[-26,-10,6,22].some(cz=>Math.hypot(x-cx,z-cz)<.65)))return false;
 }
 if(mapId==='dining'){
  if(diningTables.some(t=>Math.abs(x-t.x)<3.6&&Math.abs(z-t.z)<.75))return false;
  if(Math.abs(x)<14&&z<-12)return false;
 }
 return true;
}
export function interactionDistance(mapId:MapId,spot:Spot|Portal,x:number,z:number){
 if(mapId==='courtyard'&&spot.id.startsWith('garden-')){
  const plot=gardenPlots.find((_,i)=>spot.id===`garden-${i}`);
  if(plot)return Math.hypot(Math.max(0,Math.abs(x-plot.x)-2.8),Math.max(0,Math.abs(z-plot.z)-1.65));
 }
 return Math.hypot(spot.x-x,spot.z-z);
}
export function nearestInteraction(mapId:MapId,x:number,z:number){
 const candidates=[...mapSpots[mapId],...maps[mapId].portals];
 return candidates.filter(s=>interactionDistance(mapId,s,x,z)<('radius'in s?s.radius??2.8:2.8)).sort((a,b)=>interactionDistance(mapId,a,x,z)-interactionDistance(mapId,b,x,z))[0];
}
