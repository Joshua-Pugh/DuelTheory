import records from './data/goatHistoricalText.json';
import type {Card} from './core/types';

export const GOAT_TEXT_CUTOFF='2005-08-17';
export const goatHistoricalText:Readonly<Record<string,{
 name:string;text:string;source:string;sourceSection:string;cutoff:string;
 verifiedOn:string;verification:string;overlay:string;originalSha256:string;
}>>=records;

/** Presentation only: card IDs and engine effect support remain unchanged. */
export function withGoatHistoricalText(card:Card):Card{
 const historical=goatHistoricalText[String(card.id)];
 if(!historical||historical.name!==card.name||card.goatText)return card;
 return {...card,desc:historical.text,
  image:card.image?historical.overlay:undefined,
  fullImage:card.fullImage||card.image?historical.overlay:undefined,
  goatText:{originalDesc:card.desc,originalImage:card.image,originalFullImage:card.fullImage}};
}
