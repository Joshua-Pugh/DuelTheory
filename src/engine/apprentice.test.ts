import type {LegalAction} from './model';
import {describe,it,expect} from 'vitest';
import type {Card,Deck} from '../core/types';
import {createDuel,toGraveyard,type DuelState} from './model';
import {APPRENTICE_MAGICIAN,dispatchDuel,legalActions} from './rules';
const cards:Card[]=[
 {id:APPRENTICE_MAGICIAN,name:'Apprentice Magician',type:'Effect Monster',race:'Spellcaster',level:2,attribute:'DARK',atk:400,def:800,desc:''},
 {id:31560081,name:'Magician of Faith',type:'Effect Monster',race:'Spellcaster',level:1,attribute:'LIGHT',atk:300,def:400,desc:''},
 {id:71413901,name:'Breaker the Magical Warrior',type:'Effect Monster',race:'Spellcaster',level:4,attribute:'DARK',atk:1600,def:1000,desc:''},
 {id:9901,name:'Wrong Type',type:'Normal Monster',race:'Warrior',level:1,attribute:'LIGHT',atk:100,def:100,desc:''},
 {id:9902,name:'Wrong Level',type:'Normal Monster',race:'Spellcaster',level:3,attribute:'DARK',atk:700,def:100,desc:''},
 {id:9903,name:'Attacker',type:'Normal Monster',race:'Warrior',level:4,attribute:'EARTH',atk:1800,def:1000,desc:''}
];
const isTrigger=(action:LegalAction):action is Extract<LegalAction,{type:'ACTIVATE_TRIGGER'}>=>action.type==='ACTIVATE_TRIGGER';
const ctx={cards:new Map(cards.map(card=>[card.id,card]))};
const deck=(main:number[]):Deck=>({id:'test',name:'Test',main,side:[],extra:[]});
function moveToField(s:DuelState,id:string,seat:0|1,zone:number,position:'attack'|'faceDownDefense'='attack'){
 const c=s.cards[id],p=s.players[seat];const pile=c.location==='hand'?p.hand:p.deck;
 pile.splice(pile.indexOf(id),1);p.zones.monster[zone]=id;
 Object.assign(c,{location:'monster',zone,controller:seat,position,faceDown:position==='faceDownDefense'});
}
function pass(s:DuelState,first:0|1,second:0|1){s=dispatchDuel(s,{type:'PASS_CHAIN',seat:first},ctx);return dispatchDuel(s,{type:'PASS_CHAIN',seat:second},ctx);}
function setup(){const s=createDuel(deck(Array(22).fill(9903)),deck([APPRENTICE_MAGICIAN,31560081,9901,9902,...Array(20).fill(31560081)]),ctx,17);
 const a=Object.keys(s.cards).find(id=>s.cards[id].owner===1&&s.cards[id].cardId===APPRENTICE_MAGICIAN)!;
 moveToField(s,a,1,0);s.current=0;s.turn=2;s.phase='BATTLE';s.pendingDraw=false;return {s,a};}
describe('Apprentice Magician reusable mechanics',()=>{
 it('recruits only Level 2 or lower Spellcasters face-down on battle destruction',()=>{
  let {s,a}=setup();toGraveyard(s,a,'battle');const actions=legalActions(s,ctx,1);
  expect(actions.filter(isTrigger).some(x=>s.cards[x.choiceId!]?.cardId===31560081)).toBe(true);
  expect(actions.filter(isTrigger).some(x=>s.cards[x.choiceId!]?.cardId===9901)).toBe(false);
  expect(actions.filter(isTrigger).some(x=>s.cards[x.choiceId!]?.cardId===9902)).toBe(false);
  const action=actions.filter(isTrigger).find(x=>s.cards[x.choiceId!]?.cardId===31560081)!;
  s=dispatchDuel(s,action,ctx);s=pass(s,0,1);
  expect(s.cards[action.choiceId!].position).toBe('faceDownDefense');expect(s.cards[action.choiceId!].faceDown).toBe(true);
  expect(s.players[1].zones.monster[action.monsterZone!]).toBe(action.choiceId);
 });
 it('does not recruit after effect destruction',()=>{const {s,a}=setup();toGraveyard(s,a,'effect');expect(s.pendingTriggers).toHaveLength(0);});
 it('can decline a battle recruiter',()=>{let {s,a}=setup();toGraveyard(s,a,'battle');const choice=legalActions(s,ctx,1).find(x=>x.type==='DECLINE_PENDING_TRIGGER')!;s=dispatchDuel(s,choice,ctx);expect(s.pendingTriggers).toHaveLength(0);});
 it('places a counter only on a modeled eligible face-up recipient after Normal Summon',()=>{
  let s=createDuel(deck(Array(22).fill(9903)),deck([APPRENTICE_MAGICIAN,71413901,...Array(21).fill(9903)]),ctx,29);
  const breaker=Object.keys(s.cards).find(id=>s.cards[id].owner===1&&s.cards[id].cardId===71413901)!;
  moveToField(s,breaker,1,1);s.current=1;s.turn=2;s.phase='MAIN_1';s.pendingDraw=false;
  const apprentice=Object.keys(s.cards).find(id=>s.cards[id].owner===1&&s.cards[id].cardId===APPRENTICE_MAGICIAN)!;
  if(s.cards[apprentice].location==='deck'){s.players[1].deck.splice(s.players[1].deck.indexOf(apprentice),1);s.players[1].hand.push(apprentice);s.cards[apprentice].location='hand';}
  s=dispatchDuel(s,{type:'NORMAL_SUMMON',seat:1,instanceId:apprentice,zone:0,position:'attack'},ctx);
  const action=legalActions(s,ctx,1).filter(isTrigger).find(x=>x.choiceId===breaker)!;
  expect(action).toBeDefined();s=dispatchDuel(s,action,ctx);s=pass(s,0,1);
  expect(s.cards[breaker].spellCounters).toBe(1);
 });
 it('integrates real battle timing and then resolves the recruiter chain',()=>{
  let {s,a}=setup();const attacker=Object.keys(s.cards).find(id=>s.cards[id].owner===0)!;
  moveToField(s,attacker,0,0);
  s=dispatchDuel(s,{type:'DECLARE_ATTACK',seat:0,attackerId:attacker,targetId:a},ctx);
  s=dispatchDuel(s,{type:'PASS_ATTACK_RESPONSE',seat:1},ctx);
  for(let i=0;i<4;i++){
   const action=legalActions(s,ctx,0).find(x=>x.type==='ADVANCE_DAMAGE_STEP');
   if(!action)break;s=dispatchDuel(s,action,ctx);
  }
  expect(s.cards[a].location).toBe('graveyard');
  expect(s.pendingTriggers?.some(t=>t.effectId==='APPRENTICE_RECRUIT')).toBe(true);
  const summon=legalActions(s,ctx,1).filter(isTrigger).find(x=>s.cards[x.choiceId!]?.cardId===31560081)!;
  s=dispatchDuel(s,summon,ctx);s=pass(s,0,1);
  expect(s.cards[summon.choiceId!].position).toBe('faceDownDefense');
 });
});
