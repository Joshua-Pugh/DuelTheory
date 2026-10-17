import type {LegalAction} from './model';
import {describe,it,expect} from 'vitest';
import type {Card,Deck} from '../core/types';
import {createDuel,toGraveyard,type DuelState} from './model';
import {dispatchDuel,legalActions,MYSTIC_TOMATO,SANGAN} from './rules';
const cards:Card[]=[
 {id:MYSTIC_TOMATO,name:'Mystic Tomato',type:'Effect Monster',attribute:'DARK',level:4,atk:1400,def:1100,desc:''},
 {id:SANGAN,name:'Sangan',type:'Effect Monster',attribute:'DARK',level:3,atk:1000,def:600,desc:''},
 {id:701,name:'DARK search target',type:'Normal Monster',attribute:'DARK',level:4,atk:1300,def:900,desc:''},
 {id:702,name:'LIGHT target',type:'Normal Monster',attribute:'LIGHT',level:4,atk:1200,def:900,desc:''},
 {id:703,name:'Too strong',type:'Normal Monster',attribute:'DARK',level:4,atk:1700,def:900,desc:''},
 {id:704,name:'Attacker',type:'Normal Monster',attribute:'EARTH',level:4,atk:1900,def:900,desc:''},
];
const isTrigger=(action:LegalAction):action is Extract<LegalAction,{type:'ACTIVATE_TRIGGER'}>=>action.type==='ACTIVATE_TRIGGER';
const ctx={cards:new Map(cards.map(c=>[c.id,c]))};
const deck=(main:number[]):Deck=>({id:'optional',name:'optional',main,side:[],extra:[]});
function setup(){const s=createDuel(deck(Array(30).fill(704)),deck([MYSTIC_TOMATO,SANGAN,701,702,703,...Array(30).fill(701)]),ctx,43);
 const id=Object.keys(s.cards).find(k=>s.cards[k].owner===1&&s.cards[k].cardId===MYSTIC_TOMATO)!;
 const c=s.cards[id],p=s.players[1];p[c.location==='hand'?'hand':'deck'].splice(p[c.location==='hand'?'hand':'deck'].indexOf(id),1);
 Object.assign(c,{location:'monster',controller:1,zone:0,position:'attack',faceDown:false});p.zones.monster[0]=id;
 s.turn=2;s.current=0;s.phase='BATTLE';s.pendingDraw=false;return {s,id};}
function passChain(s:DuelState){s=dispatchDuel(s,{type:'PASS_CHAIN',seat:0},ctx);return dispatchDuel(s,{type:'PASS_CHAIN',seat:1},ctx);}
describe('optional battle trigger: Mystic Tomato',()=>{
 it('does not trigger on non-battle destruction',()=>{const {s,id}=setup();toGraveyard(s,id);expect(s.pendingTriggers).toHaveLength(0);});
 it('allows owner to decline an optional effect',()=>{let {s,id}=setup();toGraveyard(s,id,'battle');const decline=legalActions(s,ctx,1).find(a=>a.type==='DECLINE_PENDING_TRIGGER');expect(decline).toBeDefined();s=dispatchDuel(s,decline!,ctx);expect(s.pendingTriggers).toHaveLength(0);});
 it('filters candidates, resolves to a free zone and shuffles',()=>{let {s,id}=setup();toGraveyard(s,id,'battle');const actions=legalActions(s,ctx,1);expect(actions.filter(isTrigger).some(a=>s.cards[a.choiceId!]?.cardId===701)).toBe(true);expect(actions.filter(isTrigger).some(a=>s.cards[a.choiceId!]?.cardId===702)).toBe(false);expect(actions.filter(isTrigger).some(a=>s.cards[a.choiceId!]?.cardId===703)).toBe(false);
 const action=actions.filter(isTrigger).find(a=>s.cards[a.choiceId!]?.cardId===701)!;s=dispatchDuel(s,action,ctx);s=passChain(s);expect(s.cards[action.choiceId!].location).toBe('monster');expect(s.cards[action.choiceId!].position).toBe('attack');expect(s.players[1].zones.monster[action.monsterZone!]).toBe(action.choiceId);});
 it('places mandatory triggers ahead of optional triggers',()=>{const {s,id}=setup();toGraveyard(s,id,'battle');s.pendingTriggers!.push({sourceId:'mandatory-test',controller:1,effectId:'SANGAN_SEARCH',mandatory:true});expect(legalActions(s,ctx,1).filter(isTrigger).some(a=>a.sourceId===id)).toBe(false);});
});
