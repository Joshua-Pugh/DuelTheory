import {describe,it,expect} from 'vitest';
import {sortDeckSection} from './deckSort';
import type {Card} from './types';
const cards:Card[]=[
 {id:1,name:'Level 4 Strong',type:'Effect Monster',desc:'',level:4,atk:1900},
 {id:2,name:'Level 8',type:'Effect Monster',desc:'',level:8,atk:1200},
 {id:3,name:'Level 4 Weak',type:'Normal Monster',desc:'',level:4,atk:1000},
 {id:4,name:'Book of Moon',type:'Spell Card',desc:''},
 {id:5,name:'Heavy Storm',type:'Spell Card',desc:''},
 {id:6,name:'Mystical Space Typhoon',type:'Spell Card',desc:''}
];
const lookup=new Map(cards.map(c=>[c.id,c]));
describe('deck grid visual sort',()=>{
 it('orders monsters by descending level then descending ATK',()=>{
  expect(sortDeckSection([3,1,2],lookup,'Monster')).toEqual([2,1,3]);
 });
 it('groups spells by descending copies then card name',()=>{
  expect(sortDeckSection([5,4,6,4,6,4],lookup,'Spell')).toEqual([4,4,4,6,6,5]);
 });
 it('does not mutate the source list',()=>{
  const input=[3,1,2];sortDeckSection(input,lookup,'Monster');expect(input).toEqual([3,1,2]);
 });
});
