import {describe,it,expect} from 'vitest';
import type {Card,Deck} from '../core/types';
import {createDuel,type DuelState} from './model';
import {DD_WARRIOR_LADY,dispatchDuel,legalActions} from './rules';
const cards:Card[]=[
 {id:DD_WARRIOR_LADY,name:'D.D. Warrior Lady',type:'Effect Monster',level:4,atk:1500,def:1600,desc:''},
 {id:101,name:'Test Warrior',type:'Normal Monster',level:4,atk:1800,def:1000,desc:''}
];
const ctx={cards:new Map(cards.map(c=>[c.id,c]))};
const deck=(main:number[]):Deck=>({id:'test',name:'test',main,side:[],extra:[]});
function place(s:DuelState,seat:0|1,cardId:number,zone:number){
 const id=Object.keys(s.cards).find(x=>s.cards[x].owner===seat&&s.cards[x].cardId===cardId&&s.cards[x].location==='deck')!;
 s.players[seat].deck.splice(s.players[seat].deck.indexOf(id),1);
 Object.assign(s.cards[id],{location:'monster',zone,controller:seat,faceDown:false,position:'attack'});
 s.players[seat].zones.monster[zone]=id;return id;
}
function setup(){
 const s=createDuel(deck(Array(25).fill(101)),deck([DD_WARRIOR_LADY,...Array(25).fill(101)]),ctx,811);
 const attacker=place(s,0,101,0),target=place(s,1,DD_WARRIOR_LADY,0);
 s.turn=2;s.phase='BATTLE';s.current=0;s.pendingDraw=false;
 return {s,attacker,target};
}
function reachChoice(s:DuelState,attacker:string,target:string){
 s=dispatchDuel(s,{type:'DECLARE_ATTACK',seat:0,attackerId:attacker,targetId:target},ctx);
 s=dispatchDuel(s,{type:'PASS_ATTACK_RESPONSE',seat:1},ctx);
 for(let i=0;i<3;i++)s=dispatchDuel(s,{type:'ADVANCE_DAMAGE_STEP',seat:0},ctx);
 return s;
}
describe('D.D. Warrior Lady post-calculation trigger',()=>{
 it('inflicts damage first, then optionally banishes both without battle destruction',()=>{
  let {s,attacker,target}=setup();s=reachChoice(s,attacker,target);
  expect(s.players[1].lp).toBe(7700);
  expect(s.cards[target].location).toBe('monster');
  expect(s.pendingAttack?.damageStep).toBe('AFTER_CALCULATE');
  expect(legalActions(s,ctx,1).map(a=>a.type)).toEqual(['ACTIVATE_DD_WARRIOR_LADY','DECLINE_DD_WARRIOR_LADY']);
  s=dispatchDuel(s,{type:'ACTIVATE_DD_WARRIOR_LADY',seat:1},ctx);
  s=dispatchDuel(s,{type:'PASS_CHAIN',seat:0},ctx);
  s=dispatchDuel(s,{type:'PASS_CHAIN',seat:1},ctx);
  expect(s.cards[attacker].location).toBe('banished');expect(s.cards[target].location).toBe('banished');
  s=dispatchDuel(s,{type:'ADVANCE_DAMAGE_STEP',seat:0},ctx);
  expect(s.players[0].banished).toContain(attacker);expect(s.players[1].banished).toContain(target);
  expect(s.players[1].graveyard).not.toContain(target);
 });
 it('decline permits normal battle destruction at the end of Damage Step',()=>{
  let {s,attacker,target}=setup();s=reachChoice(s,attacker,target);
  s=dispatchDuel(s,{type:'DECLINE_DD_WARRIOR_LADY',seat:1},ctx);
  s=dispatchDuel(s,{type:'ADVANCE_DAMAGE_STEP',seat:0},ctx);
  expect(s.cards[target].location).toBe('graveyard');expect(s.cards[attacker].location).toBe('monster');
  expect(s.players[1].banished).not.toContain(target);
 });
 it('cannot activate the effect when there is no monster battle',()=>{
  let {s}=setup();s.players[1].zones.monster[0]=null;
  expect(legalActions(s,ctx,1).some(a=>a.type==='ACTIVATE_DD_WARRIOR_LADY')).toBe(false);
 });
});
