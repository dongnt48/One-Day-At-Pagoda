import {test} from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_PATH=':memory:';
const {progressFor,recordProgress,releaseProgress,visitMap,selectTitle}=await import('../src/quests/store.js');
test('progress, merit and selected title survive disconnect and room travel without duplicate visit rewards',()=>{
 const id='persistent-player';visitMap(id,'courtyard');recordProgress(id,{bows:9});
 const before=structuredClone(progressFor(id));selectTitle(id,'sprout');releaseProgress(id);
 const restored=progressFor(id);assert.equal(restored.merit,before.merit);assert.deepEqual(restored.completed,before.completed);assert.equal(restored.titleId,'sprout');
 visitMap(id,'courtyard');assert.equal(restored.counts.visits,1,'reconnecting does not farm visits');
 visitMap(id,'hall');assert.equal(restored.counts.visits,2);assert.equal(restored.counts.mapCount,2);
 const merit=restored.merit;recordProgress(id,{});assert.equal(restored.merit,merit);
});
