import type {Card} from './core/types';
import {goatHistoricalText} from './goatHistoricalText';
import './historicalText.css';

export default function HistoricalTextNote({card}:{card:Card}){
 const record=card.goatText&&goatHistoricalText[String(card.id)];
 if(!record)return <p className="historical-text-note">Modern catalog text · historical wording not yet verified.</p>;
 const original=card.goatText?.originalFullImage||card.goatText?.originalImage;
 return <p className="historical-text-note"><strong>GOAT 2005 text</strong> · reconstructed rules-box overlay.<br/>
  <a href={record.source} target="_blank" rel="noreferrer">Historical errata source</a>
  {original&&<> · <a href={original} target="_blank" rel="noreferrer">Original image</a></>}
 </p>;
}
