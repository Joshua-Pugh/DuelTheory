import {describe,it,expect} from 'vitest';
import {sampleOpeningHands} from './simulation';
import {copyLimit} from '../data/goat';
import type {Deck} from './types';
const deck:Deck={id:'demo',name:'Demo',main:[...Array(20).fill(1),...Array(20).fill(2)],side:[],extra:[]};
describe('opening hands',()=>{
 it('is deterministic for a given seed',()=>{const a=sampleOpeningHands(deck,1000,5,42),b=sampleOpeningHands(deck,1000,5,42);expect(a.sampleHand).toEqual(b.sampleHand);expect(a.duplicateHandsPercent).toBe(b.duplicateHandsPercent)});
 it('calculates valid event probabilities',()=>{const r=sampleOpeningHands(deck,1000);expect(r.probabilityAtLeastOne([1,2])).toBe(100);expect(r.probabilityAtLeastOne([3])).toBe(0)});
});
describe('GOAT banlist',()=>{it('enforces historical copy limits',()=>{expect(copyLimit('Dark Hole')).toBe(0);expect(copyLimit('Pot of Greed')).toBe(1);expect(copyLimit('Night Assailant')).toBe(2);expect(copyLimit('Thunder Dragon')).toBe(3)})});
