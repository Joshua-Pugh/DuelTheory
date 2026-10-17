import {describe,it,expect} from 'vitest';
import fixture from './engine/fixtures/ritual-deck-20261016.json';
import {createDuel,toGraveyard,type DuelState,type LegalAction} from './engine/model';
import {legalActions,dispatchDuel} from './engine/rules';
import {auditDuelState} from './services/duelAudit';
import {unopposedResponse} from './duelResolution';
import {playedInstances} from './HandPlayAnimations';
import type {Card,Deck} from './core/types';
const ctx={cards:new Map((fixture.catalog as Card[]).map(c=>[c.id,c]))};
function setup(){const deck=fixture.deck as Deck,s=createDuel(deck,deck,ctx,12);s.turn=2;s.phase='MAIN_1';s.pendingDraw=false;return s;}
function hand(s:DuelState,cardId:number){const id=Object.keys(s.cards).find(id=>s.cards[id].owner===0&&s.cards[id].cardId===cardId&&['hand','deck'].includes(s.cards[id].location))!;const c=s.cards[id];if(c.location==='deck'){s.players[0].deck.splice(s.players[0].deck.indexOf(id),1);s.players[0].hand.push(id);c.location='hand';}return id;}
function pass(s:DuelState){for(let i=0;i<5&&s.chain.length;i++)s=dispatchDuel(s,{type:'PASS_CHAIN',seat:s.priority},ctx);return s;}
describe('streamlined response and Ritual flow',()=>{
 it('passes only windows with no playable card response and keeps mandatory effects',()=>{
  for(const type of ['PASS_CHAIN','PASS_ATTACK_RESPONSE','PASS_SUMMON_RESPONSE'] as const){const a={type,seat:0,description:'pass'} as LegalAction;expect(unopposedResponse([a])).toEqual(a);expect(unopposedResponse([a,{type:'ACTIVATE_MST',seat:0,instanceId:'mst',zone:0,targetId:'spell',description:'respond'}])).toBeUndefined();}
  expect(unopposedResponse([{type:'ACTIVATE_TRIGGER',seat:0,sourceId:'breaker',description:'counter'}])).toBeUndefined();
 });
 it('puts the Ritual Spell on the field first, chooses at resolution, and completes without a second response chain',()=>{
  let s=setup();const spell=hand(s,contract()),ritual=hand(s,97642679);hand(s,31786629);hand(s,23401839);
  const begin=legalActions(s,ctx,0).find(a=>a.type==='BEGIN_RITUAL'&&a.instanceId===spell);expect(begin).toBeDefined();const before=s;s=dispatchDuel(s,begin!,ctx);
  expect(s.cards[spell].location).toBe('spell');expect(playedInstances(before,s)).toContain(spell);expect(s.cards[ritual].location).toBe('hand');expect(s.pendingRitual).toBeUndefined();
  s=pass(s);expect(s.pendingRitual?.sourceId).toBe(spell);expect(s.cards[spell].location).toBe('spell');
  const choice=legalActions(s,ctx,0).find(a=>a.type==='ACTIVATE_CONTRACT'&&a.ritualId===ritual);expect(choice).toBeDefined();s=dispatchDuel(s,choice!,ctx);
  expect(s.cards[ritual].location).toBe('monster');expect(s.cards[spell].location).toBe('graveyard');expect(s.pendingRitual).toBeUndefined();expect(s.chain).toHaveLength(0);expect(auditDuelState(s)).toEqual([]);
 });
 it('still resolves a Ritual Spell removed from the field without negation',()=>{
  let s=setup();const spell=hand(s,contract());hand(s,97642679);hand(s,31786629);hand(s,23401839);
  s=dispatchDuel(s,legalActions(s,ctx,0).find(a=>a.type==='BEGIN_RITUAL'&&a.instanceId===spell)!,ctx);toGraveyard(s,spell,'effect');s=pass(s);
  s=dispatchDuel(s,legalActions(s,ctx,0).find(a=>a.type==='ACTIVATE_CONTRACT')!,ctx);expect(s.cards[spell].location).toBe('graveyard');expect(s.players[0].zones.monster.some(Boolean)).toBe(true);expect(auditDuelState(s)).toEqual([]);
 });
 it('finishes without duplicate GY entries if the Ritual monster is no longer in hand',()=>{
  let s=setup();const spell=hand(s,contract()),ritual=hand(s,97642679);hand(s,31786629);hand(s,23401839);
  s=dispatchDuel(s,legalActions(s,ctx,0).find(a=>a.type==='BEGIN_RITUAL'&&a.instanceId===spell)!,ctx);toGraveyard(s,spell,'effect');
  for(const id of [...s.players[0].hand].filter(id=>s.cards[id].cardId===97642679)){s.players[0].hand.splice(s.players[0].hand.indexOf(id),1);toGraveyard(s,id,'cost');}
  s=pass(s);expect(s.players[0].hand).not.toContain(ritual);s=dispatchDuel(s,{type:'FINISH_RITUAL',seat:0},ctx);expect(s.pendingRitual).toBeUndefined();expect(auditDuelState(s)).toEqual([]);
 });
});
function contract(){return fixture.catalog.find(c=>c.name==='Contract with the Dark Master')!.id;}
