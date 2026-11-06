// Design analysis only. No runtime catalog, effect pack or saved deck is written.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const out=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(out,'../../..');
const read=name=>readFileSync(path.join(root,name),'utf8');
const catalog=JSON.parse(read('src/ashenCatalog.json'));
const print=JSON.parse(read('src/ashenPrintData.json'));
const cards=new Map(catalog.cards.map(card=>[card.id,card]));
const id=(faction,slug)=>`ashen-${faction.toLowerCase()}-${slug}`;
const proposal={
  Noble:{
    additions:{'shieldbearer-noble':2,'spearman-of-the-crown':1,'court-scribe':2,'junior-tactician':1,'crown-archer':1,'watchtower-scout':1,'griffin-knight-of-ashenfield':1},
    cuts:['royal-guard','court-strategist','high-strategist','seraphine-royal-advisor','rune-of-the-crown','crown-of-dominion','mandate-of-dominion','order-s-end','the-king-s-will'],
    costOverrides:{'watchtower-scout':{untuned:1,oath:2}},
    keywordAdditions:{'shieldbearer-noble':['Standfast'],'banner-guard':['Standfast'],'crown-archer':['Standfast']},
    effectProposals:{'rune-of-clarity':'Keep one copy. Test activation as Exhaust and pay 1 Oath: Refine 2. Keep its printed draw-damage trigger for this first test.'},
  },
  Brute:{
    additions:{'frenzied-grunt':1,'bloodfang-raider':1,'bloodpit-initiate':1,'raging-mauler':1,'warhowl-instigator':1,'rubble-flinger':1,'fury-font':2},
    cuts:['warchanter-savage','stonehide-juggernaut','korgath-s-call','warband-of-bloodfire','ragekindle','flesh-slinger-s-chant','flamebelcher-rig','drum-of-the-pit'],
    costOverrides:{'bloodpit-initiate':{untuned:1,fury:1},'warhowl-instigator':{untuned:1,fury:2}},
    keywordAdditions:{},
    effectProposals:{
      'blood-cauldron':'Add a second activated option: Exhaust: Create one 1A/1D Frenzied Brute token. Both options exhaust this Relic; they cannot both be used without readying it. Token has no inherent Charge.',
      'fury-offering':'Replace effect for this test: Create two 1A/1D Frenzied Brute tokens. If you control no Units as this resolves, create three instead. Tokens have no inherent Charge. Preserve the original sacrifice/damage/draw design in the reserve snapshot.',
    },
  },
};
function snapshot(cardId){
  const card=cards.get(cardId);
  if(!card||!print[cardId])throw Error(`Missing card/printed cost: ${cardId}`);
  return {card:structuredClone(card),printed:structuredClone(print[cardId])};
}
function candidate(faction){
  const config=proposal[faction];
  const entries=catalog.decks[faction].entries.map(e=>({...e}));
  for(const slug of config.cuts){const row=entries.find(e=>e.cardId===id(faction,slug));if(!row||row.count!==1)throw Error(`Unexpected cut ${slug}`);row.count=0;}
  for(const [slug,delta] of Object.entries(config.additions)){const row=entries.find(e=>e.cardId===id(faction,slug));if(!row)throw Error(`Missing addition ${slug}`);row.count+=delta;}
  const final=entries.filter(e=>e.count>0);
  if(final.reduce((sum,e)=>sum+e.count,0)!==60)throw Error(`Not a 60-card deck: ${faction}`);
  return final;
}
function curve(entries,faction,changed=false){
  const histogram=Object.fromEntries([1,2,3,4,5,6].map(n=>[n,0]));
  const unitCurve={...histogram};
  const types={};let essence=0,nonFonts=0,fonts=0;
  for(const {cardId,count} of entries){
    const card=cards.get(cardId);if(!card||!print[cardId])throw Error(`Unknown cost ${cardId}`);
    types[card.type]=(types[card.type]||0)+count;
    if(card.type==='Ley Font'){fonts+=count;continue;}
    const cost=(changed&&proposal[faction].costOverrides[cardId.replace(`ashen-${faction.toLowerCase()}-`,'')])||print[cardId].resourceCost;
    const total=Object.values(cost).reduce((a,b)=>a+b,0);
    if(!total)throw Error(`Missing non-Font cost: ${cardId}`);
    histogram[total]=(histogram[total]||0)+count;
    if(card.type==='Unit')unitCurve[total]=(unitCurve[total]||0)+count;
    essence+=total*count;nonFonts+=count;
  }
  return {total:fonts+nonFonts,fonts,nonFonts,printedEssence:essence,meanPrintedCost:essence/nonFonts,histogram,unitCurve,types};
}
function choose(n,k){if(k<0||k>n)return 0;k=Math.min(k,n-k);let result=1;for(let i=1;i<=k;i++)result=result*(n-k+i)/i;return result;}
function atLeast(fonts,seen,required){let p=0;for(let k=required;k<=Math.min(fonts,seen);k++)p+=choose(fonts,k)*choose(60-fonts,seen-k)/choose(60,seen);return p;}
const profiles=Object.fromEntries(Object.keys(proposal).map(faction=>{
  const config=proposal[faction],entries=candidate(faction);
  return [faction,{status:'draft-for-creator-review-not-active',stationId:catalog.decks[faction].stationId,entries,costOverrides:Object.fromEntries(Object.entries(config.costOverrides).map(([slug,cost])=>[id(faction,slug),cost])),keywordAdditions:Object.fromEntries(Object.entries(config.keywordAdditions).map(([slug,keywords])=>[id(faction,slug),keywords])),effectProposals:Object.fromEntries(Object.entries(config.effectProposals).map(([slug,text])=>[id(faction,slug),text])),current:curve(catalog.decks[faction].entries,faction),candidate:curve(entries,faction,true)}];
}));
// Explicitly retain the named mechanic representatives requested by the creator.
for(const [faction,slugs] of Object.entries({Noble:['royal-crusher','ballista-crew','royal-longbowman','griffin-lancer','crown-s-cavalier'],Brute:['ironhide-catapult','siegebreaker-ram','bonecrusher-catapult','rubble-flinger','bonespike-hurler','crude-spearthrower','ashen-warhawk','skyclaw-raider','howling-skyterror','ashclaw-skyreaver']})){
  for(const slug of slugs)if(!profiles[faction].entries.some(e=>e.cardId===id(faction,slug)))throw Error(`Required mechanic lost: ${slug}`);
}
const baseline={commit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),files:Object.fromEntries(['src/ashenCatalog.json','src/ashenPrintData.json','src/games/ashen/duel.ts','src/games/ashen/adapter.ts','src/games/ashen/bruteEffects.ts','src/games/ashen/nobleEffects.ts'].map(file=>[file,createHash('sha256').update(read(file)).digest('hex')]))};
const reserve={status:'proposed-reserve-not-approved-or-removed-from-live',date:'2026-11-06',baseline,cards:Object.entries(proposal).flatMap(([faction,config])=>config.cuts.map(slug=>({faction,reason:'Proposed starter cut; retain for a future booster review, not a declaration that the card is balanced.',...snapshot(id(faction,slug))}))),replacedDesigns:[{reason:'Original Fury Offering if its proposed recovery replacement is accepted. Keep separate version/identity history before changing rules.',...snapshot(id('Brute','fury-offering'))}]};
const fontDraws=[18,20,22].map(fonts=>({fonts,openingZeroFonts:1-atLeast(fonts,6,1),openingAtLeastTwo:atLeast(fonts,6,2),threeByOwnTurnThree:atLeast(fonts,8,3),fourByOwnTurnFour:atLeast(fonts,9,4)}));
const write=(name,data)=>writeFileSync(path.join(out,name),JSON.stringify(data,null,2)+'\n');
write('candidate-decks.json',{date:'2026-11-06',baseline,profiles,fontDraws});write('booster-reserve.json',reserve);
const pct=p=>(p*100).toFixed(1)+'%';
const mean=value=>(Math.round(value*100)/100).toFixed(2);
const costText=cost=>Object.entries(cost).map(([key,n])=>`${n} ${key==='untuned'?'generic':key}`).join(' + ');
let md='# Verified curve tables and draft deck lists\n\nGenerated from the live source data. These are design candidates, not active decks. Stations are separate from the 60 cards. Generic costs may use any Essence. Means exclude Fonts. Command, ramp, triggered draws and discounts are not subtracted from printed costs.\n\n| Printed Essence | Brute now | Brute candidate | Noble now | Noble candidate |\n|---|---:|---:|---:|---:|\n';
for(let n=1;n<=6;n++)md+=`| ${n} | ${profiles.Brute.current.histogram[n]} | ${profiles.Brute.candidate.histogram[n]} | ${profiles.Noble.current.histogram[n]} | ${profiles.Noble.candidate.histogram[n]} |\n`;
md+=`| Fonts | 18 | 20 | 22 | 22 |\n| Non-Font mean | ${mean(profiles.Brute.current.meanPrintedCost)} | ${mean(profiles.Brute.candidate.meanPrintedCost)} | ${mean(profiles.Noble.current.meanPrintedCost)} | ${mean(profiles.Noble.candidate.meanPrintedCost)} |\n\n## Natural Font access\n\nExact hypergeometric draws, first player, six opening cards, first draw skipped. No mulligan, card draw/filtering, ramp or spent-Font adjustment. This measures Fonts drawn, not a guarantee of usable colored Essence or a playable hand.\n\n| Fonts | Zero in opening six | At least two in opening six | At least three by own turn 3 (8 seen) | At least four by own turn 4 (9 seen) |\n|---|---:|---:|---:|---:|\n`;
for(const row of fontDraws)md+=`| ${row.fonts} | ${pct(row.openingZeroFonts)} | ${pct(row.openingAtLeastTwo)} | ${pct(row.threeByOwnTurnThree)} | ${pct(row.fourByOwnTurnFour)} |\n`;
for(const [faction,profile] of Object.entries(profiles)){
 md+=`\n## ${faction}: draft 60-card test list\n\n${Object.entries(profile.candidate.types).map(([type,count])=>`${count} ${type}${count===1?'':'s'}`).join(' · ')}\n\n| Card | Copies | Printed cost in candidate |\n|---|---:|---|\n`;
 for(const e of profile.entries){const card=cards.get(e.cardId),cost=profile.costOverrides[e.cardId]||print[e.cardId].resourceCost;md+=`| ${card.name} | ${e.count} | ${card.type==='Ley Font'?'Font':costText(cost)} |\n`;}
}
writeFileSync(path.join(out,'curves-and-lists.md'),md);
console.log(JSON.stringify({baseline:baseline.commit,profiles:Object.fromEntries(Object.entries(profiles).map(([f,p])=>[f,{current:p.current,candidate:p.candidate}])),fontDraws,reservedCards:reserve.cards.length},null,2));
