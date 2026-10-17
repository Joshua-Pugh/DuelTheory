import {describe,it,expect} from 'vitest';
import {GOAT_BASELINE,analyzeQuality,evaluateHand,inferRoles} from './intelligence';
import type {Card,Deck} from './types';
const card=(id:number,name:string,type='Effect Monster'):Card=>({id,name,type,desc:''});
const catalog=new Map([[1,card(1,'Manju of the Ten Thousand Hands')],[2,card(2,'The Masked Beast')],[3,card(3,'Book of Moon','Quick-Play Spell')]]);
const deck:Deck={id:'test',name:'Test',main:[1,1,1,2,2,2,3,3,3,3],side:[],extra:[]};
describe('deck coach baseline',()=>{
 it('classifies known ritual fodder as a conditional card',()=>expect(inferRoles(catalog.get(2)!)).toContain('dead'));
 it('recognizes missing starter as a named reason',()=>expect(evaluateHand([2,2,3,3,3],{2:['payoff','dead'],3:['defense']},GOAT_BASELINE).reasons).toContain('Insufficient starters'));
 it('returns identical seeded reports',()=>{const a=analyzeQuality(deck,catalog,{},GOAT_BASELINE,500,123);expect(analyzeQuality(deck,catalog,{},GOAT_BASELINE,500,123)).toEqual(a);expect(a.brickPercent).toBeGreaterThanOrEqual(0);expect(a.brickPercent).toBeLessThanOrEqual(100);});
});
