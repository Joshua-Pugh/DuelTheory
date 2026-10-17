import {describe,it,expect} from 'vitest';
import type {Card,Deck} from '../core/types';
import {createDuel,type DuelState} from './model';
import {dispatchDuel,legalActions,MAGICIAN_OF_FAITH,DEKOICHI,POT_OF_GREED} from './rules';
const cards:Card[]=[
 {id:101,name:'Attacker',type:'Normal Monster',level:4,atk:1800,def:1100,desc:''},
 {id:MAGICIAN_OF_FAITH,name:'Magician of Faith',type:'Flip Effect Monster',level:1,atk:300,def:400,desc:''},
 {id:DEKOICHI,name:'Dekoichi',type:'Flip Effect Monster',level:4,atk:1400,def:1000,desc:''},
 {id:POT_OF_GREED,name:'Pot',type:'Spell Card',desc:''},
];
const ctx={cards:new Map(cards.map(c=>[c.id,c]))};
const deck=(main:number[]):Deck=>({id:'test',name:'test',main,side:[],extra:[]});
function place(s:DuelState,seat:0|1,cardId:number,zone:number,faceDown:boolean){
 const id=Object.keys(s.cards).find(x=>s.cards[x].owner===seat&&s.cards[x].cardId===cardId&&s.cards[x].location==='deck')!;
 const card=s.cards[id];s.players[seat].deck.splice(s.players[seat].deck.indexOf(id),1);
 Object.assign(card,{location:'monster',zone,controller:seat,faceDown,position:faceDown?'faceDownDefense':'attack'});
 s.players[seat].zones.monster[zone]=id;return id;
}
function setup(defender:number){const s=createDuel(deck(Array(30).fill(101)),deck([defender,POT_OF_GREED,...Array(30).fill(101)]),ctx,92);
 const attacker=place(s,0,101,0,false);const target=place(s,1,defender,0,true);
 s.turn=2;s.phase='BATTLE';s.current=0;s.pendingDraw=false;s.priority=0;
 return {s,attacker,target};}
function progress(s:DuelState,n:number){for(let i=0;i<n;i++)s=dispatchDuel(s,{type:'ADVANCE_DAMAGE_STEP',seat:0},ctx);return s;}
describe('GOAT Damage Step initial state machine',()=>{
 it('flips and destroys Magician of Faith, then activates its Flip Effect even in GY',()=>{
  let {s,attacker,target}=setup(MAGICIAN_OF_FAITH);
  // Move Pot to graveyard as a legitimate recoverable card.
  const spell=Object.keys(s.cards).find(x=>s.cards[x].owner===1&&s.cards[x].cardId===POT_OF_GREED)!;
  const c=s.cards[spell];s.players[1][c.location==='hand'?'hand':'deck'].splice(s.players[1][c.location==='hand'?'hand':'deck'].indexOf(spell),1);
  c.location='graveyard';s.players[1].graveyard.push(spell);
  s=dispatchDuel(s,{type:'DECLARE_ATTACK',seat:0,attackerId:attacker,targetId:target},ctx);
  s=dispatchDuel(s,{type:'PASS_ATTACK_RESPONSE',seat:1},ctx);
  expect(s.pendingAttack?.damageStep).toBe('START');
  s=progress(s,2);expect(s.cards[target].faceDown).toBe(false);expect(s.pendingAttack?.damageStep).toBe('CALCULATE');
  s=progress(s,2);expect(s.cards[target].location).toBe('graveyard');
  const option=legalActions(s,ctx,1).find(x=>x.type==='ACTIVATE_TRIGGER'&&x.choiceId===spell);
  expect(option).toBeDefined();s=dispatchDuel(s,option!,ctx);
  s=dispatchDuel(s,{type:'PASS_CHAIN',seat:0},ctx);s=dispatchDuel(s,{type:'PASS_CHAIN',seat:1},ctx);
  expect(s.players[1].hand).toContain(spell);
 });
 it('reveals Dekoichi and draws after battle destroys it',()=>{
  let {s,attacker,target}=setup(DEKOICHI);const before=s.players[1].hand.length;
  s=dispatchDuel(s,{type:'DECLARE_ATTACK',seat:0,attackerId:attacker,targetId:target},ctx);
  s=dispatchDuel(s,{type:'PASS_ATTACK_RESPONSE',seat:1},ctx);s=progress(s,4);
  expect(s.cards[target].location).toBe('graveyard');
  const trigger=legalActions(s,ctx,1).find(x=>x.type==='ACTIVATE_TRIGGER');expect(trigger).toBeDefined();
  s=dispatchDuel(s,trigger!,ctx);s=dispatchDuel(s,{type:'PASS_CHAIN',seat:0},ctx);s=dispatchDuel(s,{type:'PASS_CHAIN',seat:1},ctx);
  expect(s.players[1].hand.length).toBe(before+1);
 });
 it('blocks unrelated actions during Damage Step',()=>{
  let {s,attacker,target}=setup(DEKOICHI);
  s=dispatchDuel(s,{type:'DECLARE_ATTACK',seat:0,attackerId:attacker,targetId:target},ctx);
  s=dispatchDuel(s,{type:'PASS_ATTACK_RESPONSE',seat:1},ctx);
  expect(legalActions(s,ctx,0).map(a=>a.type)).toEqual(['ADVANCE_DAMAGE_STEP']);
  expect(legalActions(s,ctx,1)).toEqual([]);
 });
});
