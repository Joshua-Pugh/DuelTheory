import {describe,it,expect} from 'vitest';
import type {Card,Deck} from '../core/types';
import {createDuel,materialCombinations} from './model';
import {dispatchDuel,legalActions,CONTRACT_WITH_THE_ABYSS} from './rules';
const cards:Card[]=[
{id:1,name:'Level Four',type:'Normal Monster',level:4,attribute:'LIGHT',desc:''},
{id:2,name:'Level Eight Tribute',type:'Normal Monster',level:8,attribute:'DARK',desc:''},
{id:3,name:'Dark Master - Zorc',type:'Ritual Effect Monster',level:8,attribute:'DARK',desc:''},
{id:4,name:'Level Three',type:'Normal Monster',level:3,desc:''},
{id:CONTRACT_WITH_THE_ABYSS,name:'Contract with the Abyss',type:'Spell Card',race:'Ritual',desc:''}
];
const ctx={cards:new Map(cards.map(c=>[c.id,c]))};
const deck=(main:number[]):Deck=>({id:'test',name:'test',main,side:[],extra:[]});
const goMain=(s:ReturnType<typeof createDuel>)=>{s=dispatchDuel(s,{type:'DRAW_PHASE',seat:0},ctx);s=dispatchDuel(s,{type:'ADVANCE',seat:0},ctx);return dispatchDuel(s,{type:'ADVANCE',seat:0},ctx);};
const seeded=(main:number[])=>goMain(createDuel(deck(main),deck(Array(12).fill(1)),ctx,11));
describe('summoning engine',()=>{
 it('rejects free level eight summons',()=>{const s=seeded([2,...Array(12).fill(1)]);expect(legalActions(s,ctx,0).filter(a=>a.type==='NORMAL_SUMMON').every(a=>s.cards[a.instanceId].cardId!==2)).toBe(true);});
 it('generates exact-level ritual material combinations and excludes target ritual',()=>{const s=seeded([3,CONTRACT_WITH_THE_ABYSS,1,1,4, ...Array(10).fill(1)]);const ritualId=Object.keys(s.cards).find(id=>s.cards[id].cardId===3)!; // Move required fixtures to hand for deterministic structural test
 for(const id of Object.keys(s.cards).filter(id=>s.cards[id].owner===0&&[1,3,4,CONTRACT_WITH_THE_ABYSS].includes(s.cards[id].cardId))){if(s.cards[id].location==='deck'){s.players[0].deck=s.players[0].deck.filter(x=>x!==id);s.players[0].hand.push(id);s.cards[id].location='hand';}}
 const combos=materialCombinations(s,ctx,0,8,[ritualId]);expect(combos.some(combo=>combo.length===2&&combo.every(id=>s.cards[id].cardId===1))).toBe(true);expect(combos.every(combo=>combo.reduce((n,id)=>n+Number(ctx.cards.get(s.cards[id].cardId)?.level),0)===8)).toBe(true);
 });
 it('resolves Contract with exact materials and places ritual monster on board',()=>{let s=seeded([3,CONTRACT_WITH_THE_ABYSS,1,1,...Array(12).fill(4)]);for(const id of Object.keys(s.cards).filter(id=>s.cards[id].owner===0&&[3,CONTRACT_WITH_THE_ABYSS,1].includes(s.cards[id].cardId))){if(s.cards[id].location==='deck'){s.players[0].deck=s.players[0].deck.filter(x=>x!==id);s.players[0].hand.push(id);s.cards[id].location='hand';}}
 const option=legalActions(s,ctx,0).find(a=>a.type==='ACTIVATE_CONTRACT');expect(option).toBeDefined();s=dispatchDuel(s,option!,ctx);s=dispatchDuel(s,{type:'PASS_CHAIN',seat:1},ctx);s=dispatchDuel(s,{type:'PASS_CHAIN',seat:0},ctx);expect(s.events.some(e=>e.type==='RITUAL_SUMMON')).toBe(true);expect(s.players[0].zones.monster.some(id=>id!==null&&s.cards[id].cardId===3)).toBe(true);expect(s.players[0].graveyard.filter(id=>s.cards[id].cardId===1)).toHaveLength(2);
 });
});
