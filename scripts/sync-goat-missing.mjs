/**
 * Add cards from a reviewed GOAT gap list without redownloading existing cards.
 * Usage: npm run sync:goat:missing
 * Optional: --dry-run, --repair-images (also fill missing artwork for existing catalog entries)
 *          --manifest=path/to/names.csv
 * This is a targeted repair, NOT a verified complete GOAT format manifest.
 */
import {readFile,writeFile,copyFile,mkdir,rename,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const root=join(repo,'public');
const catalogPath=join(root,'catalog.json');
const imagesPath=join(root,'cards');
const fullPath=join(imagesPath,'full');
const manifestArg=process.argv.find(x=>x.startsWith('--manifest='));
const manifestPath=manifestArg?resolve(process.cwd(),manifestArg.slice('--manifest='.length)):join(repo,'data/goat-missing-manifest.csv');
const dryRun=process.argv.includes('--dry-run');
const repairImages=process.argv.includes('--repair-images');
const onlyMetadata=process.argv.includes('--no-images');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const normalizedName=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'');
const errMsg=e=>e instanceof Error?e.message:String(e);

async function fetchRetry(url){
 for(let attempt=0;attempt<3;attempt++){
  try{
   const res=await fetch(url,{headers:{'User-Agent':'DuelTheoryLocalGOATRepair/1.0'}});
   if(!res.ok)throw new Error(`HTTP ${res.status}`);
   return res;
  }catch(err){
   if(attempt===2)throw new Error(`${url}: ${errMsg(err)}`);
   await pause((attempt+1)*800);
  }
 }
 throw new Error('Retries exhausted');
}

async function downloadImage(url,destination){
 if(!url||existsSync(destination))return false;
 const response=await fetchRetry(url);
 const mime=(response.headers.get('content-type')||'').toLowerCase();
 if(mime&&!mime.startsWith('image/'))throw new Error(`Unexpected image content-type: ${mime}`);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(bytes.length<100||bytes.length>12_000_000)throw new Error(`Unexpected image size (${bytes.length})`);
 const temporary=`${destination}.download-${process.pid}`;
 try{
  // 'wx' and rename ensure we don't truncate any preexisting image.
  await writeFile(temporary,bytes,{flag:'wx'});
  if(existsSync(destination))return false;
  await rename(temporary,destination);
  return true;
 }finally{await rm(temporary,{force:true}).catch(()=>{});}
}

function cardRecord(api){
 return {
  id:api.id,name:api.name,type:api.type,desc:api.desc,race:api.race,
  ...(api.attribute!=null?{attribute:api.attribute}:{}),
  ...(api.level!=null?{level:api.level}:{}),
  ...(api.atk!=null?{atk:api.atk}:{}),
  ...(api.def!=null?{def:api.def}:{}),
  card_sets:api.card_sets||[]
 };
}

async function main(){
 if(!existsSync(catalogPath))throw new Error('Missing public/catalog.json. Run this from your DuelTheory project.');
 const current=JSON.parse(await readFile(catalogPath,'utf8'));
 if(!Array.isArray(current))throw new Error('public/catalog.json must be an array; file was not modified.');
 const raw=await readFile(manifestPath,'utf8');
 const names=[...new Set(raw.split(/\r?\n/).slice(1).map(line=>{const first=line.trim().match(/^\"((?:\"\"|[^\"])*)\"/)?.[1];return (first?first.replaceAll('\"\"','\"'):line.split(',')[0])?.trim();}).filter(Boolean))];
 if(!names.length)throw new Error('Manifest is empty.');
 const byId=new Set(current.map(c=>c.id));
 const byName=new Set(current.map(c=>normalizedName(c.name)));
 const target=names.filter(name=>!byName.has(normalizedName(name)));
 console.log(`Existing catalog: ${current.length} cards. Manifest: ${names.length}. Missing by name: ${target.length}.`);
 if(dryRun){for(const name of target)console.log(`WOULD ADD: ${name}`);console.log('Dry run: nothing downloaded or modified.');return;}
 await mkdir(imagesPath,{recursive:true});
 await mkdir(fullPath,{recursive:true});
 const added=[];
 const missing=[];
 const addedMeta=new Map();
 for(const name of target){
  try{
   const endpoint=`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(name)}`;
   const json=await (await fetchRetry(endpoint)).json();
   const candidates=Array.isArray(json.data)?json.data:[];
   const api=candidates.find(c=>normalizedName(c.name)===normalizedName(name));
   if(!api){missing.push({name,reason:'API did not return an exact name match'});continue;}
   if(byId.has(api.id)){console.log(`SKIP ${name}: ID already exists (${api.id})`);continue;}
   if(!Number.isSafeInteger(api.id)||!api.name||!api.type||!api.desc){missing.push({name,reason:'Invalid API record'});continue;}
   const card=cardRecord(api);
   const art=api.card_images?.[0]||{};
   byId.add(card.id);byName.add(normalizedName(card.name));
   added.push(card);addedMeta.set(card.id,art);
   console.log(`ADD: ${card.name} [${card.id}]`);
  }catch(e){missing.push({name,reason:errMsg(e)});console.warn(`FAILED metadata: ${name} (${errMsg(e)})`);}
  await pause(180);
 }
 // Fetch only cards added by this invocation. --repair-images opts into missing existing images.
 const listedCurrent=current.filter(c=>names.some(name=>normalizedName(name)===normalizedName(c.name)));
 const imageTargets=repairImages?[...current,...added]:[...listedCurrent,...added];
 let smallCount=0,largeCount=0;
 const imageFailures=[];
 for(const card of imageTargets){
  const art=addedMeta.get(card.id);
  // Existing catalog cards generally store paths but not provider artwork URLs.
  // A targeted per-card lookup is made ONLY when --repair-images is explicitly provided.
  let imgs=art;
  const thumbFile=join(imagesPath,`${card.id}.jpg`);
  const fullFile=join(fullPath,`${card.id}.jpg`);
  const needSmall=!existsSync(thumbFile);
  const needFull=!existsSync(fullFile);
  if(onlyMetadata||(!needSmall&&!needFull))continue;
  if(!imgs){
   try{
    const response=await (await fetchRetry(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${card.id}`)).json();
    imgs=response.data?.[0]?.card_images?.[0];
   }catch(e){imageFailures.push({name:card.name,reason:errMsg(e)});continue;}
  }
  try{if(needSmall&&imgs?.image_url_small){if(await downloadImage(imgs.image_url_small,thumbFile))smallCount++;}}catch(e){imageFailures.push({name:card.name,size:'small',reason:errMsg(e)});}
  try{if(needFull&&imgs?.image_url){if(await downloadImage(imgs.image_url,fullFile))largeCount++;}}catch(e){imageFailures.push({name:card.name,size:'full',reason:errMsg(e)});}
  await pause(180);
 }
 // Retain all existing records unchanged, except filling image paths when expressly asked to repair.
 const updated=[...current,...added.map(card=>({
  ...card,
  ...(existsSync(join(imagesPath,`${card.id}.jpg`))?{image:`/cards/${card.id}.jpg`}:{}),
  ...(existsSync(join(fullPath,`${card.id}.jpg`))?{fullImage:`/cards/full/${card.id}.jpg`}:{})
 }))];
 for(const card of updated){
  if(!repairImages&&!names.some(name=>normalizedName(name)===normalizedName(card.name)))continue;
  if(existsSync(join(imagesPath,`${card.id}.jpg`))&&!card.image)card.image=`/cards/${card.id}.jpg`;
  if(existsSync(join(fullPath,`${card.id}.jpg`))&&!card.fullImage)card.fullImage=`/cards/full/${card.id}.jpg`;
 }
 if(added.length||JSON.stringify(updated)!==JSON.stringify(current)){
  const backup=join(root,'catalog.pre-goat-repair.json');
  if(!existsSync(backup))await copyFile(catalogPath,backup);
  const tmp=`${catalogPath}.tmp-${process.pid}`;
  try{await writeFile(tmp,JSON.stringify(updated));await rename(tmp,catalogPath);}finally{await rm(tmp,{force:true}).catch(()=>{});}
 }
 const report={runAt:new Date().toISOString(),existing:current.length,manifest:names.length,added:added.map(c=>({id:c.id,name:c.name})),alreadyPresent:names.length-target.length,newThumbnails:smallCount,newFullImages:largeCount,unresolved:missing,imageFailures,scope:'Targeted manifest only; NOT a complete GOAT historical pool verification.'};
 await writeFile(join(repo,'goat-missing-repair-report.json'),JSON.stringify(report,null,2));
 console.log(`Done: added ${added.length} cards; downloaded ${smallCount} thumbnails and ${largeCount} full images. Unresolved names: ${missing.length}; image errors: ${imageFailures.length}.`);
 console.log('Report: goat-missing-repair-report.json');
 if(missing.length||imageFailures.length)process.exitCode=1;
}
main().catch(e=>{console.error(`Repair failed: ${errMsg(e)}`);process.exitCode=1;});
