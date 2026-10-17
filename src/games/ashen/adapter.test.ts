import {describe,it,expect} from 'vitest';
import {newBattlefield,battlefieldDispatch,type Battlefield} from '../../ashenBattlefieldState';
import {playProgram,resolveAshenEffect,ashenStats,resolveBurnEffect,availableAshenAbilities,resumeAshenEffect,pendingAshenChoices} from './adapter';
import {validateEffectProgram} from '../../framework';
import {bruteEffects} from './bruteEffects';
const idOf=(s:Battlefield,slug:string)=>Object.values(s.table.cards).find(c=>c.cardId===`ashen-brute-${slug}`)!.instanceId;
function hand(s:Battlefield,slug:string){const id=idOf(s,slug);if(s.table.cards[id].zone!=='hand')s=battlefieldDispatch(s,{type:'MOVE',instanceId:id,seat:0,zone:'hand'});s.basins[0].fury=50;s.basins[0].untuned=50;return {s,id};}
const deploy=(s:Battlefield,id:string,targets:string[]=[],costCards:string[]=[])=>resolveAshenEffect(s,playProgram(s,id),{player:'0',source:id,targets,costCards},true);
describe('first Brute effects through the shared framework',()=>{
 it('deploys Initiate with printed costs, Charge and a separate token',()=>{
  const {s,id}=hand(newBattlefield(false,()=>.4),'bloodpit-initiate');const next=deploy(s,id);
  expect(next.table.cards[id].zone).toBe('unit');expect(next.table.cards[id].rotated).toBe(false);
  expect(Object.values(next.table.cards).filter(c=>c.presentation?.name==='Frenzied Brute')).toHaveLength(1);
  expect(next.basins[0].fury).toBeLessThan(s.basins[0].fury);expect(s.table.cards[id].zone).toBe('hand');
 });
 it('does not move or pay when a targeted entry effect has an illegal target',()=>{
  const {s,id}=hand(newBattlefield(false,()=>.4),'ashfang-ravine');const before=JSON.stringify(s);
  expect(()=>deploy(s,id,['missing'])).toThrow();expect(JSON.stringify(s)).toBe(before);
 });
 it('enforces one font and handles Fury Pit spent entry and burn bonuses',()=>{
  let {s,id}=hand(newBattlefield(false,()=>.4),'fury-pit');s=deploy(s,id);expect(s.table.cards[id].faceDown).toBe(true);
  const other=hand(s,'fury-font');expect(()=>playProgram(other.s,other.id)).toThrow('already played');
  const unit=idOf(s,'frenzied-grunt');s=battlefieldDispatch(s,{type:'MOVE',instanceId:unit,seat:0,zone:'unit'});
  s=battlefieldDispatch(s,{type:'FLIP',instanceId:id});const attack=ashenStats(s,unit).attack;
  s=resolveBurnEffect(battlefieldDispatch(s,{type:'BURN',instanceId:id}),id);expect(ashenStats(s,unit).attack).toBe(attack+1);
  s=battlefieldDispatch(s,{type:'END_TURN'});expect(ashenStats(s,unit).attack).toBe(attack);
 });
 it('pays exhaust/resource activation once and rejects repeat activation',()=>{
  const start=hand(newBattlefield(false,()=>.4),'feral-axebreaker');let s=deploy(start.s,start.id);s=battlefieldDispatch(s,{type:'ROTATE',instanceId:start.id});
  const p=bruteEffects[s.table.cards[start.id].cardId].activated![0];s=resolveAshenEffect(s,p,{player:'0',source:start.id});expect(s.table.cards[start.id].rotated).toBe(true);
  expect(()=>resolveAshenEffect(s,p,{player:'0',source:start.id})).toThrow('exhausted');
 });
 it('destroys Units and uses typed death triggers with the Keep’s turn limit',()=>{
  let s=newBattlefield(true,()=>.4);const extra=Object.values(s.table.cards).filter(c=>c.controller===0&&c.type==='Unit'&&c.zone==='deck').slice(0,3);
  for(const c of extra)s=battlefieldDispatch(s,{type:'MOVE',instanceId:c.instanceId,seat:0,zone:'unit'});
  const start=hand(s,'bloodfire-collapse');const before=start.s.table.piles['0:unit'].length+start.s.table.piles['1:unit'].length;
  s=deploy(start.s,start.id);
  expect(s.table.health).toEqual([20-before,20-before]);
  expect(s.table.piles['0:unit']).toHaveLength(3);expect(s.table.piles['1:unit']).toHaveLength(0);
 });
 it('resolves a sacrifice cost and draw as one undoable transaction',()=>{
  const {s,id}=hand(newBattlefield(true,()=>.4),'pit-digger-s-howl');const sacrifice=s.table.piles['0:unit'][0],deck=s.table.piles['0:deck'].length;
  const result=deploy(s,id,[],[sacrifice]);expect(result.table.cards[sacrifice].zone).toBe('graveyard');expect(result.table.piles['0:deck'].length).toBe(deck-2);expect(s.table.cards[sacrifice].zone).toBe('unit');
 });
});


describe('Brute sacrifice abilities and continuous bonuses',()=>{
 const field=(s:Battlefield,slug:string)=>{const id=idOf(s,slug);return {s:battlefieldDispatch(s,{type:'MOVE',instanceId:id,seat:0,zone:'unit'}),id};};
 it('validates every registered portable effect program',()=>{
  for(const rule of Object.values(bruteEffects))for(const p of [rule.onPlay,rule.onBurn,...(rule.activated||[]),...(rule.triggers||[]).map(t=>t.program)])if(p)expect(validateEffectProgram(p),p.id).toEqual([]);
 });
 it('applies Overseer to other Brutes only and removes its aura immediately on leaving play',()=>{
  let s=newBattlefield(false,()=>.4);const grunt=field(s,'frenzied-grunt');s=grunt.s;const base=ashenStats(s,grunt.id);
  const overseer=field(s,'warband-overseer');s=overseer.s;
  expect(ashenStats(s,grunt.id).attack).toBe(base.attack+1);expect(ashenStats(s,grunt.id).defense).toBe(base.defense+1);
  const own=ashenStats(s,overseer.id);expect(own.attack).toBe(2);
  s=battlefieldDispatch(s,{type:'MOVE',instanceId:overseer.id,seat:0,zone:'graveyard'});
  expect(ashenStats(s,grunt.id).attack).toBe(base.attack);
 });
 it('uses Banner Charge for deployment and preserves token Charge',()=>{
  let s=newBattlefield(false,()=>.4);const banner=idOf(s,'banner-of-the-broken-fist');s=battlefieldDispatch(s,{type:'MOVE',instanceId:banner,seat:0,zone:'support'});
  const raider=hand(s,'bloodfang-raider');s=deploy(raider.s,raider.id);
  expect(s.table.cards[raider.id].rotated).toBe(false);
  const token=Object.values(s.table.cards).find(c=>c.presentation)!;
  expect(ashenStats(s,token.instanceId).keywords).toContain('Charge');expect(token.rotated).toBe(false);
 });
 it('requires two distinct sacrifices for Cauldron and creates a ready 4/4 Charge Berserker',()=>{
  let s=newBattlefield(false,()=>.4);const cauldron=idOf(s,'blood-cauldron');s=battlefieldDispatch(s,{type:'MOVE',instanceId:cauldron,seat:0,zone:'support'});
  const a=field(s,'frenzied-grunt');s=a.s;const b=field(s,'bloodpit-initiate');s=b.s;
  const program=bruteEffects[s.table.cards[cauldron].cardId].activated![0],before=JSON.stringify(s);
  expect(()=>resolveAshenEffect(s,program,{player:'0',source:cauldron,costCards:[a.id,a.id]})).toThrow();expect(JSON.stringify(s)).toBe(before);
  s=resolveAshenEffect(s,program,{player:'0',source:cauldron,costCards:[a.id,b.id]});
  const token=Object.values(s.table.cards).find(c=>c.name==='Brute Berserker')!;
  expect(ashenStats(s,token.instanceId)).toMatchObject({attack:4,defense:4,keywords:['Charge']});expect(token.rotated).toBe(false);
  expect(s.table.cards[a.id].zone).toBe('graveyard');expect(s.table.cards[cauldron].rotated).toBe(true);
 });
 it('sacrifice abilities trigger surviving death observers',()=>{
  let s=newBattlefield(false,()=>.4);const watcher=field(s,'warchanter-savage');s=watcher.s;const victim=field(s,'frenzied-grunt');s=victim.s;
  const chant=idOf(s,'flesh-slinger-s-chant');s=battlefieldDispatch(s,{type:'MOVE',instanceId:chant,seat:0,zone:'support'});
  const station=s.table.piles['1:command'][0],attack=ashenStats(s,watcher.id).attack;
  s=resolveAshenEffect(s,bruteEffects[s.table.cards[chant].cardId].activated![0],{player:'0',source:chant,costCards:[victim.id],targets:[station]});
  expect(s.table.health[1]).toBe(18);expect(ashenStats(s,watcher.id).attack).toBe(attack+1);
 });
});

it('tracks Warband Fury and atomically spends three counters on its rally',()=>{
 let s=newBattlefield(false,()=>.4);const warband=idOf(s,'warband-of-bloodfire');s=battlefieldDispatch(s,{type:'MOVE',instanceId:warband,seat:0,zone:'support'});
 for(const slug of ['frenzied-grunt','bloodpit-initiate']){const h=hand(s,slug);s=deploy(h.s,h.id);}
 expect(s.rules?.counters?.[warband]?.fury).toBe(3);
 const p=bruteEffects[s.table.cards[warband].cardId].activated![0];s=resolveAshenEffect(s,p,{player:'0',source:warband});
 expect(s.rules?.counters?.[warband]?.fury).toBe(0);
 for(const id of s.table.piles['0:unit'])expect(ashenStats(s,id).keywords).toContain('Pierce');
 s=battlefieldDispatch(s,{type:'ROTATE',instanceId:warband});const before=JSON.stringify(s);
 expect(()=>resolveAshenEffect(s,p,{player:'0',source:warband})).toThrow('counters');expect(JSON.stringify(s)).toBe(before);
});

it('Rites damages only the destroyed Rune controller, and not for a Relic',()=>{
 for(const type of ['Rune','Relic']){
  let s=newBattlefield(false,()=>.4);const target=Object.values(s.table.cards).find(c=>c.controller===1&&c.type===type)!;
  s=battlefieldDispatch(s,{type:'MOVE',instanceId:target.instanceId,seat:1,zone:'support'});
  const start=hand(s,'rites-of-ragefire');s=deploy(start.s,start.id,[target.instanceId]);
  expect(s.table.cards[target.instanceId].zone).toBe('graveyard');expect(s.table.health).toEqual([20,type==='Rune'?18:20]);
 }
});


describe('Brute effect continuations',()=>{
 it('draws before Raider discard, keeps costs paid once, and resumes from a saved state',()=>{
  let start=hand(newBattlefield(false,()=>.4),'bloodfang-raider'),s=deploy(start.s,start.id);
  s=battlefieldDispatch(s,{type:'ROTATE',instanceId:start.id});const deck=s.table.piles['0:deck'].length,drawn=s.table.piles['0:deck'][0];
  const p=bruteEffects[s.table.cards[start.id].cardId].activated![0];s=resolveAshenEffect(s,p,{source:start.id,player:'0'});
  expect(s.table.cards[drawn].zone).toBe('hand');expect(s.table.piles['0:deck']).toHaveLength(deck-1);expect(s.table.cards[start.id].rotated).toBe(true);
  expect(pendingAshenChoices(s)?.entities.some(e=>e.id===drawn)).toBe(true);
  expect(()=>battlefieldDispatch(s,{type:'END_TURN'})).toThrow('pending');
  const before=JSON.stringify(s);expect(()=>resumeAshenEffect(s,[start.id])).toThrow('legal');expect(JSON.stringify(s)).toBe(before);
  s=resumeAshenEffect(JSON.parse(before),[drawn]);expect(s.rules?.pending).toBeUndefined();expect(s.table.cards[drawn].zone).toBe('graveyard');expect(s.table.piles['0:deck']).toHaveLength(deck-1);
 });
 it('Bloodrush discards before drawing and gives Fury only for a Brute Unit',()=>{
  for(const slug of ['frenzied-grunt','fury-font']){
   let start=hand(newBattlefield(false,()=>.4),'bloodrush-gambit'),s=start.s;
   const discard=hand(s,slug);s=discard.s;const deck=s.table.piles['0:deck'].length;
   s=deploy(s,start.id);const fury=s.basins[0].fury;
   expect(s.table.piles['0:deck']).toHaveLength(deck);expect(s.table.cards[start.id].zone).toBe('graveyard');
   s=resumeAshenEffect(s,[discard.id]);expect(s.table.piles['0:deck']).toHaveLength(deck-2);expect(s.basins[0].fury).toBe(fury+(slug==='frenzied-grunt'?1:0));
  }
 });
 it('Drum searches in deck order, rejects wrong card types, reveals and shuffles once',()=>{
  let s=newBattlefield(false,()=>.4);const drum=idOf(s,'drum-of-the-pit');s=battlefieldDispatch(s,{type:'MOVE',instanceId:drum,seat:0,zone:'support'});s.rules!.counters={[drum]:{momentum:3}};
  const deck=[...s.table.piles['0:deck']],p=bruteEffects[s.table.cards[drum].cardId].activated![0];s=resolveAshenEffect(s,p,{player:'0',source:drum});
  const choices=pendingAshenChoices(s)!,expected=deck.filter(id=>s.table.cards[id].type==='Unit');expect(choices.entities.map(e=>e.id)).toEqual(expected);
  const wrong=deck.find(id=>s.table.cards[id].type==='Ley Font')!;expect(()=>resumeAshenEffect(s,[wrong])).toThrow('legal');
  const target=choices.entities[0].id;s=resumeAshenEffect(s,[target]);expect(s.table.cards[target].zone).toBe('hand');expect(s.table.piles['0:deck']).not.toEqual(deck.filter(id=>id!==target));expect(s.rules?.counters?.[drum]?.momentum).toBe(0);
  expect(s.table.events.some(e=>e.includes('Revealed:'))).toBe(true);
 });
 it('allows a failed Drum search but still spends counters and shuffles',()=>{
  let s=newBattlefield(false,()=>.4);const drum=idOf(s,'drum-of-the-pit');s=battlefieldDispatch(s,{type:'MOVE',instanceId:drum,seat:0,zone:'support'});s.rules!.counters={[drum]:{momentum:3}};
  const p=bruteEffects[s.table.cards[drum].cardId].activated![0],deck=[...s.table.piles['0:deck']];s=resolveAshenEffect(s,p,{player:'0',source:drum});s=resumeAshenEffect(s,[]);
  expect(s.table.piles['0:deck']).toHaveLength(deck.length);expect(s.table.piles['0:deck']).not.toEqual(deck);expect(s.rules?.counters?.[drum]?.momentum).toBe(0);
 });
 it('Fury Offering remembers the sacrificed Attack and uses reproducible random discards',()=>{
  let start=hand(newBattlefield(false,()=>.4),'fury-offering'),s=start.s;const victim=idOf(s,'frenzied-grunt');s=battlefieldDispatch(s,{type:'MOVE',instanceId:victim,seat:0,zone:'unit'});
  s=battlefieldDispatch(s,{type:'COUNTER',instanceId:victim,delta:2});const attack=ashenStats(s,victim).attack,station=s.table.piles['1:command'][0],deck=s.table.piles['0:deck'].length;
  s=deploy(s,start.id,[station]);const before=JSON.stringify(s),a=resumeAshenEffect(s,[victim]),b=resumeAshenEffect(JSON.parse(before),[victim]);
  expect(a).toEqual(b);expect(a.table.health[1]).toBe(20-attack);expect(a.table.piles['0:deck']).toHaveLength(deck-attack);expect(a.table.cards[victim].zone).toBe('graveyard');
  expect(a.rules?.pending).toBeUndefined();expect(a.table.piles['0:graveyard'].length).toBe(4);
 });
});


it('Warcaller observes its own death and simultaneous Brute deaths from last-known state',()=>{
 let s=newBattlefield(false,()=>.4);const warcaller=idOf(s,'savage-warcaller'),grunt=idOf(s,'frenzied-grunt');
 for(const id of [warcaller,grunt])s=battlefieldDispatch(s,{type:'MOVE',instanceId:id,seat:0,zone:'unit'});
 const start=hand(s,'bloodfire-collapse'),deck=start.s.table.piles['0:deck'].length;s=deploy(start.s,start.id);
 expect(s.table.cards[warcaller].zone).toBe('graveyard');expect(s.table.piles['0:deck']).toHaveLength(deck-2);
});
it('removes lethally damaged Units after their Overseer defense bonus disappears',()=>{
 let s=newBattlefield(false,()=>.4);const overseer=idOf(s,'warband-overseer'),grunt=idOf(s,'frenzied-grunt');
 for(const id of [overseer,grunt])s=battlefieldDispatch(s,{type:'MOVE',instanceId:id,seat:0,zone:'unit'});
 s.rules!.damage[grunt]=ashenStats(s,grunt).defense-1;
 const start=hand(s,'ashen-strike');s=deploy(start.s,start.id,[overseer]);
 expect(s.table.cards[overseer].zone).toBe('graveyard');expect(s.table.cards[grunt].zone).toBe('graveyard');
});


it('Outfit grants its ability to the Unit, supports reattachment, and disappears with the Rig',()=>{
 let s=newBattlefield(false,()=>.4);const rig=idOf(s,'flamebelcher-rig'),a=idOf(s,'raging-mauler'),b=idOf(s,'bloodpit-initiate');
 s=battlefieldDispatch(s,{type:'MOVE',instanceId:rig,seat:0,zone:'support'});for(const id of [a,b])s=battlefieldDispatch(s,{type:'MOVE',instanceId:id,seat:0,zone:'unit'});s.basins[0].untuned=3;
 const outfit=bruteEffects[s.table.cards[rig].cardId].activated![0];s=resolveAshenEffect(s,outfit,{player:'0',source:rig,targets:[a]});
 expect(ashenStats(s,a).keywords).toContain('Ranged');expect(availableAshenAbilities(s,a).some(p=>p.id==='rig-shot')).toBe(true);
 s=resolveAshenEffect(s,outfit,{player:'0',source:rig,targets:[b]});expect(ashenStats(s,a).keywords).not.toContain('Ranged');expect(availableAshenAbilities(s,a)).toEqual([]);
 const target=s.table.piles['1:command'][0],shot=availableAshenAbilities(s,b).find(p=>p.id==='rig-shot')!;s=resolveAshenEffect(s,shot,{player:'0',source:b,costCards:[a],targets:[target]});expect(s.table.health[1]).toBe(18);expect(s.table.cards[b].rotated).toBe(true);
 const start=hand(s,'rites-of-ragefire');s=deploy(start.s,start.id,[rig]);expect(s.rules?.attachments?.[rig]).toBeUndefined();expect(ashenStats(s,b).keywords).not.toContain('Ranged');expect(availableAshenAbilities(s,b).some(p=>p.id==='rig-shot')).toBe(false);
});
