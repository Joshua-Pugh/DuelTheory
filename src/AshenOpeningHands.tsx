import type {Battlefield} from './ashenBattlefieldState';
import AshenCardFrame from './AshenCardFrame';
import {ashenData} from './games/ashen/adapter';
import {ASHEN_OPENING_HAND,ashenOpeningPlayer} from './games/ashen/duel';
import {canRedrawOpeningHand,openingHandSize} from './framework/openingHand';

export default function AshenOpeningHands({state,seat,onChoice,onSeat}:{state:Battlefield;seat:0|1;onChoice:(choice:'keep'|'redraw')=>void;onSeat?:((seat:0|1)=>void)}){
 const player=ashenOpeningPlayer(state),opening=state.rules?.duel?.opening;
 if(player===null||!opening)return null;
 const mine=player===seat,count=opening.redraws[player],size=openingHandSize(ASHEN_OPENING_HAND,count+1),canRedraw=canRedrawOpeningHand(ASHEN_OPENING_HAND,count);
 return <div className="ab-modal-backdrop ab-opening-backdrop"><section className="ab-pile-dialog ab-opening-dialog" role="dialog" aria-modal="true" aria-labelledby="ab-opening-title">
  <header><h3 id="ab-opening-title">Opening hand · Player {player+1}</h3><small>Both players must keep a hand before play begins.</small></header>
  {mine?<><p>Keep these {state.table.piles[`${seat}:hand`].length} cards, or shuffle your whole hand back into your deck and redraw. Your first redraw is free; later redraws draw one fewer card, down to one.</p>
   <div className="ab-opening-cards">{state.table.piles[`${seat}:hand`].map(id=>{const card=ashenData(state,id);return card?<figure key={id}><AshenCardFrame card={card} size="mini"/><figcaption>{card.name}</figcaption></figure>:null;})}</div>
   <footer><button className="ab-opening-keep" onClick={()=>onChoice('keep')}>Keep hand · {state.table.piles[`${seat}:hand`].length} cards</button><button disabled={!canRedraw} onClick={()=>onChoice('redraw')}>{!canRedraw?'Minimum hand size reached':count===0?'Free redraw · 6 cards':`Redraw · ${size} card${size===1?'':'s'}`}</button></footer>
  </>:<><p role="status">{opening.kept[seat]?'You kept your hand. ':''}Waiting for Player {player+1} to keep or redraw their opening hand.</p>{onSeat&&<button onClick={()=>onSeat(player)}>View Player {player+1} hand</button>}</>}
 </section></div>;
}
