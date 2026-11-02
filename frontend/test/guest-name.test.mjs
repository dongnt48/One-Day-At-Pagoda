import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateGuestName} from '../src/game/multiplayer/guestName.ts';

test('suggested guest names fit the existing name validation and include a numeric suffix',()=>{
 for(const random of [0,.1,.25,.5,.75,.999999]){
  const name=generateGuestName(()=>random);
  assert.ok(name.length>=2&&name.length<=20);
  assert.match(name,/^[\p{L} ]+ \d{3}$/u);
 }
 assert.notEqual(generateGuestName(()=>0),generateGuestName(()=>.5));
});
