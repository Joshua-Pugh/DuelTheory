import {describe,it,expect} from 'vitest';
import {GameService} from './GameService';
import {auditDuelState} from './duelAudit';
import type {Card,Deck} from '../core/types';
const card:Card={id:100,name:'Test Warrior',type:'Normal Monster',desc:'',level:4,atk:1200,def:1000};
const deck=(id:string):Deck=>({id,name:id,main:Array(20).fill(100),side:[],extra:[]});
const create=()=>{const svc=new GameService();const id=svc.createGoatSession([deck('a'),deck('b')],[card],11);return {svc,id};};
describe('game-service integrity, replay, and manual branch',()=>{
 it('replays legal action history deterministically and allows rewind',()=>{
  const {svc,id}=create();svc.dispatch(id,{type:'DRAW_PHASE',seat:0});
  expect(svc.verifyReplay(id)).toMatchObject({matches:true,actionCount:1,rulesVerified:true});
  svc.rewind(id,0);expect(svc.getState(id).players[0].hand).toHaveLength(5);
  expect(svc.verifyReplay(id)).toMatchObject({matches:true,actionCount:0,rulesVerified:true});
 });
 it('tracks explicitly manual changes without counting them as rules-verified',()=>{
  const {svc,id}=create();const cardId=svc.getState(id).players[0].hand[0];
  svc.dispatchManual(id,{type:'MANUAL_MOVE_CARD',seat:0,instanceId:cardId,destination:'monster',zone:2,position:'faceDownDefense'});
  const s=svc.getState(id);expect(s.cards[cardId].faceDown).toBe(true);
  expect(auditDuelState(s)).toEqual([]);
  expect(svc.verifyReplay(id)).toMatchObject({matches:true,rulesVerified:false});
  expect(()=>svc.dispatchManual(id,{type:'MANUAL_MOVE_CARD',seat:0,instanceId:s.players[0].hand[0],destination:'monster',zone:2})).toThrow();
  svc.rewind(id,0);expect(svc.verifyReplay(id).rulesVerified).toBe(true);
 });
 it('detects duplicate card references',()=>{
  const {svc,id}=create();const s=svc.getState(id);s.players[0].graveyard.push(s.players[0].hand[0]);
  expect(auditDuelState(s).some(x=>x.includes('appears in both'))).toBe(true);
 });
});
