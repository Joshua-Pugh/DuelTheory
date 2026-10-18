import {describe,it,expect} from 'vitest';
import catalogJson from '../../public/catalog.json';
import fixture from './fixtures/chaos-ritual-turbo-20261018.json';
import {assessDeck} from '../supportedDecks';
import type {Card} from '../core/types';
import {createDuel,type DuelState,type LegalAction} from './model';
import {dispatchDuel,legalActions} from './rules';
import {resolveChaos,MERCHANT} from './chaosTurboEffects';
import {auditDuelState} from '../services/duelAudit';
const catalog=catalogJson as Card[],ctx={cards:new Map(catalog.map(c=>[c.id,c]))};
const setup=()=>{const s=createDuel(fixture.deck,fixture.deck,ctx,42);s.turn=3;s.phase='MAIN_1';s.pendingDraw=false;return s;};
function move(s:DuelState,cid:number,zone:'deck'|'monster',slot=0){const c=Object.values(s.cards).find(c=>c.cardId===cid&&c.owner===0)!;const id=c.instanceId;for(const p of s.players){for(const k of ['hand','deck','graveyard','banished'] as const)p[k]=p[k].filter(x=>x!==id);p.zones.monster=p.zones.monster.map(x=>x===id?null:x);}Object.assign(c,{location:zone,zone:zone==='monster'?slot:undefined,position:zone==='monster'?'faceDownDefense':undefined,faceDown:zone==='monster',setTurn:1,summonedTurn:1});if(zone==='monster')s.players[0].zones.monster[slot]=id;else s.players[0].deck.push(id);return id;}
function act(s:DuelState,type:LegalAction['type']){const a=[...legalActions(s,ctx,0),...legalActions(s,ctx,1)].find(a=>a.type===type);expect(a,`${type}: stage ${s.pendingAttack?.damageStep}; actions ${[...legalActions(s,ctx,0),...legalActions(s,ctx,1)].map(x=>x.type).join(',')}`).toBeDefined();return dispatchDuel(s,a!,ctx);}
describe('Magical Merchant in the supplied Ritual deck',()=>{
 it('supports the supplied forty-card main deck',()=>{expect(assessDeck(fixture.deck,catalog)).toMatchObject({supported:true,unsupported:[]});});
 it('queues its mandatory Flip Effect and resolves through the chain',()=>{
  let s=setup();move(s,MERCHANT,'monster');s=act(s,'FLIP_SUMMON');expect(s.pendingTriggers?.[0]).toMatchObject({effectId:'MERCHANT_EXCAVATE',mandatory:true});
  s=act(s,'ACTIVATE_TRIGGER');for(let n=0;n<20&&s.chain.length;n++)s=act(s,'PASS_CHAIN');expect(s.events.some(e=>e.type==='EXCAVATE')).toBe(true);expect(auditDuelState(s)).toEqual([]);
 });
 it('adds the first Spell/Trap, mills preceding monsters, preserves the rest, and does not draw or shuffle',()=>{
  const s=setup(),source=move(s,MERCHANT,'monster'),a=move(s,31786629,'deck'),b=move(s,9596126,'deck'),spell=move(s,55144522,'deck');const rest=s.players[0].deck.filter(id=>![a,b,spell].includes(id));s.players[0].deck=[a,b,spell,...rest];
  resolveChaos(s,{instanceId:source,controller:0,effectId:'MERCHANT_EXCAVATE',targets:[],spellSpeed:1},ctx);
  expect(s.players[0].graveyard).toEqual(expect.arrayContaining([a,b]));expect(s.players[0].hand).toContain(spell);expect(s.players[0].deck).toEqual(rest);expect(s.events.some(e=>e.type==='DRAW')).toBe(false);expect(auditDuelState(s)).toEqual([]);
 });
 it('queues Merchant after battle even when the attacked monster is destroyed',()=>{
  let s=setup();move(s,MERCHANT,'monster');const c=Object.values(s.cards).find(c=>c.owner===1&&c.cardId===31786629)!;
  for(const k of ['hand','deck','graveyard','banished'] as const)s.players[1][k]=s.players[1][k].filter(x=>x!==c.instanceId);
  Object.assign(c,{location:'monster',position:'attack',zone:0,faceDown:false,summonedTurn:1});s.players[1].zones.monster[0]=c.instanceId;s.current=1;s.priority=1;s.phase='BATTLE';
  s=act(s,'DECLARE_ATTACK');s=act(s,'PASS_ATTACK_RESPONSE');for(let n=0;n<4;n++)s=act(s,'ADVANCE_DAMAGE_STEP');
  expect(s.pendingTriggers?.some(t=>t.effectId==='MERCHANT_EXCAVATE')).toBe(true);s=act(s,'ACTIVATE_TRIGGER');for(let n=0;n<20&&s.chain.length;n++)s=act(s,'PASS_CHAIN');expect(s.events.some(e=>e.type==='EXCAVATE')).toBe(true);expect(auditDuelState(s)).toEqual([]);
 });
 it('sends every remaining monster when there is no Spell/Trap, without treating it as a failed draw',()=>{
  const s=setup(),source=move(s,MERCHANT,'monster'),a=move(s,31786629,'deck'),b=move(s,9596126,'deck');s.players[0].deck=[a,b];resolveChaos(s,{instanceId:source,controller:0,effectId:'MERCHANT_EXCAVATE',targets:[],spellSpeed:1},ctx);expect(s.players[0].deck).toEqual([]);expect(s.players[0].graveyard).toEqual(expect.arrayContaining([a,b]));expect(s.winner).toBeNull();
 });
 it('handles a top Trap and an empty Deck without causing draw-based deck-out',()=>{
  const s=setup(),source=move(s,MERCHANT,'monster'),trap=move(s,4178474,'deck');s.players[0].deck=[trap];
  resolveChaos(s,{instanceId:source,controller:0,effectId:'MERCHANT_EXCAVATE',targets:[],spellSpeed:1},ctx);expect(s.players[0].hand).toContain(trap);
  resolveChaos(s,{instanceId:source,controller:0,effectId:'MERCHANT_EXCAVATE',targets:[],spellSpeed:1},ctx);expect(s.winner).toBeNull();
 });
});
