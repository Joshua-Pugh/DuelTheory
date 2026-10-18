import {describe,it,expect} from 'vitest';
import {ASHEN_TABLETOP,GOAT_TABLETOP,tabletopZoneLabel,tabletopDispatch} from '../../services/CreatorTabletop';
import {newAshenDuel} from './duel';
import {ashenCardMap} from '../../ashenDecks';
describe('AT Ossuary terminology',()=>{
 it('renames only the AT pile, including existing definitions without label metadata',()=>{
  expect(tabletopZoneLabel(ASHEN_TABLETOP,'graveyard')).toBe('Ossuary');expect(tabletopZoneLabel({...ASHEN_TABLETOP,pileLabels:undefined},'graveyard')).toBe('Ossuary');expect(tabletopZoneLabel(GOAT_TABLETOP,'graveyard')).toBe('graveyard');
 });
 it('retains compatible zone IDs while movement logs use Ossuary',()=>{
  const s=newAshenDuel(['Brute','Noble'],32,0),id=s.table.piles['0:hand'][0];const next=tabletopDispatch(s.table,{type:'MOVE',seat:0,instanceId:id,zone:'graveyard'});expect(next.piles['0:graveyard']).toContain(id);expect(next.events.at(-1)).toContain('Ossuary');
 });
 it('updates the AT card text rather than changing its move semantics',()=>{
  for(const card of ashenCardMap.values())expect(card.effectText).not.toMatch(/\b(?:graveyard|discard(?:ed)?|pyre)\b/i);
  expect(ashenCardMap.get('ashen-brute-korgath-s-call')?.effectText).toContain('hand or Ossuary');
 });
});
