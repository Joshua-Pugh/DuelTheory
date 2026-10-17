import {describe,it,expect} from 'vitest';
import type {Card,Deck} from '../core/types';
import {createDuel,type DuelState,type EngineContext} from './model';
import {dispatchDuel,legalActions,BOOK_OF_MOON} from './rules';
const warrior:Card={id:99101,name:'Example Warrior',type:'Normal Monster',desc:'',level:4,atk:1800,def:1200};
const book:Card={id:BOOK_OF_MOON,name:'Book of Moon',type:'Spell Card',desc:'',race:'Quick-Play'};
const ctx:EngineContext={cards:new Map([warrior,book].map(c=>[c.id,c]))};
const deck=(id:string):Deck=>({id,name:id,main:Array(20).fill(warrior.id),side:[],extra:[]});
function setup(){
 const s=createDuel(deck('one'),deck('two'),ctx,41);
 const attacker=s.players[0].hand.shift()!;
 s.players[0].zones.monster[0]=attacker;
 Object.assign(s.cards[attacker],{location:'monster',zone:0,position:'attack',faceDown:false});
 const defender=s.players[1].hand.shift()!;
 s.players[1].zones.monster[0]=defender;
 Object.assign(s.cards[defender],{location:'monster',zone:0,position:'attack',faceDown:false});
 const spellId='example-book';
 s.cards[spellId]={instanceId:spellId,cardId:BOOK_OF_MOON,owner:1,controller:1,location:'spell',zone:0,faceDown:true,setTurn:1};
 s.players[1].zones.spell[0]=spellId;
 s.current=0;s.phase='BATTLE';s.turn=2;s.pendingDraw=false;
 return {s,attacker,defender,spellId};
}
function resolve(s:DuelState){
 s=dispatchDuel(s,{type:'PASS_CHAIN',seat:0},ctx);
 return dispatchDuel(s,{type:'PASS_CHAIN',seat:1},ctx);
}
describe('Book of Moon reusable Quick-Play position effect',()=>{
 it('sets the attacking monster and cancels damage when the chain resolves',()=>{
  const {s:initial,attacker,spellId}=setup();
  let s=dispatchDuel(initial,{type:'DECLARE_ATTACK',seat:0,attackerId:attacker,targetId:initial.players[1].zones.monster[0]!},ctx);
  expect(legalActions(s,ctx,1).some(a=>a.type==='ACTIVATE_BOOK_OF_MOON'&&a.targetId===attacker)).toBe(true);
  s=dispatchDuel(s,{type:'ACTIVATE_BOOK_OF_MOON',seat:1,instanceId:spellId,zone:0,targetId:attacker},ctx);
  s=resolve(s);
  expect(s.cards[attacker].position).toBe('faceDownDefense');
  expect(s.cards[attacker].faceDown).toBe(true);
  expect(s.pendingAttack).toBeUndefined();
  expect(s.players[0].lp).toBe(8000);
  expect(s.players[1].lp).toBe(8000);
  expect(s.cards[spellId].location).toBe('graveyard');
 });
 it('rejects activating a Quick-Play Spell on the turn it was Set',()=>{
  const {s:initial,attacker,spellId}=setup();
  initial.cards[spellId].setTurn=2;
  const s=dispatchDuel(initial,{type:'DECLARE_ATTACK',seat:0,attackerId:attacker,targetId:initial.players[1].zones.monster[0]!},ctx);
  expect(legalActions(s,ctx,1).some(a=>a.type==='ACTIVATE_BOOK_OF_MOON')).toBe(false);
 });
 it('does not allow targeting a face-down monster',()=>{
  const {s:initial,defender}=setup();
  initial.cards[defender].faceDown=true;
  initial.cards[defender].position='faceDownDefense';
  const s=dispatchDuel(initial,{type:'DECLARE_ATTACK',seat:0,attackerId:initial.players[0].zones.monster[0]!,targetId:defender},ctx);
  expect(legalActions(s,ctx,1).some(a=>a.type==='ACTIVATE_BOOK_OF_MOON'&&a.targetId===defender)).toBe(false);
 });
});
