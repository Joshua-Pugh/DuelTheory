/**
 * GOAT card candidate builder from TCG printing families named by GoatFormat.com.
 * Does NOT equate a set prefix with guaranteed legal eligibility: ambiguous promos
 * are emitted for manual review and never silently admitted to the repair manifest.
 * Node 20+; no third-party npm packages.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const arg=(key,def)=>process.argv.find(x=>x.startsWith(`--${key}=`))?.slice(key.length+3)??def;
const output=resolve(process.cwd(),arg('out',join(root,'reports/goat-release')));
const catalogPath=resolve(process.cwd(),arg('catalog',join(root,'public/catalog.json')));
const apiInput=arg('api-file',null);
const dryRun=process.argv.includes('--dry-run');
const nameKey=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const escape=s=>'"'+String(s??'').replaceAll('"','""')+'"';
const core=new Set('LOB SDK SDY MRD MRL SRL PSV SDJ SDP LON LOD PGD MFC DCR SYE SKE IOC AST SOD DB1 RDS FET DR1 TLM SD1 SD2 SD3 SD4 DB2'.split(' '));
const promo=new Set('BPT CMC CT1 DBT DDS DMG DL1 DL2 DL3 DL4 DL5 DL6 DL7 DL8 DOD DOR EDS EP1 FMR JMP MC1 MOV MP1 PCJ PCK PCY ROD SDD SP1 TFK TP1 TP2 TP3 TP4 TP5 TP6 TSC WC4 WC5'.split(' '));
// The families above come from https://www.goatformat.com/cardpool.html.
// EP1, JMP and SP1 contain historical release timing ambiguities: review individually.
// All promotions require human provenance review because prefix alone does not prove
// the exact printing was in North American circulation by Aug 17, 2005.
const NEVER=new Set(['Exarion Universe']);
function prefix(code){return String(code||'').split('-')[0].toUpperCase().trim();}
function category(c){
 const sets=Array.isArray(c.card_sets)?c.card_sets:[];
 const matches=sets.map(s=>({prefix:prefix(s.set_code),setCode:s.set_code,setName:s.set_name}));
 const coreProof=matches.filter(s=>core.has(s.prefix));
 const promoProof=matches.filter(s=>promo.has(s.prefix));
 if(NEVER.has(c.name))return {status:'excluded',reason:'Explicitly excluded in common GOAT ruleset',proof:[]};
 if(coreProof.length)return {status:'core-candidate',reason:'Printing appears in a GOAT-era core/starter/reprint family; verify exact release and card identity',proof:coreProof};
 if(promoProof.length)return {status:'promo-review',reason:'Promotion: requires release-date and region confirmation',proof:promoProof};
 return {status:'not-evidenced',reason:'No allowed historical printing family found; not proof of ineligibility',proof:[]};
}
async function loadApi(){
 if(apiInput){const obj=JSON.parse(await readFile(resolve(process.cwd(),apiInput),'utf8'));return Array.isArray(obj)?obj:obj.data;}
 const url='https://db.ygoprodeck.com/api/v7/cardinfo.php';
 const res=await fetch(url,{headers:{'User-Agent':'DuelTheory-GOAT-HistoricalAudit/1.0'}});
 if(!res.ok)throw Error(`Yu-Gi-Oh card API HTTP ${res.status}`);
 const json=await res.json();return json.data;
}
async function main(){
 const local=JSON.parse(await readFile(catalogPath,'utf8'));
 if(!Array.isArray(local))throw Error('Catalog must be an array');
 const all=await loadApi();if(!Array.isArray(all)||all.length<1000)throw Error('Unusable full API card list');
 const present=new Set(local.map(x=>Number(x.id)));
 const byName=new Set(local.map(x=>nameKey(x.name)));
 const classified=all.filter(x=>x&&x.id&&x.name).map(card=>({id:card.id,name:card.name,...category(card)}));
 const supported=classified.filter(x=>x.status==='core-candidate'||x.status==='promo-review');
 const eligible=supported.filter(x=>x.status==='core-candidate');
 const reviews=supported.filter(x=>x.status==='promo-review');
 const missing=eligible.filter(x=>!present.has(Number(x.id))&&!byName.has(nameKey(x.name)));
 const missingPromo=reviews.filter(x=>!present.has(Number(x.id))&&!byName.has(nameKey(x.name)));
 const existingUnexplained=local.filter(x=>!supported.some(c=>Number(c.id)===Number(x.id)));
 const report={generatedAt:new Date().toISOString(),source:'YGOPRODeck cardinfo API; historical family list from GoatFormat.com',method:'CANDIDATE reconciliation only; core prefix does not prove date or legal status; promos always need review',catalogCount:local.length,apiCards:all.length,coreCandidates:eligible.length,promoCandidates:reviews.length,missingCoreCandidates:missing.length,missingPromoCandidates:missingPromo.length,existingOutsideMatchedFamilies:existingUnexplained.length,countIsNotFinal:true};
 if(!dryRun){
  await mkdir(output,{recursive:true});
  await writeFile(join(output,'release-audit.json'),JSON.stringify(report,null,2)+'\n');
  await writeFile(join(output,'core-missing-candidates.csv'),'name\n'+missing.map(x=>escape(x.name)).join('\n')+'\n');
  await writeFile(join(output,'promos-NEED-REVIEW.csv'),'name,id,printing,reason\n'+missingPromo.map(x=>[escape(x.name),x.id,escape(x.proof.map(p=>p.setCode).join('; ')),escape(x.reason)].join(',')).join('\n')+'\n');
  await writeFile(join(output,'existing-unexplained.csv'),'name,id\n'+existingUnexplained.map(x=>escape(x.name)+','+x.id).join('\n')+'\n');
  await writeFile(join(output,'candidate-manifest.json'),JSON.stringify({schemaVersion:1,coreCandidates:missing,promoReview:missingPromo},null,2)+'\n');
 }
 console.log(JSON.stringify(report,null,2));
 console.log(dryRun?'Dry run; no files written.':`Reports saved to ${output}`);
 console.log('Review missing candidates before syncing. Run sync-goat-missing.mjs --manifest=reports/goat-release/core-missing-candidates.csv --dry-run to preview.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
