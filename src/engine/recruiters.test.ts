import type {LegalAction} from './model';
import {describe,it,expect} from 'vitest';
import type {Card,Deck} from '../core/types';
import {createDuel,toGraveyard} from './model';
import {dispatchDuel,legalActions,SHINING_ANGEL,MYSTIC_TOMATO} from './rules';
const card=(id:number,name:string,attribute:string,atk:number):Card=>({id,name,type:'Effect Monster',attribute,level:4,atk,def:1000,desc:''});
const catalog=[card(SHINING_ANGEL,'Shining Angel','LIGHT',1400),card(MYSTIC_TOMATO,'Mystic Tomato','DARK',1400),card(8001,'Eligible LIGHT','LIGHT',1300),card(8002,'Ineligible DARK','DARK',1300),card(8003,'Too strong LIGHT','LIGHT',1700),card(8004,'Filler','EARTH',1800)];
const isTrigger=(action:LegalAction):action is Extract<LegalAction,{type:'ACTIVATE_TRIGGER'}>=>action.type==='ACTIVATE_TRIGGER';
const ctx={cards:new Map(catalog.map(c=>[c.id,c]))};
const deck=(main:number[]):Deck=>({id:'recruit',name:'recruit',main,side:[],extra:[]});
function setup(){const s=createDuel(deck(Array(20).fill(8004)),deck([SHINING_ANGEL,8001,8002,8003,...Array(20).fill(8001)]),ctx,19);const id=Object.keys(s.cards).find(k=>s.cards[k].owner===1&&s.cards[k].cardId===SHINING_ANGEL)!;const c=s.cards[id],p=s.players[1];const src=c.location==='hand'?p.hand:p.deck;src.splice(src.indexOf(id),1);Object.assign(c,{location:'monster',controller:1,zone:0,position:'attack',faceDown:false});p.zones.monster[0]=id;s.turn=2;s.current=0;s.phase='BATTLE';s.pendingDraw=false;return {s,id};}
describe('shared battle recruiter: Shining Angel',()=>{
 it('only triggers when destroyed by battle from monster zone',()=>{const {s,id}=setup();toGraveyard(s,id,'effect');expect(s.pendingTriggers).toHaveLength(0);});
 it('offers LIGHT monsters with at most 1500 ATK and a decline action',()=>{const {s,id}=setup();toGraveyard(s,id,'battle');const actions=legalActions(s,ctx,1);expect(actions.some(a=>a.type==='DECLINE_PENDING_TRIGGER')).toBe(true);expect(actions.filter(isTrigger).some(a=>s.cards[a.choiceId!]?.cardId===8001)).toBe(true);expect(actions.filter(isTrigger).some(a=>s.cards[a.choiceId!]?.cardId===8002)).toBe(false);expect(actions.filter(isTrigger).some(a=>s.cards[a.choiceId!]?.cardId===8003)).toBe(false);});
 it('can summon to an empty zone using the existing chain resolver',()=>{let {s,id}=setup();toGraveyard(s,id,'battle');const action=legalActions(s,ctx,1).filter(isTrigger).find(a=>s.cards[a.choiceId!]?.cardId===8001)!;s=dispatchDuel(s,action,ctx);s=dispatchDuel(s,{type:'PASS_CHAIN',seat:0},ctx);s=dispatchDuel(s,{type:'PASS_CHAIN',seat:1},ctx);expect(s.cards[action.choiceId!].location).toBe('monster');expect(s.players[1].zones.monster[action.monsterZone!]).toBe(action.choiceId);});
 it('permits declining with no summon targets and all zones full',()=>{let {s,id}=setup();toGraveyard(s,id,'battle');s.players[1].deck=s.players[1].deck.filter(id=>s.cards[id].cardId!==8001);const actions=legalActions(s,ctx,1);expect(actions.map(a=>a.type)).toEqual(['DECLINE_PENDING_TRIGGER']);s=dispatchDuel(s,actions[0],ctx);expect(s.pendingTriggers).toHaveLength(0);});
});
