const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const portraits=JSON.parse(fs.readFileSync(path.join(root,'public/champions-portraits.json')));
const source=fs.readFileSync(path.join(root,'public/competitions.js'),'utf8');
const lookup=source.match(/ function portrait\(p\)\{[^\n]+\}/)[0];
function resolve(p,map=portraits){return vm.runInNewContext(lookup+';portrait(p)',{p,portraits:map});}
test('every portrait has traceable identity and a reusable license',()=>{
 assert.ok(Object.keys(portraits).length>0);
 for(const [id,p] of Object.entries(portraits)){
  assert.match(id,/^\d+$/);assert.ok(p.name);assert.match(p.birth,/^\d{4}-\d{2}-\d{2}$/);
  assert.match(p.entity,/^https?:\/\/www.wikidata.org\/entity\/Q\d+$/);
  assert.match(p.source,/^https:\/\/commons.wikimedia.org\/wiki\/File:/);
  assert.match(p.url,/^https:\/\/upload.wikimedia.org\/wikipedia\/commons\//);
  assert.ok(p.author);assert.match(p.license,/^(CC BY(?:-SA)? [1-4]\.0|CC0(?: 1\.0)?|Public domain)$/);
  if(p.license.startsWith('CC BY'))assert.match(p.licenseUrl,/^https:\/\/creativecommons.org\//);
 }
});
test('stale IDs, names or birth dates never display another player portrait',()=>{
 const [id,v]=Object.entries(portraits)[0];const p={id:Number(id),name:v.name,birth:v.birth};
 assert.equal(resolve(p).url,v.url);
 assert.equal(resolve({...p,name:'Another player'}),null);
 assert.equal(resolve({...p,birth:'1900-01-01'}),null);
 assert.equal(resolve({...p,id:-1}),null);
 assert.equal(resolve(p,{[id]:{...v,url:'javascript:alert(1)'}}),null);
});
