import type {Player} from '../types';
import {Character} from './Character';

/** Keep the original avatar at every distance; reduce only animation updates. */
export function Crowd({players,onSelect,barefoot=false,bubbles,detailedIds,selfId}:{players:Player[];onSelect:(id:string)=>void;barefoot?:boolean;bubbles?:ReadonlyMap<string,string>;detailedIds?:ReadonlySet<string>;selfId?:string}){
 return <group>{players.map(player=>{
  const detailed=detailedIds?.has(player.id)??false;
  return <Character key={player.id} player={player} self={player.id===selfId} barefoot={barefoot} showLabel={detailed} bubble={bubbles?.get(player.id)} animationFps={detailed?60:15} castShadow={detailed} onSelect={()=>onSelect(player.id)}/>;
 })}</group>;
}
