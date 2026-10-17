import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const dir=await mkdtemp(join(tmpdir(),'dt-goat-audit-'));
try{
 const local=[{id:1,name:'Existing Core'}];
 const response={data:[{id:1,name:'Existing Core',card_sets:[{set_code:'LOB-001'}]},{id:2,name:'Mind Control',card_sets:[{set_code:'TLM-EN000'}]},{id:3,name:'Sinister Serpent',card_sets:[{set_code:'DDS-001'}]},{id:4,name:'Exarion Universe',card_sets:[{set_code:'CT2-EN002'}]},{id:5,name:'Future Card',card_sets:[{set_code:'CRV-EN001'}]}]};
 // The fixture is deliberately smaller than a full API response; append filler unknown records.
 for(let n=10;n<1010;n++)response.data.push({id:n,name:`Future filler ${n}`,card_sets:[{set_code:'CRV-EN099'}]});
 await writeFile(join(dir,'catalog.json'),JSON.stringify(local));await writeFile(join(dir,'api.json'),JSON.stringify(response));
 const cp=spawnSync(process.execPath,[join(import.meta.dirname,'build-goat-release-manifest.mjs'),`--catalog=${join(dir,'catalog.json')}`,`--api-file=${join(dir,'api.json')}`,`--out=${join(dir,'report')}`],{encoding:'utf8'});
 if(cp.status!==0)throw Error(cp.stderr||cp.stdout);
 const report=JSON.parse(await readFile(join(dir,'report/release-audit.json'),'utf8'));
 if(report.missingCoreCandidates!==1||report.missingPromoCandidates!==1||report.catalogCount!==1)throw Error(JSON.stringify(report));
 const contents=await readFile(join(dir,'report/core-missing-candidates.csv'),'utf8');if(!contents.includes('Mind Control')||contents.includes('Sinister Serpent'))throw Error('Unexpected manifest');
 console.log('PASS: core candidate, promo review, exclusion and existing catalog preservation');
}finally{await rm(dir,{recursive:true,force:true})}
