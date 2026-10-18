import {describe,it,expect} from 'vitest';
import {newAshenDuel,submitAshenAction,resumeBruteDuel,passAshenPriority,settleAshenDuel,burnInBruteDuel,nextAshenPhase,declareAshenAttackers} from './duel';
import {ashenAdapter,ashenStats,moveAshenCard,drainTriggers,playProgram} from './adapter';
import {nobleEffects} from './nobleEffects';
import {ashenCardMap} from '../../ashenDecks';
import {executeProgram,continueProgram,validateEffectProgram,candidates,type EffectProgram} from '../../framework';
import type {Battlefield} from '../../ashenBattlefieldState';
const source=(s:Battlefield,slug:string,seat=0)=>{
 const cardId='ashen-noble-'+slug;
 let card=Object.values(s.table.cards).find(c=>c.cardId===cardId&&c.controller===seat);
 if(!card){const data=ashenCardMap.get(cardId)!;const id='test-'+seat+'-'+slug;card={instanceId:id,cardId,name:data.name,type:data.type,owner:seat as 0|1,controller:seat as 0|1,zone:'hand',faceDown:false,rotated:false,counters:0};s.table.cards[id]=card;s.table.piles[`${seat}:hand`].push(id);}
 if(card.zone!=='hand')moveAshenCard(s,card.instanceId,'hand');return card.instanceId;
};
const fixture=()=>{const s=newAshenDuel(['Noble','Brute'],42,0);s.basins[0]={untuned:50,oath:50,fury:0,ash:0,veil:0};return s;};
function finish(start:Battlefield,choose?:(s:Battlefield)=>string[]){let s=start;for(let i=0;i<200;i++){
 const pending=s.rules?.pending;
 if(pending){const step=pending.flow.steps[0];let ids:string[]=[];
  if(step.op==='plan')ids=(pending.flow.planIds||[]).map(id=>'t:'+id);
  else if(step.op==='mode')ids=step.options.slice(0,step.min).map(o=>o.id);
  else if(step.op==='choose'||step.op==='select')ids=ashenAdapter.entities(s).filter(e=>(!step.selection.filter.zones||step.selection.filter.zones.includes(e.zone))&&(!step.selection.filter.controller||step.selection.filter.controller==='any'||(step.selection.filter.controller==='self'?e.controller===pending.flow.context.player:e.controller!==pending.flow.context.player))&&(!step.selection.filter.types||step.selection.filter.types.includes(e.type))&&(!step.selection.filter.tags||step.selection.filter.tags.every(t=>e.tags.includes(t)))).slice(0,step.selection.min??(step.selection.optional?0:step.selection.count)).map(e=>e.id);
  s=resumeBruteDuel(s,choose?.(s)||ids);continue;
 }
 if(s.rules?.duel?.winner!==undefined)return s;
 const priority=s.rules?.duel?.priority;if(priority){s=passAshenPriority(s,Number(priority.holder) as 0|1);continue;}
 return s;
 }throw Error('Choice/trigger loop did not finish');}
describe('Noble deck and mixed AT duels',()=>{
 it('registers every Noble catalog card with valid portable programs',()=>{
  const cards=[...ashenCardMap.values()].filter(c=>c.faction==='Noble');expect(cards).toHaveLength(43);
  for(const card of cards){const d=nobleEffects[card.id];expect(d,card.name).toBeDefined();for(const p of [d.onPlay,d.onStart,d.onBurn,d.onReady,...(d.activated||[]),...(d.triggers||[]).map(t=>t.program)].filter(Boolean))expect(validateEffectProgram(p),card.name).toEqual([]);}
 });
 it('supports all four deck pairings, fresh shuffled hands and specified coin winner',()=>{
  for(const a of ['Brute','Noble'] as const)for(const b of ['Brute','Noble'] as const){const s=newAshenDuel([a,b],74,1);expect(s.table.active).toBe(1);for(const seat of [0,1]){expect(s.table.piles[`${seat}:hand`]).toHaveLength(6);expect(ashenCardMap.get(s.table.cards[s.table.piles[`${seat}:command`][0]].cardId)?.faction).toBe(seat===0?a:b);}}
  expect(newAshenDuel(['Noble','Noble'],1,0).table.piles['0:hand'].map(id=>newAshenDuel(['Noble','Noble'],1,0).table.cards[id].cardId)).not.toEqual(newAshenDuel(['Noble','Noble'],2,0).table.piles['0:hand'].map(id=>newAshenDuel(['Noble','Noble'],2,0).table.cards[id].cardId));
 });
 it('Plans in viewed order and preserves the unviewed deck',()=>{
  const s=fixture(),id=source(s,'court-scribe'),deck=[...s.table.piles['0:deck']],p:EffectProgram={version:1,id:'plan-test',label:'Plan test',steps:[{op:'plan',count:3}]};
  const start=executeProgram(s,ashenAdapter,p,{source:id,player:'0'});const done=continueProgram(start.state,ashenAdapter,start.pending!,['t:'+deck[2],'b:'+deck[0],'t:'+deck[1]]);
  expect(done.state.table.piles['0:deck']).toEqual([deck[2],deck[1],...deck.slice(3),deck[0]]);expect(done.events.filter(e=>e.kind==='planned')).toHaveLength(1);expect(done.events.filter(e=>e.kind==='bottomed')).toHaveLength(1);expect(s.table.piles['0:deck']).toEqual(deck);
 });
 it('Refines once, moves chosen hand cards to the deck bottom and retains draw events',()=>{
  const s=fixture(),id=source(s,'shieldbearer-noble'),deck=[...s.table.piles['0:deck']],p=nobleEffects[s.table.cards[id].cardId].onPlay!;
  const start=executeProgram(s,ashenAdapter,p,{source:id,player:'0'});expect(start.pending).toBeDefined();expect(start.events.filter(e=>e.kind==='drawn')).toHaveLength(1);
  const done=continueProgram(start.state,ashenAdapter,start.pending!,[deck[0]]);expect(done.state.table.piles['0:deck']).toEqual([...deck.slice(1),deck[0]]);expect(done.events.filter(e=>e.kind==='refined')).toHaveLength(1);
 });
 it('deploys Garrett and Fortifies all friendly Nobles including himself',()=>{
  let s=fixture();const garrett=source(s,'garrett-of-ashenfield'),other=source(s,'banner-guard');moveAshenCard(s,other,'unit');s=finish(submitAshenAction(s,garrett,{source:garrett,player:'0'}));expect(s.table.cards[garrett].counters).toBe(1);expect(s.table.cards[other].counters).toBe(1);
 });
 it('does not trigger Garrett for zero Station damage, but triggers on positive damage and preserves his self-trigger',()=>{
  let s=fixture();const id=source(s,'garrett-of-ashenfield');moveAshenCard(s,id,'unit');const target=s.table.piles['1:command'][0];
  const hit=(state:Battlefield,n:number)=>executeProgram(state,ashenAdapter,{version:1,id:'hit-station',label:'Hit Station',targets:{filter:{zones:['command']},count:1,label:'Station'},steps:[{op:'damage',targets:'targets',amount:n}]},{source:id,player:'0',targets:[target]});
  let result=hit(s,0);s=settleAshenDuel(drainTriggers(result.state,result.events));expect(s.rules?.pending).toBeUndefined();expect(s.rules?.duel?.stack).toHaveLength(0);
  result=hit(s,1);s=settleAshenDuel(drainTriggers(result.state,result.events));expect(s.rules?.pending?.label).toBe('garrett station');
  s=resumeBruteDuel(s,[target]);for(let i=0;i<8&&!s.rules?.pending&&s.rules?.duel?.priority;i++)s=passAshenPriority(s,Number(s.rules.duel.priority.holder) as 0|1);expect(s.table.health[1]).toBe(18);expect(s.rules?.pending?.label).toBe('garrett station');
 });
 it('burns Noble Fonts for their printed essence rather than Fury',()=>{
  let s=fixture();const id=source(s,'oath-font');moveAshenCard(s,id,'ley');const oath=s.basins[0].oath;s=burnInBruteDuel(s,id,0);expect(s.basins[0].oath).toBe(oath+1);expect(s.basins[0].fury).toBe(0);
 });
 it('discounts Command only by the number of Plan/Refine actions and protects Aegis from enemy selection',()=>{
  const s=fixture(),id=source(s,'garrett-of-ashenfield');const original=playProgram(s,id).cost!.generic!;s.rules!.nobleMarks={0:{planned:1,refined:2}};expect(playProgram(s,id).cost!.generic).toBe(Math.max(0,original-3));
  const crown=source(s,'crown-of-dominion'),unit=source(s,'shieldbearer-noble');moveAshenCard(s,crown,'support');moveAshenCard(s,unit,'unit');ashenAdapter.counter(s,crown,'dominion',5);expect(ashenStats(s,unit).keywords).toContain('Aegis');const entity=ashenAdapter.entities(s).find(e=>e.id===unit)!;expect(ashenAdapter.canTarget!(s,entity,{source:id,player:'1'})).toBe(false);expect(ashenAdapter.canTarget!(s,entity,{source:id,player:'0'})).toBe(true);
 });
 it('resolves every Noble entry program in a guided duel without losing a pending choice',()=>{
  for(const [cardId,d] of Object.entries(nobleEffects)){
   if(!d.onPlay)continue;
   let s=fixture();const id=source(s,cardId.replace('ashen-noble-',''));
   s=finish(submitAshenAction(s,id,{source:id,player:'0'}));
   expect(s.rules?.pending,cardId).toBeUndefined();expect(s.rules?.duel?.stack,cardId).toHaveLength(0);
   expect(s.table.cards[id].zone,cardId).toBe(['Unit','Relic','Rune','Ley Font'].includes(s.table.cards[id].type)?s.table.cards[id].type==='Unit'?'unit':s.table.cards[id].type==='Ley Font'?'ley':'support':'graveyard');
  }
 });
 it('Nullifies an Action without refunding its already-paid cost',()=>{
  let s=fixture();const will=source(s,'throne-s-will');const enemy=Object.values(s.table.cards).find(c=>c.controller===1&&c.type==='Unit')!;
  moveAshenCard(s,enemy.instanceId,'clash');s.rules!.duel!.stack.push({key:'enemy-action',kind:'action',context:{source:enemy.instanceId,player:'1'},program:{version:1,id:'deploy',label:'Enemy Unit',steps:[]}});s.rules!.duel!.priority={holder:'0',players:['0','1'],passed:[]};
  const pool=s.basins[0].oath;
  s=submitAshenAction(s,will,{source:will,player:'0'});s=finish(s);
  expect(s.table.cards[enemy.instanceId].zone).toBe('graveyard');expect(s.basins[0].oath).toBeLessThan(pool);expect(s.table.events.some(e=>e.includes('Paid costs remain spent'))).toBe(true);
 });
 it('Seraphine deploys an eligible hand Noble for free with its entry effect',()=>{
  let s=fixture();const seraphine=source(s,'seraphine-royal-advisor'),unit=source(s,'shieldbearer-noble');moveAshenCard(s,seraphine,'unit');s.rules!.lastNobleMarks={0:{planned:1}};s.basins[0].oath=0;s.basins[0].untuned=0;
  const p=nobleEffects['ashen-noble-seraphine-royal-advisor'].onStart!;
  s=settleAshenDuel(drainTriggers(s,[]));s.rules!.duel!.stack.push({kind:'trigger',program:p,context:{source:seraphine,player:'0'}});s=settleAshenDuel(s);
  expect(s.rules?.pending?.flow.steps[0].op).toBe('choose');s=resumeBruteDuel(s,[unit]);s=finish(s);expect(s.table.cards[unit].zone).toBe('unit');expect(s.basins[0].oath).toBe(0);expect(s.basins[0].untuned).toBeGreaterThanOrEqual(0);expect(s.rules?.pending).toBeUndefined();
 });
 it('executes each Noble activated ability with its actual costs and follow-up choices',()=>{
  for(const [cardId,d] of Object.entries(nobleEffects))for(const ability of d.activated||[]){
   let s=fixture();const id=source(s,cardId.replace('ashen-noble-',''));moveAshenCard(s,id,s.table.cards[id].type==='Unit'?'unit':s.table.cards[id].type==='Ley Font'?'ley':'support');
   const unit=source(s,'banner-guard');moveAshenCard(s,unit,'unit');
   if(ability.cost?.counters)for(const [counter,n] of Object.entries(ability.cost.counters))ashenAdapter.counter(s,id,counter,n);
   const enemy=Object.values(s.table.cards).find(c=>c.controller===1&&c.type==='Unit')!;moveAshenCard(s,enemy.instanceId,'clash');s.rules!.duel!.stack.push({key:'enemy-action',kind:'action',context:{source:enemy.instanceId,player:'1'},program:{version:1,id:'deploy',label:'Enemy Action',steps:[]}});
   s.rules!.duel!.priority={holder:'0',players:['0','1'],passed:[]};
   if(ability.id==='lance-outfit'){s.rules!.duel!.stack=[];s.rules!.duel!.priority=null;}
   const context={source:id,player:'0'},targets=ability.targets?candidates(s,ashenAdapter,ability.targets,context).slice(0,ability.targets.count).map(e=>e.id):[];
   s=finish(submitAshenAction(s,id,{...context,targets},ability.id));expect(s.rules?.pending,ability.id).toBeUndefined();
   if(ability.cost?.exhaust)expect(s.table.cards[id].rotated,ability.id).toBe(true);
  }
 });
 it('applies Bastion end-turn Fortify before advancing the turn',()=>{
  let s=fixture();const unit=source(s,'banner-guard');moveAshenCard(s,unit,'unit');s.rules!.nobleMarks={0:{planned:1,refined:1}};
  s=finish(nextAshenPhase(s));s=finish(declareAshenAttackers(s,[]));s=finish(nextAshenPhase(s));s=finish(nextAshenPhase(s));
  expect(s.table.cards[unit].counters).toBe(1);expect(s.table.active).toBe(1);expect(s.rules?.lastNobleMarks?.[0]).toMatchObject({planned:1,refined:1});
 });
});
