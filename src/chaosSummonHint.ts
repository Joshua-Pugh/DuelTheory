import type {Card} from './core/types';
import type {DuelState} from './engine/model';
/** Explain unavailable Chaos summons without exposing hidden opposing cards. */
export function chaosSummonHint(s:DuelState,id:string,cards:ReadonlyMap<number,Card>,manual:boolean):string|undefined {
 const c=s.cards[id];if(!c||![72989439,9596126].includes(c.cardId)||c.location!=='hand')return;
 if(manual)return 'Full manual match: banish 1 LIGHT and 1 DARK monster yourself, then use Summon / place. Start a guided match with supported decks to automate this summon.';
 const p=s.players[c.controller],opp=s.players[c.controller===0?1:0];
 if(opp.zones.monster.some(id=>id&&!s.cards[id].faceDown&&s.cards[id].cardId===88240808))return 'Kycoo the Ghost Destroyer prevents you from banishing cards from either Graveyard, so this Special Summon is unavailable.';
 if(c.controller!==s.current)return 'Special Summon this monster during your own Main Phase.';
 if(!['MAIN_1','MAIN_2'].includes(s.phase))return 'Special Summon this monster during Main Phase 1 or 2.';
 if(!p.zones.monster.includes(null))return 'You need an empty Monster Zone.';
 const attributes=p.graveyard.map(id=>cards.get(s.cards[id].cardId)).filter(card=>card?.type.includes('Monster')).map(card=>card!.attribute);
 if(!attributes.includes('LIGHT')||!attributes.includes('DARK'))return 'You need 1 LIGHT monster and 1 DARK monster in your own Graveyard to banish.';
 return 'Finish the current draw, effect, or response window before Special Summoning.';
}
