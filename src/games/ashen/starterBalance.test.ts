import {expect,it} from 'vitest';
import {readyAshenDuel} from '../../test/ashenReady';
import {fixtureCard} from '../../test/ashenFixtureCard';
import {ashenAdapter,moveAshenCard,ashenStats,playProgram} from './adapter';
import {submitAshenAction,passAshenPriority,resumeBruteDuel,canBlockAshen} from './duel';
import {bruteEffects} from './bruteEffects';
import {starterDeck,ashenStarterCards,changeAshenQuantity} from '../../ashenDecks';
import reserve from '../../../docs/design/balance-2026-11-06/booster-reserve.json';
import type {Battlefield} from '../../ashenBattlefieldState';
function setup(){const s=readyAshenDuel(['Brute','Noble'],43,0);for(const seat of [0,1] as const)for(const id of [...s.table.piles[`${seat}:hand`]])moveAshenCard(s,id,'deck');s.basins[0]={untuned:10,fury:10,oath:0,ash:0,veil:0};return s;}
function put(s:Battlefield,slug:string,seat=0,zone='unit'){const c=fixtureCard(s,`ashen-${seat?'noble':'brute'}-${slug}`,seat);moveAshenCard(s,c.instanceId,zone);c.rotated=false;return c.instanceId;}
function finish(start:Battlefield){let s=start;for(let i=0;i<100;i++){const flow=s.rules?.pending?.flow,step=flow?.steps[0];if(flow&&step?.op==='select'){s=resumeBruteDuel(s,[s.table.piles['1:command'][0]]);continue;}if(s.rules?.pending)throw Error('Unexpected pending choice');const p=s.rules?.duel?.priority;if(!p)return s;s=passAshenPriority(s,Number(p.holder) as 0|1);}throw Error('Unsettled test action');}
const tokens=(s:Battlefield)=>s.table.piles['0:unit'].filter(id=>s.table.cards[id].cardId==='token');
it('keeps exact starters, engines and finishers while every cut has a saved design',()=>{
 for(const f of ['Brute','Noble'] as const)expect(starterDeck(f).entries.reduce((n,e)=>n+e.count,0)).toBe(60);
 const b=starterDeck('Brute'),n=starterDeck('Noble');const count=(d:typeof b,slug:string)=>d.entries.find(e=>e.cardId.endsWith('-'+slug))?.count||0;
 for(const slug of ['rites-of-ragefire','ashen-strike','bloodpit-initiate','bloodfang-raider','warhowl-instigator'])expect(count(b,slug)).toBe(2);
 for(const slug of ['enforce-the-law','purge-the-unworthy','crown-archer','watchtower-scout','griffin-knight-of-ashenfield'])expect(count(n,slug)).toBe(2);
 expect(count(n,'shieldbearer-noble')).toBe(3);expect(count(n,'court-scribe')).toBe(3);expect(count(n,'rune-of-clarity')).toBe(1);
 for(const slug of ['skarn-the-unchained','drum-of-the-pit','feral-axebreaker','pit-sired-warmonger','fury-offering','blood-cauldron','ashclaw-skyreaver'])expect(count(b,slug)).toBe(1);
 expect(count(n,'court-strategist')).toBe(1);expect(count(n,'royal-crusher')).toBe(1);
 for(const r of reserve.cards){expect(ashenStarterCards.some(c=>c.id===r.card.id)).toBe(false);expect(r.card.effectText).toBeTruthy();expect(r.printed).toBeDefined();}
 const smaller=changeAshenQuantity(b,'ashen-brute-frenzied-grunt',-1);expect(changeAshenQuantity(smaller,'ashen-brute-korgath-s-call',1)).toBe(smaller);
});
it('pays Bring Down the Mighty once, sacrifices a Brute and destroys a large enemy including a Legendary',()=>{
 let s=setup();const source=put(s,'bring-down-the-mighty',0,'hand'),victim=put(s,'frenzied-grunt'),target=put(s,'royal-crusher',1);s=submitAshenAction(s,source,{source,player:'0',costCards:[victim],targets:[target]});
 expect(s.basins[0]).toMatchObject({untuned:9,fury:8});expect(s.table.cards[victim].zone).toBe('graveyard');s=finish(s);expect(s.table.cards[target].zone).toBe('graveyard');expect(tokens(s)).toHaveLength(1);expect(s.table.cards[source].zone).toBe('graveyard');
});
it('rejects own, small or missing targets and missing sacrifice without paying',()=>{
 const s=setup(),source=put(s,'bring-down-the-mighty',0,'hand'),cost=put(s,'frenzied-grunt'),small=put(s,'court-scribe',1),own=put(s,'skarn-the-unchained'),large=put(s,'royal-crusher',1),before=JSON.stringify(s);
 for(const target of [small,own,'missing'])expect(()=>submitAshenAction(s,source,{source,player:'0',targets:[target],costCards:[cost]})).toThrow();
 expect(()=>submitAshenAction(s,source,{source,player:'0',targets:[large]})).toThrow();expect(JSON.stringify(s)).toBe(before);
});
it('rechecks effective Defense at resolution without refunding the sacrifice or Essence',()=>{
 let s=setup();const source=put(s,'bring-down-the-mighty',0,'hand'),victim=put(s,'frenzied-grunt'),target=put(s,'banner-guard',1);s.table.cards[target].counters=1;expect(ashenStats(s,target).defense).toBeGreaterThanOrEqual(4);
 put(s,'ring-of-the-ley',0,'support');s=submitAshenAction(s,source,{source,player:'0',targets:[target],costCards:[victim]});expect(s.rules?.duel?.stack.length).toBeGreaterThan(0);s.table.cards[target].counters=0;s=finish(s);
 expect(s.table.cards[target].zone).toBe('unit');expect(s.table.cards[victim].zone).toBe('graveyard');expect(s.basins[0]).toMatchObject({untuned:9,fury:8});
});
it('offers repeatable Cauldron recovery and locks both activations after Exhaust',()=>{
 let s=setup();const source=put(s,'blood-cauldron',0,'support');s=finish(submitAshenAction(s,source,{source,player:'0'},'cauldron-recover'));expect(tokens(s)).toHaveLength(1);expect(s.table.cards[source].rotated).toBe(true);
 for(const ability of bruteEffects['ashen-brute-blood-cauldron'].activated!)expect(()=>submitAshenAction(s,source,{source,player:'0'},ability.id)).toThrow();
});
it('Offering makes three on an empty Frontline, two otherwise, and Banner grants their Charge',()=>{
 for(const existing of [false,true]){let s=setup();if(existing){put(s,'frenzied-grunt');put(s,'banner-of-the-broken-fist',0,'support');}const source=put(s,'fury-offering',0,'hand');s=finish(submitAshenAction(s,source,{source,player:'0'}));expect(tokens(s)).toHaveLength(existing?2:3);for(const id of tokens(s))expect(s.table.cards[id].rotated).toBe(!existing);}
});
it('Standfast permits fatigued defense but preserves aerial restrictions and revised costs',()=>{
 const s=setup(),ground=put(s,'frenzied-grunt'),air=put(s,'ashen-warhawk'),shield=put(s,'shieldbearer-noble',1),archer=put(s,'crown-archer',1);s.table.cards[shield].rotated=true;s.table.cards[archer].rotated=true;
 expect(canBlockAshen(s,ground,shield)).toBe(true);expect(canBlockAshen(s,air,shield)).toBe(false);expect(canBlockAshen(s,air,archer)).toBe(true);
 const source=put(s,'bloodpit-initiate',0,'hand');expect(playProgram(s,source).cost).toMatchObject({generic:1,resources:{fury:1}});expect(ashenAdapter.stats!(s,source).cost).toBe(2);
});
