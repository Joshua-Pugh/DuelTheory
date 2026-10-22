import {expect,it} from 'vitest';
import {seededShuffle} from '../framework/random';
import {CHAOS_TURBO} from '../supportedDecks';
import json from '../../public/catalog.json';import type {Card} from '../core/types';import {createDuel} from './model';
it('shuffles the same way for either starting player without changing the registered deck',()=>{
 const cards=new Map((json as Card[]).map(c=>[c.id,c])),ctx={cards},a=createDuel(CHAOS_TURBO,CHAOS_TURBO,ctx,42,0),b=createDuel(CHAOS_TURBO,CHAOS_TURBO,ctx,42,1);
 for(const seat of [0,1] as const){expect(a.players[seat].hand).toEqual(b.players[seat].hand);expect(a.players[seat].deck).toEqual(b.players[seat].deck);expect([...a.players[seat].hand,...a.players[seat].deck].map(id=>a.cards[id].cardId).sort()).toEqual([...CHAOS_TURBO.main].sort());}
});
it('keeps both seats opening draw-spell, Thunder Dragon and duplicate-adjacency rates near their combinatorial expectations',()=>{
 const count=20000;
 for(const seat of [0,1]){let power=0,thunder=0,both=0,pairs=0;for(let i=0;i<count;i++){const seed=Math.imul(i+1,0x9e3779b1)>>>0,deck=seededShuffle(CHAOS_TURBO.main,seed+seat*7919),hand=deck.slice(0,6),p=hand.some(id=>id===55144522||id===79571449),t=hand.includes(31786629);power+=Number(p);thunder+=Number(t);both+=Number(p&&t);for(let j=1;j<deck.length;j++)pairs+=Number(deck[j]===deck[j-1]);}
  expect(Math.abs(power/count-.280769)).toBeLessThan(.015);expect(Math.abs(thunder/count-.394332)).toBeLessThan(.015);expect(Math.abs(both/count-.097978)).toBeLessThan(.015);expect(Math.abs(pairs/count-1.05)).toBeLessThan(.1);
 }
});
