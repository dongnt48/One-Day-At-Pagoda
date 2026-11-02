import {test} from 'node:test';
import assert from 'node:assert/strict';
import {activeChatBubbles,CHAT_BUBBLE_MS} from '../src/game/multiplayer/chatBubbles.ts';

test('bubble shows the latest message per sender and expires after eight seconds',()=>{
 const messages=[{playerId:'a',text:'old',at:100},{playerId:'b',text:'hello',at:200},{playerId:'a',text:'new',at:300}];
 assert.deepEqual([...activeChatBubbles(messages,400)],[['a','new'],['b','hello']]);
 assert.deepEqual([...activeChatBubbles(messages,200+CHAT_BUBBLE_MS)],[['a','new']]);
 assert.equal(activeChatBubbles(messages,300+CHAT_BUBBLE_MS).size,0);
});
