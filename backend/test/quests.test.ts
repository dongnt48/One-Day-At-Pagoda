import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quests,funTitles} from '../src/quests/catalog.js';
import {newProgress,advanceProgress,equipTitle} from '../src/quests/progress.js';

test('catalog has exactly 300 unique permanent quests and every title is reachable',()=>{
 assert.equal(quests.length,300);assert.equal(new Set(quests.map(q=>q.id)).size,300);
 assert.equal(new Set(quests.map(q=>q.title)).size,300);
 assert.equal(new Set(quests.map(q=>q.category)).size,15);
 assert.ok(quests.reduce((n,q)=>n+q.reward,0)>=funTitles.at(-1)!.merit);
});
test('progress never resets across dates and rewards each completed quest once',()=>{
 const p=newProgress();advanceProgress(p,{bows:3});
 const merit=p.merit,completed=[...p.completed];assert.ok(merit>0);
 advanceProgress(p,{});assert.equal(p.merit,merit);assert.deepEqual(p.completed,completed);
 advanceProgress(p,{bows:3});assert.equal(p.counts.bows,6);assert.ok(p.merit>merit);
 const restored=JSON.parse(JSON.stringify(p));advanceProgress(restored,{});assert.deepEqual(restored,p);
});
test('combinations and distinct locations use authoritative accumulated counters',()=>{
 const p=newProgress();advanceProgress(p,{garden:1},{plots:'garden-0'});advanceProgress(p,{garden:1},{plots:'garden-0'});
 assert.equal(p.counts.plotCount,1);
 advanceProgress(p,{garden:1},{plots:'garden-1'});advanceProgress(p,{garden:1},{plots:'garden-2'});
 assert.equal(p.counts.plotCount,3);assert.equal(p.counts.work,4);
 advanceProgress(p,{bows:3});assert.ok(p.completed.includes('journey-1'));
});
test('locked titles cannot be equipped and merit is never spent when selecting',()=>{
 const p=newProgress();assert.throws(()=>equipTitle(p,funTitles.at(-1)!.id));
 equipTitle(p,funTitles[0].id);assert.equal(p.titleId,funTitles[0].id);assert.equal(p.merit,0);
 equipTitle(p,null);assert.equal(p.titleId,null);
});
