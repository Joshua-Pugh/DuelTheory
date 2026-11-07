import {Swords} from 'lucide-react';
import type {Battlefield} from '../../../ashenBattlefieldState';
import AshenCardFrame from '../../../AshenCardFrame';
import AshenCommandCost from '../../../AshenCommandCost';
import AshenStatBreakdown from '../../../AshenStatBreakdown';
import RulesText from '../../../RulesText';
import {rulesForCard} from '../../../ashenPresentation';
import {ashenData,ashenStats} from '../adapter';
import {ashenEffects} from '../effectPacks';

type Props={state:Battlefield;id?:string;seat:0|1};
/** Use the same redacted visibility rule for hover, keyboard and touch readers. */
export function AshenCardReading({state,id,seat}:Props){
  const card=id?state.table.cards[id]:undefined;
  const visible=card&&(card.controller===seat||(!['hand','deck'].includes(card.zone)&&!card.faceDown));
  const data=visible?ashenData(state,card.instanceId):undefined;
  if(!card||!data)return <div className="ab-inspect-empty"><Swords size={28}/><h3>{card?'Hidden card':'Inspect a card'}</h3><p>Tap a card for its text and available actions. On a computer, hover to read it here.</p></div>;
  const stats=card.type==='Unit'?ashenStats(state,card.instanceId):undefined;
  return <>
    <div className="ab-view-art"><AshenCardFrame card={data}/></div>
    <div className="ab-reading-text"><h3>{data.name}</h3><p className="ab-reading-type">{data.type} · Player {card.controller+1}</p>
    <AshenCommandCost state={state} id={card.instanceId}/><AshenStatBreakdown state={state} id={card.instanceId}/>
    <p className="ab-rules"><RulesText text={rulesForCard(data).text}/></p>
    <div className="ab-effect-coverage"><strong>{ashenEffects[card.cardId]?'Card effects':'Resolve this card manually'}</strong>{stats&&<p>{stats.attack} Attack / {stats.defense} Defense · {stats.damage} damage{stats.keywords.length?` · ${stats.keywords.join(', ')}`:''}</p>}</div></div>
  </>;
}

export default function AshenCardInspector({state,id,seat,onClose}:Props&{onClose:()=>void}){
  return <aside className="ab-inspector" aria-label="Card viewer"><button className="ab-viewer-close" onClick={onClose}>Close card viewer ✕</button><span className="eyebrow">CARD VIEWER</span><AshenCardReading state={state} id={id} seat={seat}/><details className="ab-history"><summary>Table history</summary>{state.table.events.slice(-15).map((event,i)=><p key={i}>{event.replace(/graveyard/gi,'Ossuary').replace(/\bDiscard\b/g,'Send to Ossuary')}</p>)}</details></aside>;
}
