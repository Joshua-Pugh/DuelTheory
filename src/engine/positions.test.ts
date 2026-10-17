import {describe,it,expect} from 'vitest';
import type {Card,Deck} from '../core/types';
import {createDuel,placeMonster,DuelEngineError} from './model';
import {dispatchDuel,legalActions} from './rules';
const sample:Card={id:900001,name:'Example Soldier',type:'Normal Monster',level:4,atk:1700,def:1400,attribute:'EARTH',desc:''};
const ctx={cards:new Map([[sample.id,sample]])};
const deck:Deck={id:'position',name:'position',main:Array(20).fill(sample.id),side:[],extra:[]};
function mainPhase(){let s=createDuel(deck,deck,ctx,12);s=dispatchDuel(s,{type:'DRAW_PHASE',seat:0},ctx);s=dispatchDuel(s,{type:'ADVANCE',seat:0},ctx);return dispatchDuel(s,{type:'ADVANCE',seat:0},ctx);}
describe('monster positions and legal summon destinations',()=>{
 it('Normal Summon offers only face-up Attack and Set offers face-down Defense',()=>{
  const s=mainPhase();const id=s.players[0].hand[0];const options=legalActions(s,ctx,0).filter(a=>a.type==='NORMAL_SUMMON'&&a.instanceId===id);
  expect(options.some(a=>a.type==='NORMAL_SUMMON'&&a.position==='attack')).toBe(true);
  expect(options.some(a=>a.type==='NORMAL_SUMMON'&&a.position==='faceDownDefense')).toBe(true);
  expect(options.some(a=>a.type==='NORMAL_SUMMON'&&(a.position as string)==='faceUpDefense')).toBe(false);
 });
 it('sets a monster face-down in Defense, preventing attacking and immediate position changes',()=>{
  let s=mainPhase();const id=s.players[0].hand[0];s=dispatchDuel(s,{type:'NORMAL_SUMMON',seat:0,instanceId:id,zone:0,position:'faceDownDefense'},ctx);
  expect(s.cards[id].position).toBe('faceDownDefense');expect(s.cards[id].faceDown).toBe(true);
  expect(legalActions(s,ctx,0).some(a=>a.type==='CHANGE_POSITION'&&a.instanceId===id)).toBe(false);
 });
 it('changes face-up position once in a later turn but never on the summon turn',()=>{
  let s=mainPhase();const id=s.players[0].hand[0];s=dispatchDuel(s,{type:'NORMAL_SUMMON',seat:0,instanceId:id,zone:0,position:'attack'},ctx);
  expect(legalActions(s,ctx,0).some(a=>a.type==='CHANGE_POSITION'&&a.instanceId===id)).toBe(false);
  s.turn=3;s.current=0;s.phase='MAIN_1';s.pendingDraw=false;
  expect(legalActions(s,ctx,0).some(a=>a.type==='CHANGE_POSITION'&&a.instanceId===id&&a.position==='faceUpDefense')).toBe(true);
  s=dispatchDuel(s,{type:'CHANGE_POSITION',seat:0,instanceId:id,position:'faceUpDefense'},ctx);
  expect(s.cards[id].position).toBe('faceUpDefense');expect(s.cards[id].faceDown).toBe(false);
  expect(legalActions(s,ctx,0).some(a=>a.type==='CHANGE_POSITION'&&a.instanceId===id)).toBe(false);
 });
 it('effect-specific summon positions reject positions not allowed by the effect',()=>{
  const s=mainPhase();const id=s.players[0].hand[0];
  expect(()=>placeMonster(s,id,0,0,'faceUpDefense',['attack'])).toThrow(DuelEngineError);
  expect(s.players[0].zones.monster[0]).toBe(null);
 });
});
