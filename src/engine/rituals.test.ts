import {describe,it,expect} from 'vitest';
import type {Card,Deck} from '../core/types';
import {createDuel,materialCombinations} from './model';
import type {LegalAction} from './model';
import {dispatchDuel,legalActions,CONTRACT_WITH_THE_ABYSS,THUNDER_DRAGON} from './rules';
import {CONTRACT_WITH_THE_DARK_MASTER,SHINATOS_ARK,DARK_MASTER_ZORC,SHINATO} from './rituals';
const catalog:Card[]=[
 {id:THUNDER_DRAGON,name:'Thunder Dragon',type:'Effect Monster',level:5,attribute:'LIGHT',desc:''},
 {id:DARK_MASTER_ZORC,name:'Dark Master - Zorc',type:'Ritual Effect Monster',level:8,attribute:'DARK',desc:''},
 {id:SHINATO,name:'Shinato, King of a Higher Plane',type:'Ritual Effect Monster',level:8,attribute:'LIGHT',desc:''},
 {id:CONTRACT_WITH_THE_DARK_MASTER,name:'Contract with the Dark Master',type:'Spell Card',race:'Ritual',desc:''},
 {id:SHINATOS_ARK,name:"Shinato's Ark",type:'Spell Card',race:'Ritual',desc:''},
 {id:CONTRACT_WITH_THE_ABYSS,name:'Contract with the Abyss',type:'Spell Card',race:'Ritual',desc:''},
];
const ctx={cards:new Map(catalog.map(c=>[c.id,c]))};
const deck=(main:number[]):Deck=>({id:'test',name:'test',main,side:[],extra:[]});
function setup(){let s=createDuel(deck([THUNDER_DRAGON,THUNDER_DRAGON,DARK_MASTER_ZORC,SHINATO,CONTRACT_WITH_THE_DARK_MASTER,SHINATOS_ARK,CONTRACT_WITH_THE_ABYSS,...Array(12).fill(THUNDER_DRAGON)]),deck(Array(12).fill(THUNDER_DRAGON)),ctx,5);
 for(const id of Object.keys(s.cards).filter(id=>s.cards[id].owner===0)){
   if(s.cards[id].location==='hand'){s.players[0].hand=s.players[0].hand.filter(x=>x!==id);s.players[0].deck.push(id);s.cards[id].location='deck';}
 }
 const needed=[THUNDER_DRAGON,THUNDER_DRAGON,DARK_MASTER_ZORC,SHINATO,CONTRACT_WITH_THE_DARK_MASTER,SHINATOS_ARK,CONTRACT_WITH_THE_ABYSS];
 for(const cardId of needed){const id=s.players[0].deck.find(x=>s.cards[x].cardId===cardId)!;s.players[0].deck=s.players[0].deck.filter(x=>x!==id);s.players[0].hand.push(id);s.cards[id].location='hand';}
 s=dispatchDuel(s,{type:'DRAW_PHASE',seat:0},ctx);s=dispatchDuel(s,{type:'ADVANCE',seat:0},ctx);s=dispatchDuel(s,{type:'ADVANCE',seat:0},ctx);return s;
}
describe('data-driven Ritual summoning',()=>{
 it('accepts two Level 5 Thunder Dragons for Zorc with Dark Master contract',()=>{
   let s=setup();const option=legalActions(s,ctx,0).find(a=>a.type==='ACTIVATE_CONTRACT'&&s.cards[a.instanceId].cardId===CONTRACT_WITH_THE_DARK_MASTER&&s.cards[a.ritualId].cardId===DARK_MASTER_ZORC&&a.materials.length===2&&a.materials.every(id=>s.cards[id].cardId===THUNDER_DRAGON));expect(option).toBeDefined();
   s=dispatchDuel(s,option!,ctx);s=dispatchDuel(s,{type:'PASS_CHAIN',seat:1},ctx);s=dispatchDuel(s,{type:'PASS_CHAIN',seat:0},ctx);expect(s.events.some(e=>e.type==='RITUAL_SUMMON'&&e.message.includes('Contract with the Dark Master'))).toBe(true);
 });
 it('supports Shinato Ark, rejects cross-summoning with wrong Ritual Spell',()=>{
   const s=setup();const actions=legalActions(s,ctx,0).filter(a=>a.type==='ACTIVATE_CONTRACT');
   expect(actions.some(a=>s.cards[a.instanceId].cardId===SHINATOS_ARK&&s.cards[a.ritualId].cardId===SHINATO&&a.materials.length===2)).toBe(true);
   expect(actions.some(a=>s.cards[a.instanceId].cardId===SHINATOS_ARK&&s.cards[a.ritualId].cardId===DARK_MASTER_ZORC)).toBe(false);
   expect(actions.some(a=>s.cards[a.instanceId].cardId===CONTRACT_WITH_THE_DARK_MASTER&&s.cards[a.ritualId].cardId===SHINATO)).toBe(false);
 });
 it('still rejects excess Levels for Contract with the Abyss',()=>{
   const s=setup();const options=legalActions(s,ctx,0).filter((a):a is Extract<LegalAction,{type:'ACTIVATE_CONTRACT'}>=>a.type==='ACTIVATE_CONTRACT').filter(a=>s.cards[a.instanceId].cardId===CONTRACT_WITH_THE_ABYSS);
   expect(options.some(a=>a.materials.length===2&&a.materials.every(id=>s.cards[id].cardId===THUNDER_DRAGON))).toBe(false);
   const exact=materialCombinations(s,ctx,0,8,[],'EXACT');expect(exact.every(combo=>combo.reduce((n,id)=>n+Number(ctx.cards.get(s.cards[id].cardId)?.level),0)===8)).toBe(true);
 });
});
