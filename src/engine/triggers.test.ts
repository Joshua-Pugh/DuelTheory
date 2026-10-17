import {describe,it,expect} from 'vitest';
import type {Card,Deck} from '../core/types';
import {createDuel,toGraveyard} from './model';
import {dispatchDuel,legalActions,SANGAN,MAGICIAN_OF_FAITH,DEKOICHI,POT_OF_GREED} from './rules';
const cards:Card[]=[
 {id:SANGAN,name:'Sangan',type:'Effect Monster',level:3,atk:1000,desc:''},
 {id:MAGICIAN_OF_FAITH,name:'Magician of Faith',type:'Flip Effect Monster',level:1,atk:300,desc:''},
 {id:DEKOICHI,name:'Dekoichi',type:'Flip Effect Monster',level:4,atk:1400,desc:''},
 {id:POT_OF_GREED,name:'Pot of Greed',type:'Spell Card',desc:''},
 {id:11,name:'Searchable',type:'Effect Monster',level:3,atk:1400,desc:''},
 {id:12,name:'Too Big',type:'Normal Monster',level:4,atk:1600,desc:''},
];
const ctx={cards:new Map(cards.map(c=>[c.id,c]))};
const deck=(main:number[]):Deck=>({id:'t',name:'t',main,side:[],extra:[]});
function prepare(){let s=createDuel(deck([SANGAN,MAGICIAN_OF_FAITH,DEKOICHI,POT_OF_GREED,11,12,...Array(30).fill(11)]),deck(Array(35).fill(11)),ctx,39);s=dispatchDuel(s,{type:'DRAW_PHASE',seat:0},ctx);s=dispatchDuel(s,{type:'ADVANCE',seat:0},ctx);s=dispatchDuel(s,{type:'ADVANCE',seat:0},ctx);return s;}
function put(s:ReturnType<typeof prepare>,cardId:number,where:'monster'|'graveyard'|'deck',zone=0){const id=Object.keys(s.cards).find(id=>s.cards[id].owner===0&&s.cards[id].cardId===cardId)!;const c=s.cards[id];const p=s.players[0];if(c.location==='hand')p.hand.splice(p.hand.indexOf(id),1);if(c.location==='deck')p.deck.splice(p.deck.indexOf(id),1);if(where==='monster'){p.zones.monster[zone]=id;c.location='monster';c.zone=zone;c.position='faceDownDefense';c.faceDown=true;c.summonedTurn=0;}else if(where==='graveyard'){c.location='graveyard';p.graveyard.push(id);}else {c.location='deck';p.deck.push(id);}return id;}
function resolve(s:ReturnType<typeof prepare>){s=dispatchDuel(s,{type:'PASS_CHAIN',seat:1},ctx);return dispatchDuel(s,{type:'PASS_CHAIN',seat:0},ctx);}
describe('generic triggered effects',()=>{
 it('Sangan only triggers from field, searches ATK <= 1500, and resolves through chain',()=>{let s=prepare();const target=put(s,11,'deck');const big=put(s,12,'deck');const id=put(s,SANGAN,'monster');toGraveyard(s,id);expect(s.pendingTriggers?.[0].effectId).toBe('SANGAN_SEARCH');const actions=legalActions(s,ctx,0);expect(actions.some(a=>a.type==='ACTIVATE_TRIGGER'&&a.choiceId===target)).toBe(true);expect(actions.some(a=>a.type==='ACTIVATE_TRIGGER'&&a.choiceId===big)).toBe(false);s=dispatchDuel(s,actions.find(a=>a.type==='ACTIVATE_TRIGGER'&&a.choiceId===target)!,ctx);s=resolve(s);expect(s.players[0].hand).toContain(target);});
 it('discarding Sangan from hand does not create a trigger',()=>{const s=prepare();const id=Object.keys(s.cards).find(id=>s.cards[id].cardId===SANGAN)!;if(s.cards[id].location==='hand')s.players[0].hand.splice(s.players[0].hand.indexOf(id),1);else s.players[0].deck.splice(s.players[0].deck.indexOf(id),1);toGraveyard(s,id);expect(s.pendingTriggers).toHaveLength(0);});
 it('Magician of Faith recovers a Spell after Flip Summon and chain resolution',()=>{let s=prepare();const spell=put(s,POT_OF_GREED,'graveyard');const id=put(s,MAGICIAN_OF_FAITH,'monster');s=dispatchDuel(s,{type:'FLIP_SUMMON',seat:0,instanceId:id},ctx);expect(s.pendingTriggers?.[0].effectId).toBe('MOF_RECOVER');const action=legalActions(s,ctx,0).find(a=>a.type==='ACTIVATE_TRIGGER'&&a.choiceId===spell)!;s=dispatchDuel(s,action,ctx);s=resolve(s);expect(s.players[0].hand).toContain(spell);expect(s.players[0].graveyard).not.toContain(spell);});
 it('Dekoichi draws one, and a face-down monster cannot flip twice in one turn',()=>{let s=prepare();const id=put(s,DEKOICHI,'monster');const before=s.players[0].hand.length;s=dispatchDuel(s,{type:'FLIP_SUMMON',seat:0,instanceId:id},ctx);expect(legalActions(s,ctx,0).some(a=>a.type==='FLIP_SUMMON')).toBe(false);s=dispatchDuel(s,legalActions(s,ctx,0)[0],ctx);s=resolve(s);expect(s.players[0].hand.length).toBe(before+1);});
});
