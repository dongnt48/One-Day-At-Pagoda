import {test} from 'node:test';
import assert from 'node:assert/strict';
import {visibleGameHeight} from '../src/game/controls/gameViewport.ts';

const normal={innerHeight:880,visualHeight:880,outerHeight:1000,screenY:0,availableTop:0,availableHeight:1080,touch:false};
test('a desktop window extending below the screen keeps game controls in the visible work area',()=>{
 assert.equal(visibleGameHeight({...normal,screenY:100,availableHeight:1000}),780);
 assert.equal(visibleGameHeight({...normal,innerHeight:1000,outerHeight:1120,availableHeight:960}),840);
});
test('normal windows, mobile browser bars and keyboard use the actual visible viewport',()=>{
 assert.equal(visibleGameHeight(normal),880);
 assert.equal(visibleGameHeight({...normal,visualHeight:460,touch:true}),460);
 assert.equal(visibleGameHeight({...normal,availableHeight:0}),880);
});
