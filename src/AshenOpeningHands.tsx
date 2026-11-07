import {useEffect,useRef,useState} from 'react';
import type {Battlefield} from './ashenBattlefieldState';
import AshenCardFrame from './AshenCardFrame';
import RulesText from './RulesText';
import {rulesForCard} from './ashenPresentation';
import {ashenData} from './games/ashen/adapter';
import {ASHEN_OPENING_HAND,ashenOpeningPlayer} from './games/ashen/duel';
import {canRedrawOpeningHand,openingHandSize} from './framework/openingHand';

export default function AshenOpeningHands({state,seat,onChoice,onSeat}:{state:Battlefield;seat:0|1;onChoice:(choice:'keep'|'redraw')=>void;onSeat?:((seat:0|1)=>void)}){
 const [reading,setReading]=useState<string|null>(null),dialog=useRef<HTMLElement>(null);
 const player=ashenOpeningPlayer(state),opening=state.rules?.duel?.opening;
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;dialog.current?.focus({preventScroll:true});return()=>previous?.focus?.({preventScroll:true});},[player,seat]);
 if(player===null||!opening)return null;
 const mine=player===seat,count=opening.redraws[player],size=openingHandSize(ASHEN_OPENING_HAND,count+1),canRedraw=canRedrawOpeningHand(ASHEN_OPENING_HAND,count);
 const ids=state.table.piles[`${seat}:hand`],readId=mine&&reading&&ids.includes(reading)?reading:null,card=readId?ashenData(state,readId):undefined;
 const choose=(choice:'keep'|'redraw')=>{setReading(null);onChoice(choice);};
 return <div className="ab-modal-backdrop ab-opening-backdrop"><section ref={dialog} tabIndex={-1} className="ab-pile-dialog ab-opening-dialog" role="dialog" aria-modal="true" aria-labelledby="ab-opening-title" onKeyDown={e=>{
  if(e.key==='Escape'&&readId){e.stopPropagation();setReading(null);}
  if(e.key==='Tab'){const controls=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]'));const first=controls[0],last=controls.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
 }}>
  <header><div><small>PLAYER {player+1}</small><h3 id="ab-opening-title">{mine?'Choose your opening hand':'Your opponent is choosing'}</h3></div>{mine&&<small>Tap a card to read it</small>}</header>
  {mine?<>
   <p className="ab-opening-explain">{count===0?'Your first redraw is free. Shuffle these cards back and draw six new ones.':canRedraw?`The next redraw gives you ${size} card${size===1?'':'s'}. Your whole hand goes back into the deck first.`:'You have one card. Keep this hand to begin.'}</p>
   <div className="ab-opening-body">{card&&readId?<div className="ab-opening-reader">
    <div className="ab-opening-read-nav"><button onClick={()=>setReading(null)}>← Back to hand</button><span>Card {ids.indexOf(readId)+1} of {ids.length}</span><button aria-label="Read previous opening card" onClick={()=>setReading(ids[(ids.indexOf(readId)+ids.length-1)%ids.length])}>←</button><button aria-label="Read next opening card" onClick={()=>setReading(ids[(ids.indexOf(readId)+1)%ids.length])}>→</button></div>
    <div className="ab-opening-read-content"><AshenCardFrame card={card}/><div><h4>{card.name}</h4><p>{card.subtype||card.type}</p><div className="ab-opening-rules"><RulesText text={rulesForCard(card).text}/></div></div></div>
   </div>:<div className="ab-opening-cards">{ids.map(id=>{const data=ashenData(state,id);return data?<figure key={id}><button aria-label={`Read ${data.name}`} onClick={()=>setReading(id)}><AshenCardFrame card={data} size="mini"/></button><figcaption>{data.name}</figcaption></figure>:null;})}</div>}</div>
   <footer><button className="ab-opening-keep" onClick={()=>choose('keep')}>Keep hand · {ids.length} cards</button><button disabled={!canRedraw} onClick={()=>choose('redraw')}>{!canRedraw?'No redraws left':count===0?'Free redraw · 6 cards':`Redraw · ${size} card${size===1?'':'s'}`}</button></footer>
  </>:<div className="ab-opening-wait"><p role="status">{opening.kept[seat]?'Your hand is ready. ':''}Waiting for Player {player+1} to keep or redraw.</p>{onSeat&&<><p>Pass the device to Player {player+1}, then reveal their hand.</p><button onClick={()=>{setReading(null);onSeat(player);}}>View Player {player+1} hand</button></>}</div>}
 </section></div>;
}
