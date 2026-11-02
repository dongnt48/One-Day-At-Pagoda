import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cushionSpots,cushionShape,hallSurfaceHeight} from '../src/game/scene/hallSurface.ts';

test('every hall cushion supports characters above its top instead of at floor level',()=>{
 const top=cushionShape.topY+cushionShape.topHeight/2;
 for(const p of cushionSpots){
  assert.ok(hallSurfaceHeight(p.x,p.z)>=top,`${p.id}: feet must clear the cushion`);
  assert.ok(hallSurfaceHeight(p.x+.3,p.z+.2)>=top,'feet remain supported when off centre');
 }
});
test('the clear central aisle and hall exit remain at floor height',()=>{
 for(const [x,z] of [[0,0],[0,26],[0,32],[0,-27]])assert.equal(hallSurfaceHeight(x,z),0);
});
