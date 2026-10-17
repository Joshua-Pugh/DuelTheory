import {describe,it,expect} from 'vitest';
import type {Card,Deck} from '../core/types';
import {createDuel} from './model';
import {legalActions,dispatchDuel,POT_OF_GREED,MYSTICAL_SPACE_TYPHOON} from './rules';
const cards:Card[]=[{id:POT_OF_GREED,name:'Pot of Greed',type:'Spell Card',desc:'Draw 2 cards.'},{id:MYSTICAL_SPACE_TYPHOON,name:'Mystical Space Typhoon',type:'Spell Card',desc:'Target 1 Spell/Trap; destroy it.'},{id:1,name:'Test',type:'Normal Monster',level:4,desc:''}];
const ctx={cards:new Map(cards.map(c=>[c.id,c]))};
const deck=(ids:number[]):Deck=>({id:'demo',name:'Demo',main:ids,side:[],extra:[]});
const advance=(s:ReturnType<typeof createDuel>)=>{s=dispatchDuel(s,{type:'DRAW_PHASE',seat:0},ctx);s=dispatchDuel(s,{type:'ADVANCE',seat:0},ctx);return dispatchDuel(s,{type:'ADVANCE',seat:0},ctx);};
describe('chain response slice',()=>{
 it('MST destroys a Pot on the chain but does not negate the draw',()=>{
  let s=advance(createDuel(deck([POT_OF_GREED,...Array(29).fill(1)]),deck([MYSTICAL_SPACE_TYPHOON,...Array(29).fill(1)]),ctx,12));
  // Set up specific known hand and keep instance locations consistent using a deterministic search.
  for(let seed=0;seed<2000 && !(s.players[0].hand.some(x=>s.cards[x].cardId===POT_OF_GREED)&&s.players[1].hand.some(x=>s.cards[x].cardId===MYSTICAL_SPACE_TYPHOON));seed++)s=advance(createDuel(deck([POT_OF_GREED,...Array(29).fill(1)]),deck([MYSTICAL_SPACE_TYPHOON,...Array(29).fill(1)]),ctx,seed));
  // Fixture: opponent's MST was legally set on an earlier turn.
  const mstId=s.players[1].hand.find(x=>s.cards[x].cardId===MYSTICAL_SPACE_TYPHOON)!;
  s.players[1].hand=s.players[1].hand.filter(x=>x!==mstId);s.players[1].zones.spell[0]=mstId;
  Object.assign(s.cards[mstId],{location:'spell',zone:0,faceDown:true,setTurn:0});
  const pot=legalActions(s,ctx,0).find(x=>x.type==='ACTIVATE_POT_OF_GREED');expect(pot).toBeDefined();const hand=s.players[0].hand.length;
  s=dispatchDuel(s,pot!,ctx);expect(s.players[0].hand.length).toBe(hand-1);expect(legalActions(s,ctx,0)).toHaveLength(0);
  const mst=legalActions(s,ctx,1).find(x=>x.type==='ACTIVATE_MST');expect(mst).toBeDefined();s=dispatchDuel(s,mst!,ctx);
  s=dispatchDuel(s,{type:'PASS_CHAIN',seat:0},ctx);s=dispatchDuel(s,{type:'PASS_CHAIN',seat:1},ctx);
  expect(s.chain).toHaveLength(0);expect(s.players[0].hand.length).toBe(hand+1); // Pot leaves hand (-1), then draws 2 (+2).
  expect(s.events.some(e=>e.type==='RESOLVE' && e.message.includes('Pot of Greed draws two cards'))).toBe(true);expect(s.players[0].graveyard).toContain(pot!.instanceId);expect(s.players[1].graveyard).toContain(mst!.instanceId);
 });
 it('rejects an attempt to chain Spell Speed 1 Pot of Greed',()=>{let s=advance(createDuel(deck(Array(20).fill(POT_OF_GREED)),deck(Array(20).fill(POT_OF_GREED)),ctx,4));const pot=legalActions(s,ctx,0).find(x=>x.type==='ACTIVATE_POT_OF_GREED')!;s=dispatchDuel(s,pot,ctx);expect(legalActions(s,ctx,1).some(a=>a.type==='ACTIVATE_POT_OF_GREED')).toBe(false);});
 it('requires both players to pass before resolving',()=>{let s=advance(createDuel(deck(Array(20).fill(POT_OF_GREED)),deck(Array(20).fill(1)),ctx,3));s=dispatchDuel(s,legalActions(s,ctx,0).find(a=>a.type==='ACTIVATE_POT_OF_GREED')!,ctx);s=dispatchDuel(s,{type:'PASS_CHAIN',seat:1},ctx);expect(s.chain.length).toBe(1);expect(()=>dispatchDuel(s,{type:'RESOLVE_CHAIN',seat:1},ctx)).toThrow();s=dispatchDuel(s,{type:'RESOLVE_CHAIN',seat:0},ctx);expect(s.chain.length).toBe(0);});
});
