import type {Player} from '../types';
import {Character} from './Character';

/** Keep the original avatar at every distance; reduce only animation updates. */
export function Crowd({players,onSelect,barefoot=false,bubbles}:{players:Player[];onSelect:(id:string)=>void;barefoot?:boolean;bubbles?:ReadonlyMap<string,string>}){
 return <group>{players.map(player=><Character key={player.id} player={player} self={false} barefoot={barefoot} showLabel={false} bubble={bubbles?.get(player.id)} animationFps={15} castShadow={false} onSelect={()=>onSelect(player.id)}/>)}</group>;
}
