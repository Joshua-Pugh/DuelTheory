import type {Card} from '../core/types';
import type {DuelState,LegalAction,Seat} from '../engine/model';
/** Public attachments matter: destroying Premature/Call can remove two cards at once. */
export function removalPayoff(s:DuelState,id:string|undefined,seat:Seat,worth:(id:string)=>number){
 if(!id||!s.cards[id])return 0;
 const c=s.cards[id];let value=worth(id);
 if(!c.faceDown&&[70828912,97077563].includes(c.cardId)&&c.linkedTarget){const linked=s.cards[c.linkedTarget];if(linked?.location==='monster')value+=linked.controller!==seat?worth(linked.instanceId):-worth(linked.instanceId);}
 return value;
}
/** Separate voluntary friendly fire from compulsory targeting and non-destructive effects. */
export function sensibleActions(s:DuelState,actions:readonly LegalAction[],seat:Seat,catalog:readonly Card[]){
 const cards=new Map(catalog.map(c=>[c.id,c]));
 return actions.filter(a=>{
  if(a.seat!==seat)return false;
  const target='targetId'in a?a.targetId:undefined;
  if(target&&(a.type==='ACTIVATE_MST'||a.type==='ACTIVATE_DECK_EFFECT'&&['RAIGEKI_BREAK','BREAKER_DESTROY'].includes(a.effectId))){
   const card=cards.get(s.cards[target]?.cardId);
   if(s.chain.some(link=>link.instanceId===target)&&card&&!['Continuous','Equip','Field'].includes(card.race??''))return false;
  }
  if(!target||s.cards[target]?.controller!==seat)return true;
  if(a.type==='ACTIVATE_MST')return false;
  if(a.type!=='ACTIVATE_DECK_EFFECT')return true;
  if(a.effectId==='RING'){const damage=Number(cards.get(s.cards[target].cardId)?.atk)||0;return damage>=s.players[seat===0?1:0].lp&&damage<s.players[seat].lp;}
  return !['NOBLEMAN','RAIGEKI_BREAK','BREAKER_DESTROY','CHAOS_BANISH'].includes(a.effectId);
 });
}
