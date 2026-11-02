import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
const ids=['red_brick_pavers','brown_planks_03','bark_brown_01','rock_boulder_dry','forest_ground_04','clay_roof_tiles'];
const output='public/textures';mkdirSync(output,{recursive:true});
const manifest=[];
for(const id of ids){
 const response=await fetch(`https://api.polyhaven.com/files/${id}`);if(!response.ok)throw Error(`${id}: ${response.status}`);
 const data=await response.json();
 for(const [key,suffix] of [['Diffuse','color'],['nor_gl','normal'],['Rough','roughness']]){
  const file=data[key]?.['1k']?.jpg;if(!file)throw Error(`${id} missing ${key} jpg 1k`);
  const path=`${output}/${id}_${suffix}.jpg`;
  if(!existsSync(path)){const r=await fetch(file.url);if(!r.ok)throw Error(`${r.status}: ${file.url}`);writeFileSync(path,Buffer.from(await r.arrayBuffer()));}
  manifest.push({path,source:file.url,asset:`https://polyhaven.com/a/${id}`,license:'CC0-1.0'});
 }
 console.log(`Downloaded ${id}`);
}
const hdri='kloofendal_48d_partly_cloudy_puresky';
const data=await(await fetch(`https://api.polyhaven.com/files/${hdri}`)).json();
const file=data.hdri['1k'].hdr;
const path=`${output}/morning-sky.hdr`;
if(!existsSync(path)){const r=await fetch(file.url);if(!r.ok)throw Error('HDR download failed');writeFileSync(path,Buffer.from(await r.arrayBuffer()));}
manifest.push({path,source:file.url,asset:`https://polyhaven.com/a/${hdri}`,license:'CC0-1.0'});
writeFileSync(`${output}/sources.json`,JSON.stringify(manifest,null,2));
console.log('Asset source manifest written.');
