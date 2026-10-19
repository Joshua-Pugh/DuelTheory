import {describe,it,expect} from 'vitest';
import type {Card,Deck} from '../core/types';
import {createDuel,type EngineContext} from './model';
import {dispatchDuel,legalActions,MIRROR_FORCE,SAKURETSU_ARMOR,BOOK_OF_MOON} from './rules';
const warrior:Card={id:100,name:'Warrior',type:'Normal Monster',desc:'',level:4,atk:2000,def:1000};
const mirror:Card={id:MIRROR_FORCE,name:'Mirror Force',type:'Trap Card',desc:''};
const armor:Card={id:SAKURETSU_ARMOR,name:'Sakuretsu Armor',type:'Trap Card',desc:''};
const book:Card={id:BOOK_OF_MOON,name:'Book of Moon',type:'Spell Card',race:'Quick-Play',desc:''};
const ctx:EngineContext={cards:new Map([warrior,mirror,armor,book].map(c=>[c.id,c]))};
const deck=(name:string):Deck=>({id:name,name,main:Array(20).fill(100),side:[],extra:[]});
function setup(trapId:number){
 let s=createDuel(deck('a'),deck('b'),ctx,8);
 const attacker=s.players[0].hand[0];s.players[0].hand.shift();s.players[0].zones.monster[0]=attacker;Object.assign(s.cards[attacker],{location:'monster',zone:0,position:'attack',faceDown:false});
 const defender=s.players[1].hand[0];s.players[1].hand.shift();s.players[1].zones.monster[0]=defender;Object.assign(s.cards[defender],{location:'monster',zone:0,position:'attack',faceDown:false});
 const trap='trap';s.cards[trap]={instanceId:trap,cardId:trapId,owner:1,controller:1,location:'spell',zone:0,faceDown:true,setTurn:1};s.players[1].zones.spell[0]=trap;
 s.turn=2;s.phase='BATTLE';s.current=0;s.priority=0;s.pendingDraw=false;
 s=dispatchDuel(s,{type:'DECLARE_ATTACK',seat:0,attackerId:attacker,targetId:defender},ctx);
 return {s,attacker,defender};
}
function resolve(s:ReturnType<typeof setup>['s']){
 s=dispatchDuel(s,{type:'PASS_CHAIN',seat:0},ctx);
 s=dispatchDuel(s,{type:'PASS_CHAIN',seat:1},ctx);
 return s;
}
describe('attack declaration traps',()=>{
 it('Mirror Force resolves on a chain, destroys attack monsters and cancels attack',()=>{
  let {s,attacker}=setup(MIRROR_FORCE);
  expect(legalActions(s,ctx,1).some(a=>a.type==='ACTIVATE_ATTACK_TRAP'&&a.effectId==='MIRROR_FORCE')).toBe(true);
  s=dispatchDuel(s,{type:'ACTIVATE_ATTACK_TRAP',seat:1,instanceId:'trap',effectId:'MIRROR_FORCE'},ctx);
  expect(s.players[0].lp).toBe(8000);
  s=resolve(s);
  expect(s.cards[attacker].location).toBe('graveyard');expect(s.pendingAttack).toBeUndefined();
  expect(s.players[0].lp).toBe(8000);expect(s.cards.trap.location).toBe('graveyard');
 });
 it('Sakuretsu Armor destroys attacker before battle damage',()=>{
  let {s,attacker,defender}=setup(SAKURETSU_ARMOR);
  s=dispatchDuel(s,{type:'ACTIVATE_ATTACK_TRAP',seat:1,instanceId:'trap',effectId:'SAKURETSU_ARMOR',targetId:attacker},ctx);
  s=resolve(s);
  expect(s.cards[attacker].location).toBe('graveyard');expect(s.cards[defender].location).toBe('monster');
  expect(s.pendingAttack).toBeUndefined();expect(s.players[0].lp).toBe(8000);
 });
 it('cannot activate a trap set during the same turn',()=>{
  const {s}=setup(MIRROR_FORCE);s.cards.trap.setTurn=2;
  expect(legalActions(s,ctx,1).some(a=>a.type==='ACTIVATE_ATTACK_TRAP')).toBe(false);
 });
});

describe('Book of Moon chained to battle traps',()=>{
 for(const trapId of [SAKURETSU_ARMOR,MIRROR_FORCE])for(const origin of ['hand','set'] as const)it(`Book from ${origin} saves your attacker from ${trapId===SAKURETSU_ARMOR?'Sakuretsu Armor':'Mirror Force'} and cancels its attack`,()=>{
  let {s,attacker}=setup(trapId);s.cards.book={instanceId:'book',cardId:BOOK_OF_MOON,owner:0,controller:0,location:origin==='hand'?'hand':'spell',faceDown:origin==='set',zone:origin==='set'?0:undefined,setTurn:1};if(origin==='hand')s.players[0].hand.push('book');else s.players[0].zones.spell[0]='book';
  const trap=legalActions(s,ctx,1).find(a=>a.type==='ACTIVATE_ATTACK_TRAP'&&a.instanceId==='trap')!;s=dispatchDuel(s,trap,ctx);
  const response=legalActions(s,ctx,0).find(a=>a.type==='ACTIVATE_BOOK_OF_MOON'&&a.instanceId==='book'&&a.targetId===attacker)!;expect(response).toBeDefined();s=dispatchDuel(s,response,ctx);
  for(let n=0;s.chain.length&&n<4;n++)s=dispatchDuel(s,legalActions(s,ctx,s.priority).find(a=>a.type==='PASS_CHAIN')!,ctx);
  expect(s.cards[attacker]).toMatchObject({location:'monster',faceDown:true,position:'faceDownDefense'});expect(s.pendingAttack).toBeUndefined();expect(s.players.map(p=>p.lp)).toEqual([8000,8000]);expect(s.cards.book.location).toBe('graveyard');expect(s.cards.trap.location).toBe('graveyard');expect(s.lastBattle).toBeUndefined();s.phase='MAIN_2';expect(legalActions(s,ctx,0).some(a=>a.type==='FLIP_SUMMON'&&a.instanceId===attacker)).toBe(false);
 });
 it('Sakuretsu Armor does not destroy an attacker changed to face-up Defense Position',()=>{let {s,attacker}=setup(SAKURETSU_ARMOR);s=dispatchDuel(s,legalActions(s,ctx,1).find(a=>a.type==='ACTIVATE_ATTACK_TRAP')!,ctx);s.cards[attacker].position='faceUpDefense';s=resolve(s);expect(s.cards[attacker].location).toBe('monster');expect(s.pendingAttack).toBeUndefined();});
});
