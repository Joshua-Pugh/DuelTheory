import {validateDeck} from './core/decks';
import type {Card,Deck} from './core/types';
import chaos from './data/chaosTurbo.json';
import venus from './data/venusLight.json';
export const VENUS_LIGHT:Deck=venus;
import {unsupportedEffects} from './engine/rules';
export const CHAOS_TURBO:Deck=chaos;
export const CHAOS_SOURCE='https://www.goatformat.com/chaos-turbo.html';
/** Support is checked by card coverage, not deck name or card order. Sideboarding is not enabled. */
export function assessDeck(deck:Deck,catalog:readonly Card[]){
 const cards=new Map(catalog.map(c=>[c.id,c]));
 const active=[...deck.main,...deck.extra];
 const missing=[...new Set(active)].filter(id=>!cards.has(id));
 const effects=active.filter(id=>cards.get(id)?.type!=='Normal Monster');
 const unsupported=unsupportedEffects({cards},effects);
 // Fusion and Extra Deck mechanics are not implemented by this prototype.
 const extra=deck.extra.map(id=>cards.get(id)?.name??String(id));
 const legality=validateDeck(deck,cards).filter(i=>i.kind==='error').map(i=>i.message);
 const reasons=[...new Set([...unsupported,...missing.map(String),...extra,...legality])];
 return {supported:deck.main.length>=40&&deck.main.length<=60&&reasons.length===0,unsupported:reasons,missing};
}
