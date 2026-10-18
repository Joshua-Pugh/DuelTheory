import matt from './data/mattMonarchs.json';
export const MATT_MONARCHS:Deck=matt;
import {supportedFusions} from './engine/goatControlEffects';
import {validateDeck} from './core/decks';
import type {Card,Deck} from './core/types';
import ritual from './data/chaosRitualTurbo.json';
export const CHAOS_RITUAL_TURBO:Deck=ritual;
import goatControl from './data/goatControl.json';
export const GOAT_CONTROL:Deck=goatControl;
export const GOAT_CONTROL_SOURCE='https://www.goatformat.com/goat-control.html';
import chaos from './data/chaosTurbo.json';
import venus from './data/venusLight.json';
export const VENUS_LIGHT:Deck=venus;
import {unsupportedEffects} from './engine/rules';
export const CHAOS_TURBO:Deck=chaos;
export const CHAOS_SOURCE='https://www.goatformat.com/chaos-turbo.html';
/** Support is checked by card coverage, not deck name or card order. Side Deck coverage is checked separately before each room game. */
export function assessDeck(deck:Deck,catalog:readonly Card[]){
 const cards=new Map(catalog.map(c=>[c.id,c]));
 const active=[...deck.main,...deck.extra];
 const missing=[...new Set(active)].filter(id=>!cards.has(id));
 const effects=active.filter(id=>cards.get(id)?.type!=='Normal Monster');
 const unsupported=unsupportedEffects({cards},effects);
 // Only the verified Metamorphosis Fusion selection is enabled for guided play.
 const extra=deck.extra.filter(id=>!supportedFusions.has(id)).map(id=>cards.get(id)?.name??String(id));
 const legality=validateDeck(deck,cards).filter(i=>i.kind==='error').map(i=>i.message);
 const reasons=[...new Set([...unsupported,...missing.map(String),...extra,...legality])];
 return {supported:deck.main.length>=40&&deck.main.length<=60&&reasons.length===0,unsupported:reasons,missing};
}
