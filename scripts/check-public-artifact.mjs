import {access,readdir,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
for(const path of ['cards','decks','catalog.json','catalog.pre-goat-repair.json','private','private-dev']){let exists=false;try{await access('dist/'+path);exists=true;}catch{}assert.equal(exists,false,'Private asset in public output: '+path);}
const assets=await readdir('dist/assets');assert.ok(assets.every(p=>!/EventHubPanel|EnginePreview|LegacyApp|CreatorArena/.test(p)),'Private chunk in public output');
const html=await readFile('dist/index.html','utf8');assert.ok(!/GOAT Deck Builder|GOAT Format deck builder/.test(html),'Old public GOAT branding');
assert.ok(!(await readFile('dist/sitemap.xml','utf8')).includes('goat'),'Private game in sitemap');
console.log('Public artifact boundary verified: private code/data are excluded.');
