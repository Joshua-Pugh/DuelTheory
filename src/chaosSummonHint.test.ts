import {describe,it,expect} from 'vitest';
import catalogJson from '../public/catalog.json';
import {CHAOS_TURBO} from './supportedDecks';
import type {Card} from './core/types';
import {createDuel,toGraveyard} from './engine/model';
import {chaosSummonHint} from './chaosSummonHint';
const cards=new Map((catalogJson as Card[]).map(c=>[c.id,c])),ctx={cards};
describe('Chaos summon explanations',()=>{
 it('explains full manual matches, missing materials, timing, and visible Kycoo',()=>{
  const s=createDuel(CHAOS_TURBO,CHAOS_TURBO,ctx,12),bls=Object.values(s.cards).find(c=>c.owner===0&&c.cardId===72989439)!;
  s.players[0].deck=s.players[0].deck.filter(id=>id!==bls.instanceId);s.players[0].hand=s.players[0].hand.filter(id=>id!==bls.instanceId);s.players[0].hand.push(bls.instanceId);bls.location='hand';
  expect(chaosSummonHint(s,bls.instanceId,cards,true)).toMatch(/Full manual/);
  s.phase='MAIN_1';expect(chaosSummonHint(s,bls.instanceId,cards,false)).toMatch(/LIGHT monster/);
  const kycoo=Object.values(s.cards).find(c=>c.owner===1&&c.cardId===88240808)!;s.players[1].zones.monster[0]=kycoo.instanceId;kycoo.faceDown=false;
  expect(chaosSummonHint(s,bls.instanceId,cards,false)).toMatch(/Kycoo/);
  kycoo.faceDown=true;expect(chaosSummonHint(s,bls.instanceId,cards,false)).not.toMatch(/Kycoo/);
  for(const attr of ['LIGHT','DARK']){const c=Object.values(s.cards).find(c=>c.owner===0&&c.instanceId!==bls.instanceId&&cards.get(c.cardId)?.attribute===attr)!;toGraveyard(s,c.instanceId);}
  expect(chaosSummonHint(s,bls.instanceId,cards,false)).toMatch(/response window/);
 });
});
