import {describe,it,expect} from 'vitest';
import {newBattlefield,battlefieldDispatch,type Battlefield} from '../../ashenBattlefieldState';
import {playProgram,resolveAshenEffect,ashenStats,resolveBurnEffect} from './adapter';
import {bruteEffects} from './bruteEffects';
const idOf=(s:Battlefield,slug:string)=>Object.values(s.table.cards).find(c=>c.cardId===`ashen-brute-${slug}`)!.instanceId;
function hand(s:Battlefield,slug:string){const id=idOf(s,slug);if(s.table.cards[id].zone!=='hand')s=battlefieldDispatch(s,{type:'MOVE',instanceId:id,seat:0,zone:'hand'});s.basins[0].fury=50;s.basins[0].untuned=50;return {s,id};}
const deploy=(s:Battlefield,id:string,targets:string[]=[],costCards:string[]=[])=>resolveAshenEffect(s,playProgram(s,id),{player:'0',source:id,targets,costCards},true);
describe('first Brute effects through the shared framework',()=>{
 it('deploys Initiate with printed costs, Charge and a separate token',()=>{
  const {s,id}=hand(newBattlefield(false,()=>.4),'bloodpit-initiate');const next=deploy(s,id);
  expect(next.table.cards[id].zone).toBe('unit');expect(next.table.cards[id].rotated).toBe(false);
  expect(Object.values(next.table.cards).filter(c=>c.presentation?.name==='Frenzied Brute')).toHaveLength(1);
  expect(next.basins[0].fury).toBeLessThan(s.basins[0].fury);expect(s.table.cards[id].zone).toBe('hand');
 });
 it('does not move or pay when a targeted entry effect has an illegal target',()=>{
  const {s,id}=hand(newBattlefield(false,()=>.4),'ashfang-ravine');const before=JSON.stringify(s);
  expect(()=>deploy(s,id,['missing'])).toThrow();expect(JSON.stringify(s)).toBe(before);
 });
 it('enforces one font and handles Fury Pit spent entry and burn bonuses',()=>{
  let {s,id}=hand(newBattlefield(false,()=>.4),'fury-pit');s=deploy(s,id);expect(s.table.cards[id].faceDown).toBe(true);
  const other=hand(s,'fury-font');expect(()=>playProgram(other.s,other.id)).toThrow('already played');
  const unit=idOf(s,'frenzied-grunt');s=battlefieldDispatch(s,{type:'MOVE',instanceId:unit,seat:0,zone:'unit'});
  s=battlefieldDispatch(s,{type:'FLIP',instanceId:id});const attack=ashenStats(s,unit).attack;
  s=resolveBurnEffect(battlefieldDispatch(s,{type:'BURN',instanceId:id}),id);expect(ashenStats(s,unit).attack).toBe(attack+1);
  s=battlefieldDispatch(s,{type:'END_TURN'});expect(ashenStats(s,unit).attack).toBe(attack);
 });
 it('pays exhaust/resource activation once and rejects repeat activation',()=>{
  const start=hand(newBattlefield(false,()=>.4),'feral-axebreaker');let s=deploy(start.s,start.id);s=battlefieldDispatch(s,{type:'ROTATE',instanceId:start.id});
  const p=bruteEffects[s.table.cards[start.id].cardId].activated![0];s=resolveAshenEffect(s,p,{player:'0',source:start.id});expect(s.table.cards[start.id].rotated).toBe(true);
  expect(()=>resolveAshenEffect(s,p,{player:'0',source:start.id})).toThrow('exhausted');
 });
 it('destroys Units and uses typed death triggers with the Keep’s turn limit',()=>{
  let s=newBattlefield(true,()=>.4);const extra=Object.values(s.table.cards).filter(c=>c.controller===0&&c.type==='Unit'&&c.zone==='deck').slice(0,3);
  for(const c of extra)s=battlefieldDispatch(s,{type:'MOVE',instanceId:c.instanceId,seat:0,zone:'unit'});
  const start=hand(s,'bloodfire-collapse');const before=start.s.table.piles['0:unit'].length+start.s.table.piles['1:unit'].length;
  s=deploy(start.s,start.id);
  expect(s.table.health).toEqual([20-before,20-before]);
  expect(s.table.piles['0:unit']).toHaveLength(3);expect(s.table.piles['1:unit']).toHaveLength(0);
 });
 it('resolves a sacrifice cost and draw as one undoable transaction',()=>{
  const {s,id}=hand(newBattlefield(true,()=>.4),'pit-digger-s-howl');const sacrifice=s.table.piles['0:unit'][0],deck=s.table.piles['0:deck'].length;
  const result=deploy(s,id,[],[sacrifice]);expect(result.table.cards[sacrifice].zone).toBe('graveyard');expect(result.table.piles['0:deck'].length).toBe(deck-2);expect(s.table.cards[sacrifice].zone).toBe('unit');
 });
});
