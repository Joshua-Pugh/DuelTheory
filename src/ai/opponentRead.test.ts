import {expect,it} from 'vitest';
import json from '../../public/catalog.json';
import type {Card} from '../core/types';
import {CHAOS_TURBO} from '../supportedDecks';
import {createDuel,type DuelState} from '../engine/model';
import {publicSetRead} from './opponentRead';
const cards=new Map((json as Card[]).map(c=>[c.id,c])),ctx={cards};
const setup=()=>createDuel(CHAOS_TURBO,CHAOS_TURBO,ctx,42);
function reveal(s:DuelState,cardId:number){const c=Object.values(s.cards).find(c=>c.owner===0&&c.cardId===cardId)!;s.players[0].hand=s.players[0].hand.filter(id=>id!==c.instanceId);s.players[0].deck=s.players[0].deck.filter(id=>id!==c.instanceId);s.players[0].graveyard.push(c.instanceId);c.location='graveyard';return c;}
it('uses public flip/recovery and tribute clues without treating any set as identified',()=>{
 const s=setup(),baseline=publicSetRead(s,1,cards);expect(baseline.defenseEstimate).toBe(1800);expect(baseline.flipEngine).toBe(false);
 reveal(s,31560081);reveal(s,55144522);const flip=publicSetRead(s,1,cards);expect(flip.defenseEstimate).toBeLessThan(1800);expect(flip.urgency).toBeGreaterThan(0);expect(flip.reason).toContain('spell recovery');
 const tribute=reveal(s,31786629);tribute.cardId=51945556;const monarch=publicSetRead(s,1,cards);expect(monarch.tributeThreat).toBe(true);expect(monarch.urgency).toBeGreaterThan(flip.urgency);expect(monarch.reason).toContain('unknown');
});
it('learns a tougher defense estimate from revealed Spies than from revealed Faith',()=>{
 const spy=setup(),faith=setup();reveal(spy,24317029);reveal(faith,31560081);expect(publicSetRead(spy,1,cards).defenseEstimate).toBeGreaterThan(publicSetRead(faith,1,cards).defenseEstimate);
});
it('ignores opponent hands, deck composition, hidden banished cards, set monsters and private log snapshots',()=>{
 const s=setup();reveal(s,31560081);const expected=publicSetRead(s,1,cards),copy=structuredClone(s);
 for(const c of Object.values(copy.cards))if(c.owner===0&&['hand','deck'].includes(c.location))c.cardId=72989439;
 const id=copy.players[0].deck.pop()!;copy.cards[id].location='monster';copy.cards[id].faceDown=true;copy.players[0].zones.monster[0]=id;
 Object.assign(copy,{playerHands:[{cards:[{cardId:72989439}]}]});expect(publicSetRead(copy,1,cards)).toEqual(expected);
});
