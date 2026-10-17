import type {Card,Deck} from '../core/types';
/** Declarative, audited relationships. These are documented interaction hypotheses, NOT duel outcomes. */
export type Synergy = {id:string; requires:string[]; purpose:string; evidence:string; status:'documented'|'engine-verified'; testedEffects:number[]};
export const GOAT_SYNERGIES:Synergy[]=[
 {id:'thunder-chaos',requires:['Thunder Dragon','Chaos Sorcerer'],purpose:'Thunder Dragon supplies LIGHT cards for Chaos summoning setup, subject to Graveyard and summon requirements.',evidence:'GoatFormat Chaos Turbo archetype guide',status:'documented',testedEffects:[]},
 {id:'goat-meta',requires:['Scapegoat','Metamorphosis'],purpose:'Scapegoat tokens are compatible with the classic Metamorphosis / Thousand-Eyes Restrict package subject to historical rules.',evidence:'GoatFormat Goat Control archetype resources',status:'documented',testedEffects:[]},
 {id:'faith-spell',requires:['Magician of Faith','Pot of Greed'],purpose:'Magician of Faith can recur Normal Spells such as Pot of Greed from the Graveyard when its flip effect resolves.',evidence:'Card texts and GoatFormat rulings; flip resolution not implemented',status:'documented',testedEffects:[]}
];
export type DeckSynergyFinding={id:string;purpose:string;evidence:string;status:'documented'|'engine-verified';missing:string[]};
export function analyzeSynergies(deck:Deck,cards:readonly Card[]):DeckSynergyFinding[]{const names=new Set(deck.main.map(id=>cards.find(c=>c.id===id)?.name).filter((x):x is string=>Boolean(x)));return GOAT_SYNERGIES.filter(x=>x.requires.some(name=>names.has(name))).map(x=>({id:x.id,purpose:x.purpose,evidence:x.evidence,status:x.status,missing:x.requires.filter(name=>!names.has(name))}));}
