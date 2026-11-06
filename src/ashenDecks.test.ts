import {describe,it,expect} from 'vitest';
import {starterDeck,inspectAshenDeck,changeAshenQuantity,deckCount,ashenCardMap} from './ashenDecks';
describe('Ashen Throne prototype deck rules',()=>{
 it('loads complete 60-card source decks with the confirmed category totals',()=>{
  for(const faction of ['Brute','Noble'] as const){
   const deck=starterDeck(faction);
   expect(deckCount(deck)).toBe(60);
   expect(inspectAshenDeck(deck).valid).toBe(true);
   const expected=faction==='Brute' ? {"Unit":25,"Rune":2,"Relic":3,"Strategy":3,"Tactic":7,"Ley Font":20} : {"Unit":24,"Rune":3,"Relic":2,"Strategy":4,"Tactic":5,"Ley Font":22};
   const actual:Record<string,number>={};
   for(const entry of deck.entries){
    const card=ashenCardMap.get(entry.cardId);
    expect(card).toBeDefined();
    const type=card!.type;
    actual[type]=(actual[type]||0)+entry.count;
   }
   expect(actual).toEqual(expected);
  }
 });
 it('cannot place Command Station into main deck or mix factions',()=>{
  const d=starterDeck('Brute');
  expect(changeAshenQuantity(d,d.commandStationId,1)).toBe(d);
  expect(changeAshenQuantity(d,'ashen-noble-court-scribe',1)).toBe(d);
 });
 it('prevents exceeding sixty cards without guessing undocumented copy limits',()=>{
  let d=starterDeck('Brute');
  expect(deckCount(d)).toBe(60);
  expect(changeAshenQuantity(d,'ashen-brute-frenzied-grunt',1)).toBe(d);
  d=changeAshenQuantity(d,'ashen-brute-frenzied-grunt',-1);
  expect(deckCount(d)).toBe(59);
  d=changeAshenQuantity(d,'ashen-brute-frenzied-grunt',1);
  expect(deckCount(d)).toBe(60);
 });
});
