import type {Battlefield} from './ashenBattlefieldState';
export type AshenVisualEvent={kind:'draw'|'place'|'ossuary'|'return'|'shuffle';id?:string;seat:0|1};
export function ashenVisualEvents(before:Battlefield|undefined,after:Battlefield):AshenVisualEvent[]{
 if(before&&(after.rules?.turn||after.table.turn)<(before.rules?.turn||before.table.turn))return [];
 if(before&&after.table.events.length<before.table.events.length)return [];
 if(!before&&(after.preview||(after.rules?.turn||after.table.turn)!==1||after.table.events.length>2))return [];
 const events:AshenVisualEvent[]=[];
 for(const seat of [0,1] as const){
  if(!before||(after.rules?.shuffleCounts?.[seat]||0)>(before.rules?.shuffleCounts?.[seat]||0))events.push({kind:'shuffle',seat});
  for(const id of after.table.piles[`${seat}:hand`])if(!before||before.table.cards[id]?.zone==='deck')events.push({kind:'draw',seat,id});
 }
 if(before)for(const card of Object.values(after.table.cards)){
  const old=before.table.cards[card.instanceId];if(!old||old.zone===card.zone)continue;
  if(['unit','support','ley'].includes(card.zone)&&!['unit','support','ley'].includes(old.zone))events.push({kind:'place',id:card.instanceId,seat:card.controller});
  if(card.zone==='graveyard'&&['unit','support','ley','clash'].includes(old.zone))events.push({kind:'ossuary',id:card.instanceId,seat:card.owner});
  if(card.zone==='hand'&&!['deck','hand'].includes(old.zone))events.push({kind:'return',id:card.instanceId,seat:card.owner});
 }
 return events;
}
