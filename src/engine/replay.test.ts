import {describe,it,expect} from 'vitest';
import type {Card,Deck} from '../core/types';
import {createDuel,toGraveyard,type DuelState,type EngineContext} from './model';
import {dispatchDuel,legalActions,MIRROR_FORCE} from './rules';
const monster:Card={id:100,name:'Warrior',type:'Normal Monster',desc:'',level:4,atk:2000,def:1000};
const trap:Card={id:MIRROR_FORCE,name:'Mirror Force',type:'Trap Card',desc:''};
const ctx:EngineContext={cards:new Map([monster,trap].map(c=>[c.id,c]))};
const deck=(id:string):Deck=>({id,name:id,main:Array(20).fill(100),side:[],extra:[]});
function field(){
 let s=createDuel(deck('a'),deck('b'),ctx,5);
 const a=s.players[0].hand.shift()!;
 s.players[0].zones.monster[0]=a;Object.assign(s.cards[a],{location:'monster',zone:0,position:'attack',faceDown:false});
 const d=s.players[1].hand.shift()!;
 s.players[1].zones.monster[0]=d;Object.assign(s.cards[d],{location:'monster',zone:0,position:'attack',faceDown:false});
 const second=s.players[1].hand.shift()!;
 s.players[1].zones.monster[1]=second;Object.assign(s.cards[second],{location:'monster',zone:1,position:'attack',faceDown:false});
 s.turn=2;s.phase='BATTLE';s.current=0;s.priority=0;s.pendingDraw=false;
 return {s,a,d,second};
}
function makeReplay(s:DuelState,attacker:string,target:string){
 s=dispatchDuel(s,{type:'DECLARE_ATTACK',seat:0,attackerId:attacker,targetId:target},ctx);
 // Simulate a chain resolving after removing the target. Effects that change targets will use this same replay checkpoint.
 toGraveyard(s,target);
 s.pendingAttack!.replay=true;s.priority=0;
 return s;
}
describe('attack replay decisions',()=>{
 it('offers a new target and resolves damage after defender passes',()=>{
  const {s:initial,a,d,second}=field();let s=makeReplay(initial,a,d);
  expect(legalActions(s,ctx,0).some(x=>x.type==='REPLAY_ATTACK'&&x.targetId===second)).toBe(true);
  s=dispatchDuel(s,{type:'REPLAY_ATTACK',seat:0,targetId:second},ctx);
  expect(s.pendingAttack?.replay).toBe(false);
  s=dispatchDuel(s,{type:'PASS_ATTACK_RESPONSE',seat:1},ctx);
  for(let i=0;i<4;i++)s=dispatchDuel(s,{type:'ADVANCE_DAMAGE_STEP',seat:0},ctx);
  expect(s.pendingAttack).toBeUndefined();expect(s.cards[second].location).toBe('graveyard');
 });
 it('permits canceling replay but consumes the attack',()=>{
  const {s:initial,a,d}=field();let s=makeReplay(initial,a,d);
  s=dispatchDuel(s,{type:'CANCEL_REPLAY',seat:0},ctx);
  expect(s.pendingAttack).toBeUndefined();expect(s.cards[a].attackedTurn).toBe(2);
  expect(legalActions(s,ctx,0).some(x=>x.type==='DECLARE_ATTACK'&&x.attackerId===a)).toBe(false);
 });
 it('cannot replay into a direct attack if another monster remains',()=>{
  const {s:initial,a,d}=field();const s=makeReplay(initial,a,d);
  expect(legalActions(s,ctx,0).some(x=>x.type==='REPLAY_ATTACK'&&!x.targetId)).toBe(false);
 });
});
