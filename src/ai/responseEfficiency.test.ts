import {expect,it} from 'vitest';
import json from '../../public/catalog.json';
import type {Card} from '../core/types';
import {CHAOS_TURBO} from '../supportedDecks';
import {createDuel,type LegalAction} from '../engine/model';
import {sensibleActions} from './strategy';
const catalog=json as Card[],ctx={cards:new Map(catalog.map(c=>[c.id,c]))};
function setup(){const s=createDuel(CHAOS_TURBO,CHAOS_TURBO,ctx,42);const target=Object.values(s.cards).find(c=>c.owner===1&&c.cardId===72989439)!.instanceId;return {s,target};}
it('does not duplicate either player’s pending Book on the same target',()=>{for(const controller of [0,1] as const){const {s,target}=setup();s.chain=[{instanceId:'first',controller,effectId:'BOOK_OF_MOON_SET',targets:[target],spellSpeed:2}];const a:LegalAction={type:'ACTIVATE_BOOK_OF_MOON',seat:0,instanceId:'second',zone:0,targetId:target,description:''};expect(sensibleActions(s,[a],0,catalog)).toEqual([]);}});
it('holds a second removal trap but still allows a different target',()=>{const {s,target}=setup();s.chain=[{instanceId:'first',controller:0,effectId:'RAIGEKI_BREAK',targets:[target],spellSpeed:2}];const same:LegalAction={type:'ACTIVATE_DECK_EFFECT',seat:0,instanceId:'second',effectId:'RING',targetId:target,description:''};const other={...same,targetId:'other'};expect(sensibleActions(s,[same,other],0,catalog)).toEqual([other]);});
it('allows follow-up removal after the opponent adds a response',()=>{const {s,target}=setup();s.chain=[{instanceId:'first',controller:0,effectId:'RAIGEKI_BREAK',targets:[target],spellSpeed:2},{instanceId:'response',controller:1,effectId:'BOOK_OF_MOON_SET',targets:[target],spellSpeed:2}];const a:LegalAction={type:'ACTIVATE_DECK_EFFECT',seat:0,instanceId:'second',effectId:'RING',targetId:target,description:''};expect(sensibleActions(s,[a],0,catalog)).toEqual([a]);});
it('never attacks with a zero-ATK Sheep Token, including direct attacks',()=>{const {s,target}=setup();s.cards.sheep={instanceId:'sheep',cardId:73915052,controller:0,owner:0,location:'monster',position:'attack',token:true};const a:LegalAction={type:'DECLARE_ATTACK',seat:0,attackerId:'sheep',description:''};expect(sensibleActions(s,[a,{...a,targetId:target}],0,catalog)).toEqual([]);});
