import {test} from 'node:test';
import assert from 'node:assert/strict';
import {courtyardLandmarks,walkable,maps,mapSpots} from '../src/realtime/maps.js';
import {courtyardLandmarks as visualLandmarks} from '../../frontend/src/game/maps.js';

test('courtyard landmarks have matching visual and server bounds and nine pagoda levels',()=>{
 assert.deepEqual(courtyardLandmarks,visualLandmarks);
 assert.equal(courtyardLandmarks.pagoda.levels,9);
 const {bellTower,pagoda}=courtyardLandmarks;
 for(const p of [bellTower,pagoda]){
  assert.equal(walkable(p.x,p.z),false,'cannot enter the structure');
  for(const [dx,dz] of [[4.5,0],[-4.5,0],[0,4.5],[0,-4.5]])assert.ok(walkable(p.x+dx,p.z+dz),'paths around the landmark remain open');
 }
 assert.equal(walkable(bellTower.x+2.25,bellTower.z+2.25),false,'columns remain solid');
 for(let z=bellTower.z+4;z>=bellTower.z+1.5;z-=.25)assert.ok(walkable(bellTower.x,z),'front entry into the bell tower stays open');
 assert.equal(walkable(pagoda.x+2,pagoda.z+2),false);
 for(const p of [...maps.courtyard.portals,...mapSpots.courtyard].filter(p=>p.id!=='incense'))assert.ok(walkable(p.x,p.z),p.id);
 for(let z=-8;z<=24;z++)assert.ok(walkable(3,z),'main approach beside the incense burner stays clear');
});
