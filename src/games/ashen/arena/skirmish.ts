import type {Battlefield} from '../../../ashenBattlefieldState';
import {chooseAshenOpening,newAshenDuel} from '../duel';
import {moveAshenCard} from '../adapter';

/** A seeded mid-match position. Each launch owns its state and uses normal duel commands. */
export function createArenaSkirmish():Battlefield {
 const state=chooseAshenOpening(chooseAshenOpening(newAshenDuel(['Brute','Noble'],42,0),0,'keep'),1,'keep');
 for(const seat of [0,1] as const){
  for(const id of [...state.table.piles[`${seat}:hand`]])moveAshenCard(state,id,'deck');
 }
 const put=(seat:0|1,slug:string,zone:string)=>{
  const id=state.table.piles[`${seat}:deck`].find(id=>state.table.cards[id].cardId.endsWith('-'+slug));
  if(!id)throw Error(`Skirmish card missing from its starter deck: ${slug}`);
  moveAshenCard(state,id,zone);
  return state.table.cards[id];
 };
 for(const slug of ['frenzied-grunt','ashen-warhawk','bloodfang-raider','raging-mauler','rubble-flinger'])put(0,slug,'unit');
 for(const slug of ['crown-archer','shieldbearer-noble','royal-longbowman','court-scribe','ballista-crew'])put(1,slug,'unit');
 for(let i=0;i<5;i++){
  put(0,'fury-font','ley').faceDown=i>2;
  put(1,'oath-font','ley').faceDown=true;
 }
 put(0,'fury-pit','ley');
 put(1,'rune-of-clarity','support');
 for(const slug of ['ashen-strike','frenzied-grunt','raging-mauler','fury-font'])put(0,slug,'hand');
 for(const slug of ['shieldbearer-noble','court-scribe','oath-font'])put(1,slug,'hand');
 state.table.health=[12,14];
 state.table.turn=5;
 state.rules!.turn=5;
 state.table.events=['Skirmish begins. Burn Fonts to play a card, or enter the Skirmish Phase.'];
 return state;
}
