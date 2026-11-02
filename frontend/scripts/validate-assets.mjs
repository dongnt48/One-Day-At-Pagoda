import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const clips=['idle','walk','wave','bow','sit','incense','sweep','water','meditate','eat','carry','carry_walk'];
for(const name of ['male','female']){
 const path=`public/models/${name}_lam.glb`,b=readFileSync(path);
 assert.equal(b.toString('utf8',0,4),'glTF');
 const g=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));
 assert.ok(g.asset.generator.includes('Blender'),'Models must be exported by the editable Blender pipeline');
 assert.ok(g.skins?.length>0,'Character needs a deforming armature');
 assert.deepEqual(g.animations.map(a=>a.name).sort(),clips.toSorted());
 assert.ok(g.animations.every(a=>a.channels.length>=5),'Each clip must include body and limb transforms');
 assert.ok(g.materials.length>=6,'Clothing, skin, hair, eyes and sandals have distinct materials');
 assert.ok(statSync(path).size<3_000_000,'Each character must stay under 3MB');
 const names=g.nodes.map(n=>n.name||'');
 for(const bone of ['Body','Head','LeftArm','RightArm','LeftLeg','RightLeg'])assert.ok(names.includes(bone),`Missing ${bone}`);
 console.log(`${name}: ${g.animations.length} animations, ${g.skins.length} skin(s), ${(b.length/1024).toFixed(0)} KiB`);
}
