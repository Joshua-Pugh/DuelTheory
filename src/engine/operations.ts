import type {DuelState,Seat,EngineContext} from './model';
import {getCard,draw,log} from './model';
/** Shared, rules-validated effect operations. The caller manages chain windows. */
export function addDeckCardToHand(s:DuelState,seat:Seat,id:string,ctx:EngineContext,accept:(id:string)=>boolean):boolean {
 const p=s.players[seat];const index=p.deck.indexOf(id);
 if(index<0||!accept(id))return false;
 p.deck.splice(index,1);p.hand.push(id);s.cards[id].location='hand';s.cards[id].zone=undefined;
 log(s,'SEARCH',`Added ${getCard(s,id,ctx).name} from Deck to hand.`,seat);return true;
}
export function recoverGraveCard(s:DuelState,seat:Seat,id:string,ctx:EngineContext,accept:(id:string)=>boolean):boolean {
 const p=s.players[seat];const index=p.graveyard.indexOf(id);
 if(index<0||!accept(id))return false;
 p.graveyard.splice(index,1);p.hand.push(id);s.cards[id].location='hand';s.cards[id].zone=undefined;
 log(s,'RECOVER',`Recovered ${getCard(s,id,ctx).name} from Graveyard.`,seat);return true;
}
export function drawEffect(s:DuelState,seat:Seat,count:number){draw(s,seat,count);}
