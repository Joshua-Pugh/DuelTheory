import {trapNegated} from '../engine/trapStatus';
import {battleAttack} from '../engine/ritualDeckEffects';
import type {Card} from '../core/types';
import type {DuelState,LegalAction,Seat} from '../engine/model';
/** Public attachments matter: destroying Premature/Call can remove two cards at once. */
export function removalPayoff(s:DuelState,id:string|undefined,seat:Seat,worth:(id:string)=>number){
 if(!id||!s.cards[id])return 0;
 const c=s.cards[id];let value=worth(id);
 if(!c.faceDown&&[70828912,97077563].includes(c.cardId)&&c.linkedTarget){const linked=s.cards[c.linkedTarget];if(linked?.location==='monster')value+=linked.controller!==seat?worth(linked.instanceId):-worth(linked.instanceId);}
 return value;
}
/** Only count unopposed friendly removals as committed; a new enemy link may change the outcome. */
export function committedRemoval(s:DuelState,id:string,seat:Seat){
 let lastOpponent=-1;s.chain.forEach((l,i)=>{if(l.controller!==seat)lastOpponent=i;});
 return s.chain.some((l,i)=>i>lastOpponent&&l.controller===seat&&l.targets.includes(id)&&['RAIGEKI_BREAK','RING','ZABORG_DESTROY','NIGHT_DESTROY','CHAOS_BANISH'].includes(l.effectId));
}
/** Separate voluntary friendly fire from compulsory targeting and non-destructive effects. */
export function sensibleActions(s:DuelState,actions:readonly LegalAction[],seat:Seat,catalog:readonly Card[]){
 const cards=new Map(catalog.map(c=>[c.id,c]));
 return actions.filter(a=>{
  if(a.seat!==seat)return false;
  if(a.type==='ACTIVATE_POT_OF_GREED'&&s.players[seat].deck.length<2||a.type==='ACTIVATE_GRACEFUL_CHARITY'&&s.players[seat].deck.length<3)return false;
  const source='instanceId'in a?a.instanceId:undefined;
  // An earlier friendly response already handles this target. Keep follow-up
  // interaction unless an opponent has added another link since that response.
  const targetId='targetId'in a?a.targetId:undefined;
  const responseKind=a.type==='ACTIVATE_BOOK_OF_MOON'?'BOOK_OF_MOON':a.type==='ACTIVATE_DECK_EFFECT'&&['RAIGEKI_BREAK','RING'].includes(a.effectId)?'removal':undefined;
  if(targetId&&responseKind){
   if(responseKind==='BOOK_OF_MOON'&&s.chain.some(l=>l.effectId==='BOOK_OF_MOON_SET'&&l.targets.includes(targetId)))return false;
   let lastOpponent=-1;s.chain.forEach((l,i)=>{if(l.controller!==seat)lastOpponent=i;});
   if(s.chain.some((l,i)=>i>lastOpponent&&l.controller===seat&&l.targets.includes(targetId)&&['RAIGEKI_BREAK','RING','ZABORG_DESTROY','NIGHT_DESTROY','CHAOS_BANISH'].includes(l.effectId)))return false;
  }
  if(a.type==='DECLARE_ATTACK'||a.type==='REPLAY_ATTACK'){
   const attacker=a.type==='DECLARE_ATTACK'?a.attackerId:s.pendingAttack?.attackerId;
   if(attacker&&s.cards[attacker]?.token&&battleAttack(s,attacker,{cards})<=0)return false;
  }
  if(source&&a.type.startsWith('ACTIVATE')&&cards.get(s.cards[source]?.cardId)?.type.includes('Trap')&&trapNegated(s,source))return false;
  if((a.type==='DECLARE_ATTACK'||a.type==='REPLAY_ATTACK')&&a.targetId){
   const attacker=a.type==='DECLARE_ATTACK'?a.attackerId:s.pendingAttack?.attackerId,target=s.cards[a.targetId];
   if(attacker&&target&&!target.faceDown){const ctx={cards},power=battleAttack(s,attacker,ctx),defender=cards.get(target.cardId),guard=target.position==='attack'?battleAttack(s,a.targetId,ctx):Number(defender?.def)||0;
    // Lily's publicly available boost is a known combat threat, not hidden information.
    if(target.cardId===79575620&&s.players[target.controller].lp>2000&&power<guard+3000)return false;
    // Never throw an ordinary resource monster away just to reduce board size.
    const lady=s.cards[attacker].cardId===7572887&&s.players[seat].lp>Math.max(0,guard-power);
    if(target.position==='attack'&&power<guard&&!lady&&![83011277,83011278,26202165].includes(s.cards[attacker].cardId))return false;
   }
  }
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
