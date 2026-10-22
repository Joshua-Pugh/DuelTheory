import type {Card} from '../core/types';
import type {DuelState,Seat} from '../engine/model';
/** Soft matchup clues from public cards, never the registered deck, hand, or set identity.
 * The estimates are heuristic priors, not calibrated probabilities or certainty.
 */
export function publicSetRead(s:DuelState,seat:Seat,cards:ReadonlyMap<number,Card>){
 const opponent=seat===0?1:0;
 const visible=Object.values(s.cards).filter(c=>c.owner===opponent&&c.cardId!==0&&!c.faceDown&&!c.equippedHidden&&(['graveyard','banished'].includes(c.location)||['monster','spell'].includes(c.location)))
  .map(c=>cards.get(c.cardId)).filter((c):c is Card=>!!c);
 const flips=visible.filter(c=>c.type.includes('Flip'));
 const recruiters=visible.filter(c=>[83011277,83011278,77044671,97017120].includes(c.id));
 const tributeThreat=visible.some(c=>c.type.includes('Monster')&&Number(c.level)>=5&&!c.type.includes('Fusion')&&!c.type.includes('Ritual')&&!/cannot be normal summoned/i.test(c.desc));
 const recovery=flips.some(c=>c.id===31560081)&&s.players[opponent].graveyard.some(id=>cards.get(s.cards[id].cardId)?.type.includes('Spell'));
 const clues=[...flips,...recruiters];
 // Shrink a small sample toward the neutral prior; one Faith does not identify a set.
 const defenseEstimate=Math.round(Math.max(1100,Math.min(2100,(3600+clues.reduce((n,c)=>n+(Number(c.def)||0),0))/(2+clues.length))));
 const urgency=(flips.length?200:0)+(recovery?350:0)+(tributeThreat?300:0);
 const reason=clues.length?`Public ${flips.length?'flip-engine':'recruiter'} cards suggest possible sets${recovery?' with spell recovery':''}${tributeThreat?' and tribute follow-up':''}; the set identity is still unknown.`:tributeThreat?'Revealed high-level monsters make a set body possible tribute material; its identity is unknown.':'No reliable public matchup clues; use a neutral unknown-defender estimate.';
 return {defenseEstimate,urgency,flipEngine:flips.length>0,tributeThreat,reason};
}
