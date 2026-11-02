import {test} from 'node:test';
import assert from 'node:assert/strict';
import {QuestActivity} from '../src/quests/activity.js';

const state=(action:string,start:number,until:number,extra={})=>({action,startedAt:start,until,x:0,z:0,...extra});
test('interrupted chores do not count and completed chores count once despite repeated samples',()=>{
 const events:Record<string,number>[]=[],tracker=new QuestActivity(d=>events.push(d));
 tracker.sample(state('wash',1000,7000),1000);tracker.sample(state('idle',1000,0),4000);
 assert.equal(events.length,0);
 tracker.sample(state('wash',8000,14000),8000);tracker.sample(state('wash',8000,14000),14000);tracker.sample(state('wash',8000,14000),15000);
 assert.deepEqual(events,[{wash:1}]);
});
test('continuous and finite bows count completed bows, including when stopping between ticks',()=>{
 let bows=0,prayers=0;const tracker=new QuestActivity(d=>{bows+=d.bows||0;prayers+=d.prayers||0;});
 tracker.sample(state('prostrate',1000,Infinity),1000);tracker.sample(state('idle',1000,0),5500);assert.equal(bows,1);
 tracker.sample(state('pray',10000,22000),10000,'pray-left');tracker.sample(state('pray',10000,22000),22000);assert.equal(bows,4);assert.equal(prayers,1);
 tracker.sample(state('pray',10000,22000),23000);assert.equal(bows,4);assert.equal(prayers,1);
});
test('a meal requires receiving a tray, actually eating, then returning it',()=>{
 let meals=0;const tracker=new QuestActivity(d=>{meals+=d.meals||0;});
 tracker.sample(state('idle',0,0,{tray:false}),0);
 tracker.sample(state('idle',1000,0,{tray:true}),1000);tracker.sample(state('idle',2000,0,{tray:false}),2000);assert.equal(meals,0);
 tracker.sample(state('idle',3000,0,{tray:true}),3000);tracker.sample(state('eat',4000,Infinity,{tray:true,seat:'eat-0'}),4000);
 for(let t=5000;t<=10000;t+=1000)tracker.sample(state('eat',4000,Infinity,{tray:true,seat:'eat-0'}),t);
 tracker.sample(state('idle',11000,0,{tray:false}),11000);assert.equal(meals,1);
});
test('exactly five seconds of eating at the network tick boundary counts a meal',()=>{
 let meals=0;const tracker=new QuestActivity(d=>{meals+=d.meals||0;});
 tracker.sample(state('idle',0,0,{tray:true}),0);
 tracker.sample(state('eat',0,Infinity,{tray:true,seat:'eat-0'}),0);
 for(let time=100;time<=5000;time+=100)tracker.sample(state('eat',0,Infinity,{tray:true,seat:'eat-0'}),time);
 tracker.sample(state('idle',5000,0,{tray:false}),5000);assert.equal(meals,1);
});
