import {describe,it,expect} from 'vitest';
import type {Card,Deck} from '../core/types';
import {createDuel} from './model';
import {dispatchDuel,legalActions,MANJU,SENJU,THUNDER_DRAGON,CONTRACT_WITH_THE_ABYSS} from './rules';
const cards:Card[]=[
 {id:MANJU,name:'Manju',type:'Effect Monster',level:4,desc:''},
 {id:SENJU,name:'Senju',type:'Effect Monster',level:4,desc:''},
 {id:THUNDER_DRAGON,name:'Thunder Dragon',type:'Effect Monster',level:5,desc:''},
 {id:CONTRACT_WITH_THE_ABYSS,name:'Contract',type:'Spell Card',race:'Ritual',desc:''},
 {id:500,name:'Ritual Target',type:'Ritual Effect Monster',level:8,desc:''},
 {id:600,name:'Filler',type:'Normal Monster',level:4,desc:''},
];
const ctx={cards:new Map(cards.map(c=>[c.id,c]))};
const deck=(main:number[]):Deck=>({id:'t',name:'test',main,side:[],extra:[]});
function prepare(ids:number[]){let s=createDuel(deck([...ids,...Array(25).fill(600)]),deck(Array(30).fill(600)),ctx,17);s=dispatchDuel(s,{type:'DRAW_PHASE',seat:0},ctx);s=dispatchDuel(s,{type:'ADVANCE',seat:0},ctx);s=dispatchDuel(s,{type:'ADVANCE',seat:0},ctx);return s;}
function bringToHand(s:ReturnType<typeof prepare>,cardId:number){const id=Object.keys(s.cards).find(id=>s.cards[id].owner===0&&s.cards[id].cardId===cardId)!;if(s.cards[id].location==='deck'){s.players[0].deck=s.players[0].deck.filter(x=>x!==id);s.players[0].hand.push(id);s.cards[id].location='hand';}return id;}
function returnToDeck(s:ReturnType<typeof prepare>,cardId:number){const id=Object.keys(s.cards).find(id=>s.cards[id].owner===0&&s.cards[id].cardId===cardId)!;if(s.cards[id].location==='hand'){s.players[0].hand=s.players[0].hand.filter(x=>x!==id);s.players[0].deck.push(id);s.cards[id].location='deck';}return id;}
function resolve(s:ReturnType<typeof prepare>){s=dispatchDuel(s,{type:'PASS_CHAIN',seat:1},ctx);return dispatchDuel(s,{type:'PASS_CHAIN',seat:0},ctx);}
describe('search effects',()=>{
 it('Manju searches Ritual Spell as a chain-resolving optional trigger',()=>{let s=prepare([MANJU,CONTRACT_WITH_THE_ABYSS,500]);const id=bringToHand(s,MANJU), spell=returnToDeck(s,CONTRACT_WITH_THE_ABYSS);const summon=legalActions(s,ctx,0).find(a=>a.type==='NORMAL_SUMMON'&&a.instanceId===id&&a.position==='attack')!;s=dispatchDuel(s,summon,ctx);expect(s.pendingSearch?.kind).toBe('RITUAL_ANY');const effect=legalActions(s,ctx,0).find(a=>a.type==='TRIGGER_SEARCH'&&a.searchId===spell)!;s=dispatchDuel(s,effect,ctx);expect(s.players[0].hand).not.toContain(spell);s=resolve(s);expect(s.players[0].hand).toContain(spell);expect(s.players[0].deck).not.toContain(spell);});
 it('Senju cannot search a Ritual Spell',()=>{let s=prepare([SENJU,CONTRACT_WITH_THE_ABYSS,500]);const id=bringToHand(s,SENJU), spell=returnToDeck(s,CONTRACT_WITH_THE_ABYSS);s=dispatchDuel(s,legalActions(s,ctx,0).find(a=>a.type==='NORMAL_SUMMON'&&a.instanceId===id&&a.position==='attack')!,ctx);expect(legalActions(s,ctx,0).some(a=>a.type==='TRIGGER_SEARCH'&&a.searchId===spell)).toBe(false);expect(legalActions(s,ctx,0).some(a=>a.type==='TRIGGER_SEARCH')).toBe(true);});
 it('Thunder Dragon discards as cost and searches remaining copies',()=>{let s=prepare([THUNDER_DRAGON,THUNDER_DRAGON,THUNDER_DRAGON]);const copies=Object.keys(s.cards).filter(id=>s.cards[id].owner===0&&s.cards[id].cardId===THUNDER_DRAGON);const first=bringToHand(s,THUNDER_DRAGON);for(const id of copies.filter(id=>id!==first)){if(s.cards[id].location==='hand'){s.players[0].hand=s.players[0].hand.filter(x=>x!==id);s.players[0].deck.push(id);s.cards[id].location='deck';}}const action=legalActions(s,ctx,0).find(a=>a.type==='ACTIVATE_THUNDER_DRAGON'&&a.instanceId===first&&a.searchIds.length===2)!;s=dispatchDuel(s,action,ctx);expect(s.players[0].graveyard).toContain(first);expect(s.players[0].hand).not.toContain(first);s=resolve(s);expect(copies.filter(id=>s.players[0].hand.includes(id))).toHaveLength(2);});
});
