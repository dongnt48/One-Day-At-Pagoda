import {mapSpots,nearestInteraction,type MapId} from '../maps.ts';

type InteractionPlayer={x:number;z:number;seat?:string;action?:string};
export function interactionForPlayer(mapId:MapId,player?:InteractionPlayer):{id:string;label:string}|undefined{
 if(!player||!Number.isFinite(player.x)||!Number.isFinite(player.z)||player.action==='pray')return;
 if(player.action==='prostrate'&&mapId==='hall')return {id:'stand',label:'Dừng lạy'};
 if(player.seat&&mapSpots[mapId].some(spot=>spot.id===player.seat))return {id:'stand',label:'Đứng lên'};
 const spot=nearestInteraction(mapId,player.x,player.z);
 if(!spot?.label.trim())return;
 return {id:spot.id,label:spot.label};
}
