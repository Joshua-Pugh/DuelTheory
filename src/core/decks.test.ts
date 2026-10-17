import {describe,it,expect} from 'vitest';
import {addCard,additionIssue,emptyDeck,validateDeck} from './decks';
import type {Card,Deck} from './types';
const card=(id:number,name:string,type='Effect Monster',code='LOB-001'):Card=>({id,name,type,desc:'',card_sets:[{set_name:'test',set_code:code}]});
const deck=(main:number[],extra:number[]=[],side:number[]=[]):Deck=>({id:'x',name:'test',main,extra,side});
describe('GOAT validation',()=>{
 it('flags forbidden Dark Hole',()=>{const x=card(1,'Dark Hole','Spell Card');expect(validateDeck(deck(Array(40).fill(1)),new Map([[1,x]])).some(i=>i.message.includes('limit 0'))).toBe(true);});
 it('flags modern synchros',()=>{const x=card(1,'Modern','Synchro Monster');expect(validateDeck(deck(Array(40).fill(1)),new Map([[1,x]])).some(i=>i.message.includes('cannot be'))).toBe(true);});
 it('routes fusion to extra',()=>{const x=card(2,'Fusion','Fusion Monster');expect(addCard(deck([]),x).extra).toEqual([2]);});
 it('blocks synchro addition',()=>expect(addCard(deck([]),card(3,'Modern','Synchro Monster'))).toEqual(deck([])));
});


describe('enforce GOAT copy limits on add',()=>{
  const mk=(id:number,name:string):Card=>({id,name,type:'Effect Monster',desc:''});
  it('blocks forbidden cards',()=>{const c=mk(10,'Dark Hole');const d=emptyDeck();expect(additionIssue(d,c)).toMatch(/forbidden/i);expect(addCard(d,c)).toBe(d);});
  it('blocks second limited copy even across main and side',()=>{const c=mk(11,'Pot of Greed');const d=addCard(emptyDeck(),c);expect(addCard(d,c,'side')).toBe(d);expect(d.main).toEqual([11]);});
  it('allows only two semi-limited copies in total',()=>{const c=mk(12,'Night Assailant');let d=addCard(emptyDeck(),c);d=addCard(d,c,'side');expect(addCard(d,c)).toBe(d);expect(d.main.length+d.side.length).toBe(2);});
  it('caps unrestricted cards at three',()=>{const c=mk(13,'Thunder Dragon');let d=emptyDeck();for(let i=0;i<5;i++)d=addCard(d,c);expect(d.main).toEqual([13,13,13]);});
});
