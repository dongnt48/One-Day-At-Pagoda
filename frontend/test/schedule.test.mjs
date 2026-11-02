import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dailySchedule,scheduledActivityAt} from '../src/game/schedule.ts';

test('every minute belongs to exactly one activity, including overnight',()=>{
 for(let minute=0;minute<1440;minute++){
  const date=new Date(Date.UTC(2026,10,2,0,minute-420));
  const matches=dailySchedule.filter(s=>s.start<s.end?minute>=s.start&&minute<s.end:minute>=s.start||minute<s.end);
  assert.equal(matches.length,1,`minute ${minute}`);
  assert.equal(scheduledActivityAt(date),matches[0]);
 }
});
test('Vietnam time switches at exact boundaries regardless of device timezone',()=>{
 assert.equal(scheduledActivityAt(new Date('2026-11-01T21:29:59Z')).id,'rest');
 assert.equal(scheduledActivityAt(new Date('2026-11-01T21:30:00Z')).id,'bell');
 assert.equal(scheduledActivityAt(new Date('2026-11-01T22:00:00Z')).id,'morning-prayer');
 assert.equal(scheduledActivityAt(new Date('2026-11-02T13:30:00Z')).id,'rest');
});
