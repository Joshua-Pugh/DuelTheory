import {ashenCardMap} from '../ashenDecks';
import type {Battlefield} from '../ashenBattlefieldState';
/** Explicit effect fixture: reserve designs remain testable without adding them to real starters. */
export function fixtureCard(s:Battlefield,cardId:string,seat=0){
 const found=Object.values(s.table.cards).find(c=>c.cardId===cardId&&c.controller===seat);if(found)return found;
 const data=ashenCardMap.get(cardId);if(!data)throw Error('Unknown fixture card '+cardId);
 const player=seat as 0|1,id=`fixture-${seat}-${cardId}`;
 const card={instanceId:id,cardId,name:data.name,type:data.type,owner:player,controller:player,zone:'deck',faceDown:false,rotated:false,counters:0};
 s.table.cards[id]=card;s.table.piles[`${seat}:deck`].push(id);return card;
}
