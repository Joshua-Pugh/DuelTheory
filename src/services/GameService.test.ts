import {describe,it,expect} from 'vitest';
import {GameService} from './GameService';
import type {Card,Deck} from '../core/types';
const monster:Card={id:100,name:'Test Warrior',type:'Normal Monster',desc:'',level:4,atk:2000,def:1000};
const deck=(name:string):Deck=>({id:name,name,main:Array(20).fill(100),side:[],extra:[]});
const catalog=[monster];
const advance=(svc:GameService,id:string,seat:0|1)=>svc.dispatch(id,{type:'ADVANCE',seat});
const completeDamageStep=(svc:GameService,id:string,attacker:0|1)=>{
  // Damage Step is explicit; passing the attack-response window doesn't resolve damage.
  for(let n=0;n<4;n++){
    const step=svc.getLegalActions(id,attacker).find(a=>a.type==='ADVANCE_DAMAGE_STEP');
    expect(step).toBeDefined();
    svc.dispatch(id,step!);
  }
};

describe('isolated session service and basic game loop',()=>{
 it('isolates sessions and gives callers immutable snapshots',()=>{
  const svc=new GameService();const a=svc.createGoatSession([deck('a'),deck('b')],catalog,1);const b=svc.createGoatSession([deck('a'),deck('b')],catalog,1);
  const snapshot=svc.getState(a);snapshot.players[0].lp=1;
  expect(svc.getState(a).players[0].lp).toBe(8000);
  svc.dispatch(a,{type:'DRAW_PHASE',seat:0});expect(svc.getState(a).players[0].hand).toHaveLength(5);
  expect(svc.getState(b).players[0].hand).toHaveLength(5);
  expect(svc.getHistory(a).actions).toHaveLength(1);
  expect(svc.close(a)).toBe(true);expect(()=>svc.getState(a)).toThrow();
 });
 it('runs a basic turn, attacks directly on turn two, and records damage',()=>{
  const svc=new GameService();const id=svc.createGoatSession([deck('a'),deck('b')],catalog,2);
  svc.dispatch(id,{type:'DRAW_PHASE',seat:0});advance(svc,id,0);advance(svc,id,0);
  const summon=svc.getLegalActions(id,0).find(a=>a.type==='NORMAL_SUMMON'&&a.position==='attack');expect(summon).toBeDefined();svc.dispatch(id,summon!);
  advance(svc,id,0);expect(svc.getLegalActions(id,0).some(a=>a.type==='DECLARE_ATTACK')).toBe(false);
  advance(svc,id,0);advance(svc,id,0);advance(svc,id,0);
  svc.dispatch(id,{type:'DRAW_PHASE',seat:1});advance(svc,id,1);advance(svc,id,1);advance(svc,id,1);
  const attack=svc.getLegalActions(id,1).find(a=>a.type==='DECLARE_ATTACK');expect(attack).toBeUndefined();
  advance(svc,id,1);advance(svc,id,1);advance(svc,id,1);
  svc.dispatch(id,{type:'DRAW_PHASE',seat:0});advance(svc,id,0);advance(svc,id,0);advance(svc,id,0);
  const direct=svc.getLegalActions(id,0).find(a=>a.type==='DECLARE_ATTACK');expect(direct).toBeDefined();svc.dispatch(id,direct!);
  expect(svc.getState(id).players[1].lp).toBe(8000);
  expect(svc.getLegalActions(id,0)).toEqual([]);
  expect(svc.getLegalActions(id,1).map(a=>a.type)).toEqual(['PASS_ATTACK_RESPONSE']);
  svc.dispatch(id,{type:'PASS_ATTACK_RESPONSE',seat:1});
  expect(svc.getState(id).players[1].lp).toBe(8000);
  completeDamageStep(svc,id,0);
  expect(svc.getState(id).players[1].lp).toBe(6000);
  expect(svc.getLegalActions(id,0).some(a=>a.type==='DECLARE_ATTACK')).toBe(false);
 });
 it('ends the duel when direct damage reduces opponent to zero',()=>{
  const svc=new GameService();const boss:Card={...monster,atk:8000};
  const id=svc.createGoatSession([deck('a'),deck('b')],[boss],9);
  svc.dispatch(id,{type:'DRAW_PHASE',seat:0});advance(svc,id,0);advance(svc,id,0);
  const summon=svc.getLegalActions(id,0).find(a=>a.type==='NORMAL_SUMMON'&&a.position==='attack');expect(summon).toBeDefined();svc.dispatch(id,summon!);
  for(let n=0;n<4;n++)advance(svc,id,0); // Main 1 -> Battle -> Main 2 -> End -> P2 Draw
  svc.dispatch(id,{type:'DRAW_PHASE',seat:1});for(let n=0;n<6;n++)advance(svc,id,1); // Draw -> Standby -> Main 1 -> Battle -> Main 2 -> End -> P1 Draw
  svc.dispatch(id,{type:'DRAW_PHASE',seat:0});for(let n=0;n<3;n++)advance(svc,id,0);
  const direct=svc.getLegalActions(id,0).find(a=>a.type==='DECLARE_ATTACK');expect(direct).toBeDefined();svc.dispatch(id,direct!);
  expect(svc.getState(id).players[1].lp).toBe(8000);
  svc.dispatch(id,{type:'PASS_ATTACK_RESPONSE',seat:1});
  expect(svc.getState(id).players[1].lp).toBe(8000);
  completeDamageStep(svc,id,0);
  expect(svc.getState(id).players[1].lp).toBe(0);
  expect(svc.getState(id).winner).toBe(0);
  expect(svc.getLegalActions(id,0)).toEqual([]);
 });
});
