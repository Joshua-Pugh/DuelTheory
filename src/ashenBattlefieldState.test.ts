import {describe,it,expect} from 'vitest';
import {battlefieldDispatch,newBattlefield,fontEssence} from './ashenBattlefieldState';
import {ASHEN_TABLETOP} from './services/CreatorTabletop';

describe('Ashen battlefield manual foundation',()=>{
 it('deals six shuffled cards and keeps each command station outside the deck',()=>{
  const s=newBattlefield(false,()=>.4);
  for(const who of [0,1]){
   expect(s.table.piles[`${who}:hand`]).toHaveLength(6);
   expect(s.table.piles[`${who}:command`]).toHaveLength(1);
   expect(s.table.piles[`${who}:unit`]).toHaveLength(0);
   const station=s.table.piles[`${who}:command`][0];
   expect(s.table.cards[station].type).toBe('Command Station');
   expect(s.table.piles[`${who}:deck`]).not.toContain(station);
  }
  const other=newBattlefield(false,()=>.8);
  expect(other.table.piles['0:hand'].map(id=>other.table.cards[id].cardId)).not.toEqual(s.table.piles['0:hand'].map(id=>s.table.cards[id].cardId));
  expect(s.table.verified).toBe(false);
 });
 it('supports crowded frontlines beyond the creator table slot count',()=>{
  let s=newBattlefield(false,()=>.4);
  const ids=[...s.table.piles['0:hand'],...s.table.piles['0:deck']].filter(id=>s.table.cards[id].type==='Unit').slice(0,12);
  expect(ids.length).toBeGreaterThan(7);
  for(const id of ids)s=battlefieldDispatch(s,{type:'MOVE',instanceId:id,seat:0,zone:'unit'});
  expect(s.table.piles['0:unit']).toHaveLength(ids.length);
  expect(ASHEN_TABLETOP.zones.find(z=>z.id==='unit')?.slots).toBe(7);
 });
 it('burns the correct essence once and preserves an undo snapshot',()=>{
  const before=newBattlefield(true,()=>.4),id=before.table.piles['0:ley'][0];
  const resource=fontEssence(before.table.cards[id].cardId);
  const after=battlefieldDispatch(before,{type:'BURN',instanceId:id});
  expect(after.basins[0][resource]).toBe(1);
  expect(after.basins[1][resource]).toBe(0);
  expect(after.table.cards[id].faceDown).toBe(true);
  expect(before.table.cards[id].faceDown).toBe(false);
  expect(before.basins[0][resource]).toBe(0);
  expect(()=>battlefieldDispatch(after,{type:'BURN',instanceId:id})).toThrow('already spent');
  expect(()=>battlefieldDispatch(before,{type:'BURN',instanceId:before.table.piles['0:unit'][0]})).toThrow('Ley Font');
 });
 it('spends essence without going negative and readies only the incoming fonts',()=>{
  let s=newBattlefield(true,()=>.4);
  const own=s.table.piles['0:ley'][0],opp=s.table.piles['1:ley'][0];
  s=battlefieldDispatch(s,{type:'BURN',instanceId:own});
  s=battlefieldDispatch(s,{type:'BURN',instanceId:opp});
  const r=fontEssence(s.table.cards[own].cardId);
  s=battlefieldDispatch(s,{type:'ESSENCE',seat:0,resource:r,delta:-1});
  expect(()=>battlefieldDispatch(s,{type:'ESSENCE',seat:0,resource:r,delta:-1})).toThrow('Not enough');
  s=battlefieldDispatch(s,{type:'END_TURN'});
  expect(s.table.active).toBe(1);
  expect(Object.values(s.basins[0]).every(v=>v===0)).toBe(true);
  expect(Object.values(s.basins[1]).every(v=>v===0)).toBe(true);
  expect(s.table.cards[opp].faceDown).toBe(false);
  expect(s.table.cards[own].faceDown).toBe(true);
 });
 it('preview placement conserves every card and labels demonstration state',()=>{
  const s=newBattlefield(true,()=>.4);
  const all=Object.values(s.table.piles).flat();
  expect(all.length).toBe(Object.keys(s.table.cards).length);
  expect(new Set(all).size).toBe(all.length);
  expect(s.preview).toBe(true);
  expect(s.table.events[0]).toContain('demonstration');
 });
});
