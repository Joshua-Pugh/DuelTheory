import {MIMIC} from './goatControlEffects';
import {draw,getCard,revealEffectCards,log,placeMonster,removeFromHand,seededShuffle,toBanished,toGraveyard,type DuelState,type EngineContext,type ChainLink,type LegalAction,type Seat} from './model';
export const MERCHANT=32362575;
export const SPY=24317029,NIGHT=16226786,KYCOO=88240808,CARD_DESTRUCTION=72892473,RAIGEKI_BREAK=4178474,DUSTSHOOT=64697231;
export const chaosEffectIds=new Set([MERCHANT,SPY,NIGHT,KYCOO,CARD_DESTRUCTION,RAIGEKI_BREAK,DUSTSHOOT,83011278]);
const other=(s:Seat):Seat=>s===0?1:0;
export function chaosResponses(s:DuelState,_ctx:EngineContext,seat:Seat):LegalAction[]{
 const p=s.players[seat],actions:LegalAction[]=[];
 for(const id of p.zones.spell){const c=id?s.cards[id]:undefined;if(!id||!c?.faceDown||c.setTurn===s.turn)continue;
  if(c.cardId===RAIGEKI_BREAK)for(const costId of p.hand)for(const targetId of [...s.players[0].zones.monster,...s.players[1].zones.monster,...s.players[0].zones.spell,...s.players[1].zones.spell].filter((x):x is string=>Boolean(x)&&x!==id))actions.push({type:'ACTIVATE_DECK_EFFECT',seat,instanceId:id,effectId:'RAIGEKI_BREAK',zone:c.zone,costId,targetId,description:'Raigeki Break · discard 1; destroy a card'});
  if(c.cardId===DUSTSHOOT&&s.players[other(seat)].hand.length>=4)actions.push({type:'ACTIVATE_DECK_EFFECT',seat,instanceId:id,effectId:'DUSTSHOOT',zone:c.zone,description:'Trap Dustshoot · reveal opponent hand and return a monster'});
 }return actions;
}
export function chaosMain(s:DuelState,seat:Seat):LegalAction[]{const p=s.players[seat];return [...p.hand,...p.zones.spell.filter((x):x is string=>Boolean(x)&&Boolean(s.cards[x!].faceDown))].flatMap(id=>s.cards[id].cardId!==CARD_DESTRUCTION?[]:(s.cards[id].location==='spell'?[s.cards[id].zone!]:p.zones.spell.flatMap((v,i)=>v===null?[i]:[])).map(zone=>({type:'ACTIVATE_DECK_EFFECT' as const,seat,instanceId:id,effectId:'CARD_DESTRUCTION' as const,zone,description:'Card Destruction · both players discard, then draw'})));}
export function chaosFlip(s:DuelState,id:string){const c=s.cards[id];if(c.cardId===SPY||c.cardId===NIGHT||c.cardId===MERCHANT||c.cardId===MIMIC)(s.pendingTriggers??=[]).push({sourceId:id,controller:c.controller,effectId:c.cardId===MIMIC?'MIMIC_DRAW':c.cardId===MERCHANT?'MERCHANT_EXCAVATE':c.cardId===SPY?'SPY_SUMMON':'NIGHT_DESTROY',mandatory:true});}
export function resolveChaos(s:DuelState,link:ChainLink,ctx:EngineContext):boolean{
 const seat=link.controller,p=s.players[seat],target=link.targets[0];
 if(link.effectId==='MERCHANT_EXCAVATE'){
  const revealed:string[]=[];let added:string|undefined;
  while(p.deck.length){const id=p.deck.shift()!;revealed.push(getCard(s,id,ctx).name);
   if(/Spell|Trap/.test(getCard(s,id,ctx).type)){p.hand.push(id);s.cards[id].location='hand';s.cards[id].zone=undefined;added=id;break;}
   toGraveyard(s,id,'effect');
  }
  if(added)revealEffectCards(s,seat,[added],ctx,'Magical Merchant added to hand');log(s,'EXCAVATE',`Magical Merchant revealed: ${revealed.join(', ')||'no cards'}. ${added?`Added ${getCard(s,added,ctx).name} to hand; sent the other revealed cards to the Graveyard.`:'No Spell or Trap found; sent the revealed cards to the Graveyard.'}`,seat);
 }else if(link.effectId==='SPY_SUMMON'){
  const card=target?getCard(s,target,ctx):undefined;
  if(target&&p.deck.includes(target)&&card?.name.startsWith("Gravekeeper's")&&Number(card.atk)<=1500&&link.monsterZone!==undefined&&p.zones.monster[link.monsterZone]===null){p.deck.splice(p.deck.indexOf(target),1);placeMonster(s,target,seat,link.monsterZone,link.declaredType==='attack'?'attack':'faceUpDefense',['attack','faceUpDefense']);}
  p.deck=seededShuffle(p.deck,s.seed+s.events.length*7919);
 }else if(link.effectId==='NIGHT_DESTROY'){if(s.cards[target]?.location==='monster'&&s.cards[target].controller!==seat)toGraveyard(s,target);}
 else if(link.effectId==='NIGHT_RECOVER'){if(target!==link.instanceId&&p.graveyard.includes(target)&&getCard(s,target,ctx).type.includes('Flip')){p.graveyard.splice(p.graveyard.indexOf(target),1);p.hand.push(target);s.cards[target].location='hand';revealEffectCards(s,seat,[target],ctx,'Night Assailant returned a Flip monster');}}
 else if(link.effectId==='KYCOO_BANISH'){for(const id of link.searchIds??[])if(s.players[other(seat)].graveyard.includes(id)&&getCard(s,id,ctx).type.includes('Monster'))toBanished(s,id);}
 else if(link.effectId==='RAIGEKI_BREAK'){if(['monster','spell'].includes(s.cards[target]?.location))toGraveyard(s,target);}
 else if(link.effectId==='DUSTSHOOT'){
  s.pendingChaos={kind:'DUSTSHOOT',sourceId:link.instanceId,controller:seat};s.priority=seat;return true;
 }else if(link.effectId==='CARD_DESTRUCTION'){
  const hands=s.players.map(player=>[...player.hand]);
  for(const owner of [seat,other(seat)])for(const id of hands[owner]){removeFromHand(s.players[owner],id);toGraveyard(s,id,'discard');}
  // Both hands are discarded before either player draws. Trigger effects wait until resolution ends.
  for(const owner of [seat,other(seat)])draw(s,owner,hands[owner].length);
 }else return false;
 log(s,'RESOLVE',`${link.effectId.replaceAll('_',' ')} resolved.`,seat);return true;
}
