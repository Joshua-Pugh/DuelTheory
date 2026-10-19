import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import catalogJson from '../../public/catalog.json';
import ydk from '../../public/decks/goat-control.ydk?raw';
import {GOAT_CONTROL,CHAOS_TURBO,assessDeck} from '../supportedDecks';
import SupportedDeckSetup from '../SupportedDeckSetup';
import {parseYdk} from '../core/ydk';
import type {Card} from '../core/types';
import {createDuel,returnToHand,toGraveyard,type DuelState,type LegalAction,type Seat} from './model';
import {legalActions,dispatchDuel} from './rules';
import {auditDuelState} from '../services/duelAudit';
import {GameService} from '../services/GameService';
import {METAMORPHOSIS,TER,MIMIC,absorbedMonster,restrictStat} from './goatControlEffects';
import {battleAttack} from './ritualDeckEffects';
const catalog=catalogJson as Card[],ctx={cards:new Map(catalog.map(c=>[c.id,c]))};
function setup(){const s=createDuel(GOAT_CONTROL,GOAT_CONTROL,ctx,42);s.turn=3;s.phase='MAIN_1';s.pendingDraw=false;for(const seat of [0,1] as const)for(const id of [...s.players[seat].hand])moveId(s,id,'deck');return s;}
function moveId(s:DuelState,id:string,location:'hand'|'monster'|'spell'|'deck',zone=0,faceDown=false){const c=s.cards[id];for(const p of s.players){for(const key of ['hand','deck','graveyard','banished','extra'] as const)if(p[key])p[key]=p[key]!.filter(x=>x!==id);for(const key of ['monster','spell'] as const)p.zones[key]=p.zones[key].map(x=>x===id?null:x);}Object.assign(c,{location,zone:undefined,faceDown,position:undefined,setTurn:1,summonedTurn:1});if(location==='monster'||location==='spell'){c.zone=zone;c.position=faceDown?'faceDownDefense':'attack';s.players[c.controller].zones[location][zone]=id;}else s.players[c.owner][location].push(id);return id;}
function move(s:DuelState,cid:number,location:'hand'|'monster'|'spell'|'deck',seat:Seat=0,zone=0,faceDown=false,n=0){return moveId(s,Object.values(s.cards).filter(c=>c.cardId===cid&&c.owner===seat)[n].instanceId,location,zone,faceDown);}
function act(s:DuelState,type:LegalAction['type'],test:(a:LegalAction)=>boolean=()=>true){const a=[...legalActions(s,ctx,0),...legalActions(s,ctx,1)].find(a=>a.type===type&&test(a));expect(a,`Missing ${type}`).toBeDefined();const next=dispatchDuel(s,a!,ctx);expect(auditDuelState(next)).toEqual([]);return next;}
function resolve(s:DuelState){for(let n=0;n<30&&s.chain.length&&!s.pendingLightChoice;n++)s=act(s,'PASS_CHAIN');return s;}
function absorb(s:DuelState,id:string,target:string){return resolve(act(s,'ACTIVATE_LIGHT_EFFECT',a=>a.type==='ACTIVATE_LIGHT_EFFECT'&&a.instanceId===id&&a.targetId===target));}
describe('Goat Control tournament baseline',()=>{
 it('exports the forty-card Main Deck and eight verified prototype Fusions with guided coverage',()=>{
  expect(GOAT_CONTROL.main).toHaveLength(40);expect(GOAT_CONTROL.extra).toHaveLength(8);expect(parseYdk(ydk)).toEqual({main:GOAT_CONTROL.main,extra:GOAT_CONTROL.extra,side:GOAT_CONTROL.side});expect(assessDeck(GOAT_CONTROL,catalog)).toMatchObject({supported:true,unsupported:[]});
  expect(assessDeck({...GOAT_CONTROL,extra:[...GOAT_CONTROL.extra,78193831]},catalog).supported).toBe(false);
  const service=new GameService(),id=service.createGoatSession([GOAT_CONTROL,CHAOS_TURBO],catalog,42);expect(service.verifyReplay(id)).toMatchObject({matches:true,rulesVerified:true});
 });
 it('keeps Fusion instances out of opening hands and the Main Deck',()=>{const s=setup();expect(s.players[0].extra).toHaveLength(8);expect(s.players[0].deck).toHaveLength(40);expect(auditDuelState(s)).toEqual([]);});
 it('pays Metamorphosis once at activation, chooses the Fusion at resolution and uses the released zone',()=>{
  let s=setup();const meta=move(s,METAMORPHOSIS,'hand'),m=move(s,8131171,'monster');
  s=act(s,'ACTIVATE_LIGHT_EFFECT',a=>a.type==='ACTIVATE_LIGHT_EFFECT'&&a.instanceId===meta&&a.materials?.includes(m)===true);
  expect(s.cards[meta].location).toBe('spell');expect(s.cards[m].location).toBe('graveyard');expect(s.players[0].extra).toHaveLength(8);
  s=resolve(s);expect(s.pendingLightChoice).toMatchObject({kind:'METAMORPHOSIS',level:1});
  const fusion=s.players[0].extra!.find(id=>s.cards[id].cardId===TER)!;
  s=act(s,'COMPLETE_LIGHT_CHOICE',a=>a.type==='COMPLETE_LIGHT_CHOICE'&&a.choiceId===fusion&&a.monsterZone===0&&a.declaredType==='faceUpDefense');
  expect(s.cards[fusion]).toMatchObject({location:'monster',position:'faceUpDefense',properlySummoned:false});expect(s.cards[meta].location).toBe('graveyard');expect(s.players[0].extra).toHaveLength(7);
 });
 it('allows face-down tribute materials and rejects missing-level Fusions and the Scapegoat turn lock',()=>{
  const s=setup(),meta=move(s,METAMORPHOSIS,'hand'),m=move(s,31560081,'monster',0,0,true);
  expect(legalActions(s,ctx,0).some(a=>a.type==='ACTIVATE_LIGHT_EFFECT'&&a.instanceId===meta&&a.materials?.includes(m))).toBe(true);
  s.summonLockedTurn=[s.turn,0];expect(legalActions(s,ctx,0).some(a=>a.type==='ACTIVATE_LIGHT_EFFECT'&&a.instanceId===meta)).toBe(false);
  s.summonLockedTurn=undefined;move(s,31560081,'deck');move(s,72989439,'monster');expect(legalActions(s,ctx,0).some(a=>a.type==='ACTIVATE_LIGHT_EFFECT'&&a.instanceId===meta)).toBe(false);
 });
 it('uses Sheep Tokens as Metamorphosis costs on a later turn',()=>{
  let s=setup();const goat=move(s,73915051,'hand');s=resolve(act(s,'ACTIVATE_LIGHT_EFFECT',a=>a.type==='ACTIVATE_LIGHT_EFFECT'&&a.instanceId===goat));
  const token=s.players[0].zones.monster.find(id=>id&&s.cards[id].token)!;s.turn++;s.summonLockedTurn=undefined;const meta=move(s,METAMORPHOSIS,'hand');
  s=act(s,'ACTIVATE_LIGHT_EFFECT',a=>a.type==='ACTIVATE_LIGHT_EFFECT'&&a.instanceId===meta&&a.materials?.includes(token)===true);expect(s.cards[token].tokenGone).toBe(true);expect(s.players[0].graveyard).not.toContain(token);
 });
 it('converts an opponent-turn Sheep Token into Thousand-Eyes after the real turn transition',()=>{
  let s=setup();s.current=1;s.priority=1;s.phase='END';
  const goat=move(s,73915051,'spell',0,0,true),meta=move(s,METAMORPHOSIS,'hand');
  s.freeResponse={priority:0,passed:[]};
  s=resolve(act(s,'ACTIVATE_LIGHT_EFFECT',a=>a.type==='ACTIVATE_LIGHT_EFFECT'&&a.instanceId===goat));
  expect(s.summonLockedTurn?.[0]).toBe(s.turn);
  for(let n=0;n<12&&!(s.current===0&&s.phase==='MAIN_1');n++){
   const actions=[...legalActions(s,ctx,0),...legalActions(s,ctx,1)];
   const a=actions.find(a=>a.type==='PASS_FREE_RESPONSE')??actions.find(a=>a.type==='DRAW_PHASE')??actions.find(a=>a.type==='ADVANCE');
   expect(a).toBeDefined();s=dispatchDuel(s,a!,ctx);
  }
  expect(s.current).toBe(0);expect(s.phase).toBe('MAIN_1');
  const token=s.players[0].zones.monster.find(id=>id&&s.cards[id].token)!;
  s=act(s,'ACTIVATE_LIGHT_EFFECT',a=>a.type==='ACTIVATE_LIGHT_EFFECT'&&a.instanceId===meta&&a.materials?.includes(token)===true);
  s=resolve(s);expect(s.pendingLightChoice?.level).toBe(1);
  const fusion=s.players[0].extra!.find(id=>s.cards[id].cardId===TER)!;
  s=act(s,'COMPLETE_LIGHT_CHOICE',a=>a.type==='COMPLETE_LIGHT_CHOICE'&&a.choiceId===fusion&&a.declaredType==='attack');
  expect(s.cards[fusion].location).toBe('monster');expect(s.cards[token].tokenGone).toBe(true);
 });
 it('absorbs a monster and copies its ATK/DEF without changing ownership',()=>{
  let s=setup();const ter=move(s,TER,'monster'),target=move(s,18036057,'monster',1);s=absorb(s,ter,target);
  expect(s.cards[target]).toMatchObject({location:'spell',controller:0,owner:1,absorbed:true,linkedTarget:ter});expect(battleAttack(s,ter,ctx)).toBe(1900);expect(restrictStat(s,ter,'def',ctx)).toBe(1400);expect(s.players[1].zones.monster[0]).toBeNull();
  expect(legalActions(s,ctx,0).some(a=>a.type==='ACTIVATE_LIGHT_EFFECT'&&a.instanceId===ter)).toBe(false);
 });
 it('keeps an absorbed face-down monster hidden and grants zero stats',()=>{
  let s=setup();const ter=move(s,TER,'monster'),target=move(s,18036057,'monster',1,0,true);s=absorb(s,ter,target);expect(s.cards[target]).toMatchObject({faceDown:true,equippedHidden:true});expect(battleAttack(s,ter,ctx)).toBe(0);expect(restrictStat(s,ter,'def',ctx)).toBe(0);
 });
 it('equips Sheep Tokens and removes them cleanly when their host leaves',()=>{
  let s=setup();const ter=move(s,TER,'monster');s.current=1;const goat=move(s,73915051,'hand',1);s=resolve(act(s,'ACTIVATE_LIGHT_EFFECT',a=>a.type==='ACTIVATE_LIGHT_EFFECT'&&a.instanceId===goat));s.current=0;s.priority=0;
  const token=s.players[1].zones.monster.find(id=>!!id)!;s=absorb(s,ter,token);expect(s.cards[token]).toMatchObject({location:'spell',absorbed:true});toGraveyard(s,ter);expect(s.cards[token].tokenGone).toBe(true);expect(auditDuelState(s)).toEqual([]);
 });
 it('locks other attacks, position changes and Flip Summons, including both TERs in a mirror',()=>{
  const s=setup(),ter=move(s,TER,'monster'),other=move(s,18036057,'monster',0,1),set=move(s,31560081,'monster',0,2,true);s.phase='BATTLE';
  expect(legalActions(s,ctx,0).filter(a=>a.type==='DECLARE_ATTACK').every(a=>a.type==='DECLARE_ATTACK'&&a.attackerId===ter)).toBe(true);
  s.phase='MAIN_1';expect(legalActions(s,ctx,0).some(a=>(a.type==='CHANGE_POSITION'&&a.instanceId===other)||(a.type==='FLIP_SUMMON'&&a.instanceId===set))).toBe(false);
  move(s,TER,'monster',1);s.phase='BATTLE';expect(legalActions(s,ctx,0).some(a=>a.type==='DECLARE_ATTACK')).toBe(false);
 });
 it('destroys absorbed equipment when Book of Moon sets TER and resets its once-per-turn ability',()=>{
  let s=setup();const ter=move(s,TER,'monster'),target=move(s,18036057,'monster',1);s=absorb(s,ter,target);const book=move(s,14087893,'hand');s=resolve(act(s,'ACTIVATE_BOOK_OF_MOON',a=>a.type==='ACTIVATE_BOOK_OF_MOON'&&a.instanceId===book&&a.targetId===ter));
  expect(s.cards[ter].faceDown).toBe(true);expect(s.cards[ter].effectUsedTurn).toBeUndefined();expect(s.cards[target].location).toBe('graveyard');expect(absorbedMonster(s,ter)).toBeUndefined();
 });
 it('returns bounced Fusions to the Fusion Deck and forbids reviving a Metamorphosis summon',()=>{
  const s=setup(),ter=move(s,TER,'monster');s.cards[ter].properlySummoned=false;returnToHand(s,ter);expect(s.players[0].extra).toContain(ter);expect(s.players[0].hand).not.toContain(ter);expect(auditDuelState(s)).toEqual([]);
  moveId(s,ter,'monster');toGraveyard(s,ter);const call=Object.values(s.cards).find(c=>c.owner===0&&c.cardId===97077563);
  // This tournament list has no revival card. Check the shared revival action generator with an explicit fixture.
  const cardId=97077563,id='test-call';s.cards[id]={instanceId:id,cardId,owner:0,controller:0,location:'spell',zone:0,faceDown:true,setTurn:1};s.players[0].zones.spell[0]=id;expect(call).toBeUndefined();expect(legalActions(s,ctx,0).some(a=>a.type==='ACTIVATE_DECK_EFFECT'&&a.effectId==='CALL'&&a.targetId===ter)).toBe(false);
 });
 it('replaces battle destruction with its equipment while taking normal battle damage',()=>{
  let s=setup();const ter=move(s,TER,'monster'),target=move(s,18036057,'monster',1),bls=move(s,72989439,'monster',1,1);s=absorb(s,ter,target);s.phase='BATTLE';
  s=act(s,'DECLARE_ATTACK',a=>a.type==='DECLARE_ATTACK'&&a.attackerId===ter&&a.targetId===bls);s=act(s,'PASS_ATTACK_RESPONSE');for(let n=0;n<4;n++)s=act(s,'ADVANCE_DAMAGE_STEP');expect(s.cards[ter].location).toBe('monster');expect(s.cards[target].location).toBe('graveyard');expect(s.players[0].lp).toBe(6900);expect(battleAttack(s,ter,ctx)).toBe(0);
 });
 it('fails absorption if its target leaves before resolution and still spends the once-per-turn use',()=>{
  let s=setup();const ter=move(s,TER,'monster'),target=move(s,18036057,'monster',1);s=act(s,'ACTIVATE_LIGHT_EFFECT',a=>a.type==='ACTIVATE_LIGHT_EFFECT'&&a.instanceId===ter&&a.targetId===target);toGraveyard(s,target);s=resolve(s);expect(absorbedMonster(s,ter)).toBeUndefined();expect(s.cards[ter].effectUsedTurn).toBe(s.turn);
 });
 it('waits to activate Sangan until Metamorphosis has finished resolving',()=>{
  let s=setup();const meta=move(s,METAMORPHOSIS,'hand'),sangan=move(s,26202165,'monster');s=act(s,'ACTIVATE_LIGHT_EFFECT',a=>a.type==='ACTIVATE_LIGHT_EFFECT'&&a.instanceId===meta&&a.materials?.includes(sangan)===true);expect(s.pendingTriggers).toEqual([]);expect(s.deferredTriggers?.[0].effectId).toBe('SANGAN_SEARCH');s=resolve(s);s=act(s,'COMPLETE_LIGHT_CHOICE');expect(s.pendingTriggers?.[0].effectId).toBe('SANGAN_SEARCH');
 });
 it('resolves Dark Mimic LV1’s mandatory Flip draw',()=>{let s=setup();const mimic=move(s,MIMIC,'monster',0,0,true),count=s.players[0].hand.length;s=act(s,'FLIP_SUMMON',a=>a.type==='FLIP_SUMMON'&&a.instanceId===mimic);s=resolve(act(s,'ACTIVATE_TRIGGER'));expect(s.players[0].hand).toHaveLength(count+1);});
 it('keeps deck buttons in separate cards and matchup selectors in their own section',()=>{const html=renderToStaticMarkup(<SupportedDeckSetup deck={GOAT_CONTROL} playerDeck="goat" opponentDeck="chaos" onPlayer={()=>{}} onOpponent={()=>{}} supported manual={false} unsupported={[]} onLoadDeck={()=>{}}/>);expect(html).toContain('dt-preset-grid');expect(html).toContain('dt-matchup-selectors');expect(html).toContain('Goat Control - GOAT.ydk');});
});
