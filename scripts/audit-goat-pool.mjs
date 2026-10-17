/** Offline GOAT named-pool reconciliation.
 * Supply an exported/authorized name list from a reliable format reference.
 * No third-party website scraping, no card or image downloads from this script.
 * node scripts/audit-goat-pool.mjs --reference=data/goat-reference.txt
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,extname,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const option=(name,def)=>process.argv.find(v=>v.startsWith(`--${name}=`))?.slice(name.length+3)??def;
const catalog=resolve(process.cwd(),option('catalog',join(root,'public/catalog.json')));
const reference=option('reference',null);
const out=resolve(process.cwd(),option('out',join(root,'reports/goat-pool')));
const expected=Number(option('expected','1699'));
const normalize=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/&amp;/g,'and').replace(/\bthe\b/g,'the').replace(/[^a-z0-9]/g,'');
const alias=new Map([
 ['bskulldragon','blackskulldragon'],
 ['alpha themagnetwarrior','alphathemagnetwarrior'],
 ['beta themagnetwarrior','betathemagnetwarrior'],
 ['gamma themagnetwarrior','gammathemagnetwarrior'],
 ['hyozanryu','hyozanryu'],
]);
const key=s=>alias.get(normalize(s))??normalize(s);
function readTextList(text){
 let lines=text.replace(/\r/g,'').split('\n').map(s=>s.trim());
 const start=lines.findIndex(s=>/the following cards are legal in this format/i.test(s));
 if(start>=0)lines=lines.slice(start+1);
 const stop=lines.findIndex(s=>/^\s*(?:#\s*)?(?:Erratas|Card Pool & Banlist|Footer|Copyright)\b/i.test(s));
 if(stop>=0)lines=lines.slice(0,stop);
 return lines.map(s=>s.replace(/\s+\((?:FORBIDDEN|LIMIT\s*[12])\)\s*$/i,'').trim()).filter(s=>s&&!/^(?:#.*|Cards \(\d.*|The following.*|Search.*|Filter.*|Rules.*|Show more.*)$/i.test(s));
}
function csvRows(input){let rows=[],row=[],cell='',inQ=false;for(let i=0;i<input.length;i++){let c=input[i];if(c==='"'){if(inQ&&input[i+1]==='"'){cell+='"';i++;}else inQ=!inQ;}else if(c===','&&!inQ){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!inQ){if(c==='\r'&&input[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';}else cell+=c;}if(cell||row.length){row.push(cell);rows.push(row);}return rows;}
function namesFromReference(text,path){
 if(['.json'].includes(extname(path).toLowerCase())){
  const parsed=JSON.parse(text);const arr=Array.isArray(parsed)?parsed:(parsed.cards??parsed.data??[]);return arr.map(o=>typeof o==='string'?o:(o.name??o.card_name??o['Card Name'])).filter(Boolean);
 }
 if(['.csv'].includes(extname(path).toLowerCase())){
  const rows=csvRows(text);const head=rows[0].map(x=>x.trim().toLowerCase());let index=head.findIndex(x=>['name','card','card name','card_name','cardname'].includes(x));if(index<0)index=0;
  return rows.slice(1).map(r=>r[index]?.trim()).filter(Boolean);
 }
 return readTextList(text);
}
const escape=s=>'"'+String(s??'').replaceAll('"','""')+'"';
async function main(){
 if(!reference)throw Error('Pass --reference=path to a downloaded full card-name list (.txt, .csv or .json).');
 const path=resolve(process.cwd(),reference);
 const original=JSON.parse(await readFile(catalog,'utf8'));
 if(!Array.isArray(original))throw Error('Catalog must be a JSON array.');
 const referenceNames=namesFromReference(await readFile(path,'utf8'),path);
 const names=new Map(),duplicates=[];
 for(const name of referenceNames){const k=key(name);if(!k)continue;if(names.has(k))duplicates.push([names.get(k),name]);else names.set(k,name);}
 const ours=new Map(),ourDuplicates=[];
 for(const card of original){let k=key(card.name);if(ours.has(k))ourDuplicates.push(card.name);else ours.set(k,card);}
 const missing=[...names].filter(([k])=>!ours.has(k)).map(([,n])=>n).sort();
 const extra=[...ours].filter(([k])=>!names.has(k)).map(([,c])=>({name:c.name,id:c.id})).sort((a,b)=>a.name.localeCompare(b.name));
 const matched=names.size-missing.length;
 const report={timestamp:new Date().toISOString(),referencePath:path,referenceEntries:referenceNames.length,referenceUnique:names.size,expectedReferenceCount:expected,referenceCountMatchesExpected:names.size===expected,duplicatesInReference:duplicates,catalogCount:original.length,catalogUniqueNames:ours.size,catalogDuplicateNames:ourDuplicates,matched,missingCount:missing.length,extraCount:extra.length,missing,extra,notes:['DO NOT treat (referenceCount - catalogCount) as the missing count; use missingCount and extraCount.','GOAT pool availability and Forbidden/Limited deck counts are separate.','Historical errata/effect logic must be validated separately from modern API text.']};
 await mkdir(out,{recursive:true});
 await writeFile(join(out,'audit.json'),JSON.stringify(report,null,2));
 await writeFile(join(out,'missing.csv'),'name\n'+missing.map(escape).join('\n')+'\n');
 await writeFile(join(out,'extra.csv'),'name,id\n'+extra.map(c=>`${escape(c.name)},${c.id}`).join('\n')+'\n');
 await writeFile(join(out,'goat-full-manifest.csv'),'name\n'+[...names.values()].map(escape).join('\n')+'\n');
 console.log(`Reference ${names.size} unique (${referenceNames.length} rows; expected ${expected}); catalog ${original.length}; matching ${matched}; missing ${missing.length}; extra ${extra.length}.`);
 console.log('Files in '+out);
 if(names.size!==expected){console.warn('REFERENCE COUNT NOT VERIFIED. Check the source export and duplicates before using it as a locked manifest.');process.exitCode=2;}
 if(duplicates.length)console.warn(`Reference has ${duplicates.length} duplicate normalized names; review audit.json.`);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
