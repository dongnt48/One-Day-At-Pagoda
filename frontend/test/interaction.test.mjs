import {test} from 'node:test';
import assert from 'node:assert/strict';
import {interactionForPlayer} from '../src/game/controls/interaction.ts';

test('no empty E prompt without a player, nearby target, or valid current-map seat',()=>{
 assert.equal(interactionForPlayer('courtyard',undefined),undefined);
 assert.equal(interactionForPlayer('courtyard',{x:0,z:11}),undefined);
 assert.equal(interactionForPlayer('courtyard',{x:0,z:11,seat:'eat-0'}),undefined,'old room seat must not create a blank prompt');
 assert.equal(interactionForPlayer('courtyard',{x:NaN,z:11}),undefined);
});
test('prompt always carries a real action and label, and clears when leaving the target',()=>{
 assert.deepEqual(interactionForPlayer('courtyard',{x:0,z:-3.1}),{id:'incense',label:'Thắp hương'});
 assert.equal(interactionForPlayer('courtyard',{x:0,z:11}),undefined,'walking away clears the prompt');
 assert.deepEqual(interactionForPlayer('dining',{x:0,z:11}),{id:'portal-courtyard',label:'Về Sân chùa'},'changing rooms resolves the new room target instead of retaining the old one');
 assert.deepEqual(interactionForPlayer('hall',{x:0,z:0,seat:'listen-0'}),{id:'stand',label:'Đứng lên'});
 assert.equal(interactionForPlayer('hall',{x:0,z:-27,action:'pray'}),undefined,'cannot interact during the automatic prayer');
 assert.deepEqual(interactionForPlayer('hall',{x:0,z:0,action:'prostrate'}),{id:'stand',label:'Dừng lạy'});
});
