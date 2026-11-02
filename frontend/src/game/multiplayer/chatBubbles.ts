import type {ChatMessage} from '../types';

export const CHAT_BUBBLE_MS=8000;
export function activeChatBubbles(messages:readonly ChatMessage[],now:number):Map<string,string>{
 const bubbles=new Map<string,string>();
 for(const message of messages)if(now-message.at<CHAT_BUBBLE_MS)bubbles.set(message.playerId,message.text);
 return bubbles;
}
