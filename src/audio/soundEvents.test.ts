import {describe,it,expect} from 'vitest';
import {duelSounds} from './soundEvents';
import {normalizeAudio} from './SoundManager';
import {createDuel,type DuelState} from '../engine/model';
import {CHAOS_TURBO} from '../supportedDecks';
import json from '../../public/catalog.json';
import type {Card} from '../core/types';
const catalog=json as Card[];
const setup=()=>createDuel(CHAOS_TURBO,CHAOS_TURBO,{cards:new Map(catalog.map(c=>[c.id,c]))},42);
function append(s:DuelState,type:string,message=''){const n=structuredClone(s);n.events.push({type,message,turn:s.turn,seat:0});return n;}
describe('confirmed duel sounds',()=>{
 it('does not replay initial history, rerenders or polling snapshots',()=>{const s=setup();expect(duelSounds(null,s)).toEqual([]);expect(duelSounds(s,structuredClone(s))).toEqual([]);});
 it('ignores undo and history branches',()=>{const s=setup(),n=append(s,'DRAW');expect(duelSounds(n,s)).toEqual([]);const branch=structuredClone(n);branch.events[0].type='OTHER';branch.events.push({type:'DRAW',message:'',turn:1,seat:0});expect(duelSounds(n,branch)).toEqual([]);});
 it('coalesces draw effects and excludes skipped opening draw',()=>{const s=setup(),n=append(append(s,'DRAW'),'DRAW');expect(duelSounds(s,n).map(c=>c.event)).toEqual(['draw']);expect(duelSounds(s,append(s,'DRAW_SKIPPED'))).toEqual([]);});
 it('separates summons, sets, flips and attacks',()=>{const s=setup();for(const [type,event,message] of [['NORMAL_SUMMON','place','summoned'],['NORMAL_SUMMON','set','monster set'],['SPECIAL_SUMMON','special',''],['BATTLE_FLIP','flip',''],['ATTACK_DECLARE','attack','']])expect(duelSounds(s,append(s,type,message))[0].event).toBe(event);});
 it('uses public card type, not quick-play speed, for activation sounds',()=>{const s=setup(),n=append(s,'ACTIVATE');const id=Object.keys(n.cards)[0];n.cards[id].location='spell';n.cards[id].cardId=5318639;n.chain=[{instanceId:id,controller:0,effectId:'MST_DESTROY',targets:[],spellSpeed:2}];expect(duelSounds(s,n,0,catalog)[0].event).toBe('spell');n.cards[id].cardId=44095762;expect(duelSounds(s,n,0,catalog)[0].event).toBe('trap');});
 it('tracks chain buildup and resolution without response-pass noises',()=>{const s=setup(),n=append(s,'ACTIVATE');n.chain=[{instanceId:Object.keys(s.cards)[0],controller:0,effectId:'DRAW_2',targets:[],spellSpeed:1}];expect(duelSounds(s,n).some(c=>c.event==='chain')).toBe(true);const r=append(n,'RESOLVE');r.chain=[];expect(duelSounds(n,r).map(c=>c.event)).toEqual(['resolve']);expect(duelSounds(s,append(s,'PASS_RESPONSE'))).toEqual([]);});
 it('scales damage and plays result from each seat’s perspective',()=>{const s=setup(),n=append(s,'BATTLE');n.players[1].lp=0;n.winner=0;expect(duelSounds(s,n,0)).toContainEqual({event:'victory',intensity:1});expect(duelSounds(s,n,1)).toContainEqual({event:'defeat',intensity:1});expect(duelSounds(s,n,0)).toContainEqual({event:'damage',intensity:2});});
 it('does not play a destruction sound for tribute costs',()=>{const s=setup(),id=Object.keys(s.cards)[0];s.cards[id].location='monster';const n=append(s,'TRIBUTE_SUMMON');n.cards[id].location='graveyard';expect(duelSounds(s,n).some(c=>c.event==='destroy')).toBe(false);});
 it('does not treat changing privacy redactions as new history',()=>{const s=setup(),n=append(s,'DRAW');n.events[0].message='hidden';expect(duelSounds(s,n)[0].event).toBe('draw');});
 it('normalizes stored settings and rejects invalid volume',()=>{expect(normalizeAudio(null)).toEqual({enabled:true,volume:.65,pack:'classic'});expect(normalizeAudio({volume:99,pack:'other'}).volume).toBe(1);expect(normalizeAudio({volume:NaN}).volume).toBe(.65);});
});
