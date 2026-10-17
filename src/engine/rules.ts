import {chaosFlip,chaosEffectIds} from './chaosTurboEffects';
import {deckMainActions,dispatchDeckEffect,resolveDeckEffect,summonDeckTriggers,faceUpMonsters,battleAttack,deckResponseActions,ritualDeckEffectIds,TSUKUYOMI,SERPENT,SHINATO} from './ritualDeckEffects';
import {addDeckCardToHand,recoverGraveCard,drawEffect} from './operations';
import {ritualDefinitions,CONTRACT_WITH_THE_DARK_MASTER,SHINATOS_ARK} from './rituals';
import {type DuelAction,type DuelState,type EngineContext,type LegalAction,type Seat,getCard,isNormalSummonable,isSpellTrap,phases,draw,removeFromHand,toGraveyard,sendMaterialToGraveyard,materialCombinations,placeMonster,toBanished,log,DuelEngineError,settleLifePoints,detachFaceDown,returnToHand} from './model';
export const POT_OF_GREED=55144522;
export const GRACEFUL_CHARITY=79571449;
export const MYSTICAL_SPACE_TYPHOON=5318639;
export const CONTRACT_WITH_THE_ABYSS=69035382;
export const MANJU=95492061;
export const SENJU=23401839;
export const THUNDER_DRAGON=31786629;
export const SANGAN=26202165;
export const MAGICIAN_OF_FAITH=31560081;
export const DEKOICHI=87621407;
export const MYSTIC_TOMATO=83011278;
export const SHINING_ANGEL=95956346;
export const MIRROR_FORCE=44095762;
export const BOOK_OF_MOON=14087893;
export const DD_WARRIOR_LADY=7572887;
export const APPRENTICE_MAGICIAN=9156135;
/** Explicitly verified Spell Counter capacities. Unmodeled cards must not be treated as legal targets. */
const spellCounterCapacity:Readonly<Record<number,number>>={71413901:1,70791313:3,73752131:3,46363422:3};
function spellCounterTargets(s:DuelState):string[]{
 return [...s.players[0].zones.monster,...s.players[1].zones.monster]
 .filter((id):id is string=>Boolean(id))
 .filter(id=>!s.cards[id].faceDown && (s.cards[id].spellCounters??0)<(spellCounterCapacity[s.cards[id].cardId]??0));
}
function enqueueApprenticeSummon(s:DuelState,id:string,seat:Seat){
 if(s.cards[id].cardId===APPRENTICE_MAGICIAN && !s.cards[id].faceDown && spellCounterTargets(s).length){
  (s.pendingTriggers??=[]).push({sourceId:id,controller:seat,effectId:'APPRENTICE_COUNTER',mandatory:true});
  log(s,'TRIGGER_QUEUED','Apprentice Magician summon counter effect queued.',seat);
 }
}

export const SAKURETSU_ARMOR=56120475;
const isSpell=(s:DuelState,id:string,ctx:EngineContext)=>getCard(s,id,ctx).type.includes('Spell');
/** Queue mandatory triggers before optional triggers in turn-player order.
 * This implements a bounded subset of SEGOC: only supported triggers may join.
 * Ordering choices remain with the controller; unresolved optional effects may be declined. */
function triggerOptions(s:DuelState,ctx:EngineContext,seat:Seat):LegalAction[]{
 const pending=s.pendingTriggers??[];
 if(!pending.length)return [];
 const mandatory=pending.filter(t=>t.mandatory);
 const candidates=mandatory.length?mandatory:pending;
 const firstSeat=candidates.some(t=>t.controller===s.current)?s.current:(s.current===0?1:0);
 if(seat!==firstSeat)return [];
 const p=s.players[seat];
 return candidates.filter(t=>t.controller===seat).flatMap(t=>{
  if(t.effectId==='KYCOO_BANISH'){const blocked=s.players[other(seat)].zones.monster.some(id=>id&&!s.cards[id].faceDown&&s.cards[id].cardId===88240808);const ids=(blocked?[]:s.players[other(seat)].graveyard).filter(id=>getCard(s,id,ctx).type.includes('Monster')&&(!t.eligibleIds||t.eligibleIds.includes(id))),sets:string[][]=[[]];for(let i=0;i<ids.length;i++){sets.push([ids[i]]);for(let j=i+1;j<ids.length;j++)sets.push([ids[i],ids[j]]);}return sets.map(searchIds=>({type:'ACTIVATE_TRIGGER' as const,seat,sourceId:t.sourceId,searchIds,description:'Kycoo · banish up to two monsters from opponent Graveyard'}));}
  if(t.effectId==='SPY_SUMMON'){const ids=p.deck.filter(id=>getCard(s,id,ctx).name.startsWith("Gravekeeper's")&&Number(getCard(s,id,ctx).atk)<=1500),zones=p.zones.monster.flatMap((id,i)=>id===null?[i]:[]);if(!ids.length||!zones.length)return [{type:'ACTIVATE_TRIGGER',seat,sourceId:t.sourceId,description:'Resolve Spy without a summon'}];return ids.flatMap(choiceId=>zones.flatMap(monsterZone=>['attack','faceUpDefense'].map(declaredType=>({type:'ACTIVATE_TRIGGER' as const,seat,sourceId:t.sourceId,choiceId,monsterZone,declaredType,description:'Spy · Special Summon a Gravekeeper'}))));}
  const ids=t.effectId==='NIGHT_DESTROY'?s.players[other(seat)].zones.monster.filter((id):id is string=>Boolean(id)):t.effectId==='NIGHT_RECOVER'?p.graveyard.filter(id=>id!==t.sourceId&&getCard(s,id,ctx).type.includes('Flip')):t.effectId==='DMOC_RECOVER'?p.graveyard.filter(id=>isSpell(s,id,ctx)):t.effectId==='TSUKUYOMI_SET'?faceUpMonsters(s):t.effectId==='BREAKER_COUNTER'||t.effectId==='SERPENT_RECOVER'?[]:t.effectId==='SANGAN_SEARCH'?p.deck.filter(id=>{const c=getCard(s,id,ctx);return c.type.includes('Monster')&&typeof c.atk==='number'&&c.atk<=1500;}):t.effectId==='MOF_RECOVER'?p.graveyard.filter(id=>isSpell(s,id,ctx)):(t.effectId==='TOMATO_SUMMON'||t.effectId==='SHINING_ANGEL_SUMMON')?p.deck.filter(id=>{const c=getCard(s,id,ctx);return c.type.includes('Monster')&&c.attribute===(t.effectId==='TOMATO_SUMMON'?'DARK':'LIGHT')&&typeof c.atk==='number'&&c.atk<=1500;}):t.effectId==='APPRENTICE_RECRUIT'?p.deck.filter(id=>{const c=getCard(s,id,ctx);return c.type.includes('Monster')&&c.race==='Spellcaster'&&Number(c.level)>0&&Number(c.level)<=2;}):t.effectId==='APPRENTICE_COUNTER'?spellCounterTargets(s):[];
  if(t.effectId==='TOMATO_SUMMON'||t.effectId==='SHINING_ANGEL_SUMMON'||t.effectId==='APPRENTICE_RECRUIT'){
   const zones=p.zones.monster.map((v,i)=>v===null?i:-1).filter(i=>i>=0);
   const actions:LegalAction[]=ids.flatMap(choiceId=>zones.map(monsterZone=>({type:'ACTIVATE_TRIGGER' as const,seat,sourceId:t.sourceId,choiceId,monsterZone,description:`${t.effectId==='APPRENTICE_RECRUIT'?'Apprentice Magician':t.effectId==='TOMATO_SUMMON'?'Mystic Tomato':'Shining Angel'}: Special Summon ${getCard(s,choiceId,ctx).name} in zone ${monsterZone+1}`})));
   actions.push({type:'DECLINE_PENDING_TRIGGER',seat,sourceId:t.sourceId,description:'Decline optional recruiter effect'});
   return actions;
  }
  if(t.effectId==='SERPENT_RECOVER')return [{type:'ACTIVATE_TRIGGER',seat,sourceId:t.sourceId,description:'Return Sinister Serpent to hand'},{type:'DECLINE_PENDING_TRIGGER',seat,sourceId:t.sourceId,description:'Leave Sinister Serpent in the Graveyard'}];
  const result:LegalAction[]=ids.length?ids.map(choiceId=>({type:'ACTIVATE_TRIGGER' as const,seat,sourceId:t.sourceId,choiceId,description:`Add ${t.effectId} to chain with ${getCard(s,choiceId,ctx).name}`})):[{type:'ACTIVATE_TRIGGER' as const,seat,sourceId:t.sourceId,description:`Activate ${t.effectId}`}];
  if(!t.mandatory)result.push({type:'DECLINE_PENDING_TRIGGER',seat,sourceId:t.sourceId,description:'Decline optional effect'});
  return result;
 });
}

const other=(seat:Seat):Seat=>seat===0?1:0;
const mainPhase=(s:DuelState)=>s.phase==='MAIN_1'||s.phase==='MAIN_2';
const ritualSearchable=(s:DuelState,ctx:EngineContext,seat:Seat,kind:'RITUAL_ANY'|'RITUAL_MONSTER')=>s.players[seat].deck.filter(id=>{const card=getCard(s,id,ctx);return (card.type.includes('Monster')&&card.type.includes('Ritual'))||(kind==='RITUAL_ANY'&&card.type.includes('Spell')&&(card.race==='Ritual'||card.type.includes('Ritual')));});
const onField=(s:DuelState,id:string)=>s.cards[id]?.location==='spell';
const targets=(s:DuelState)=>[...s.players[0].zones.spell,...s.players[1].zones.spell].filter((id):id is string=>id!==null);
function mstActions(s:DuelState,ctx:EngineContext,seat:Seat):LegalAction[]{
 const p=s.players[seat]; const eligible=[...p.hand,...p.zones.spell.filter((x):x is string=>x!==null)]; const actions:LegalAction[]=[];
 for(const id of eligible){if(s.cards[id].cardId!==MYSTICAL_SPACE_TYPHOON)continue;const instance=s.cards[id];if(instance.location==='hand' && (seat!==s.current||!mainPhase(s)))continue;
 if(instance.location==='spell' && (!instance.faceDown||instance.setTurn===s.turn))continue;
 const freeZones=instance.location==='hand'?p.zones.spell.map((v,i)=>v===null?i:-1).filter(i=>i>=0):[instance.zone!];
 for(const zone of freeZones)for(const targetId of targets(s)){if(targetId===id)continue;actions.push({type:'ACTIVATE_MST',seat,instanceId:id,zone,targetId,description:`Chain/activate MST targeting ${getCard(s,targetId,ctx).name} (${targetId})`});}
 }
 return actions;
}
/** Quick-Play position effects are offered only during an appropriate window.
 * A newly Set Quick-Play Spell cannot activate that turn, even on its controller's turn.
 */
function bookActions(s:DuelState,ctx:EngineContext,seat:Seat):LegalAction[]{
 const p=s.players[seat];const actions:LegalAction[]=[];
 const faceUp=[...s.players[0].zones.monster,...s.players[1].zones.monster]
  .filter((id):id is string=>id!==null && !s.cards[id].faceDown && s.cards[id].position!=='faceDownDefense');
 for(const id of [...p.hand,...p.zones.spell.filter((x):x is string=>x!==null)]){
  const instance=s.cards[id];if(instance.cardId!==BOOK_OF_MOON)continue;
  if(instance.location==='hand' && (seat!==s.current||!mainPhase(s)||s.pendingAttack!==undefined))continue;
  if(instance.location==='spell' && (!instance.faceDown||instance.setTurn===s.turn))continue;
  const zones=instance.location==='hand'?p.zones.spell.map((v,i)=>v===null?i:-1).filter(i=>i>=0):[instance.zone!];
  for(const zone of zones)for(const targetId of faceUp)actions.push({type:'ACTIVATE_BOOK_OF_MOON',seat,instanceId:id,zone,targetId,description:`Book of Moon: Set ${getCard(s,targetId,ctx).name} face-down in Defense Position`});
 }
 return actions;
}
/** Conservative action generator. Response windows beyond an already-open chain are not implemented. */
function ritualChoices(s:DuelState,ctx:EngineContext,seat:Seat,only?:string):LegalAction[]{const p=s.players[seat],actions:LegalAction[]=[];
 for(const spellId of (only?[only]:[...p.hand,...p.zones.spell.filter((id):id is string=>id!==null&&Boolean(s.cards[id].faceDown))])){const definition=ritualDefinitions[s.cards[spellId].cardId];if(!definition)continue;
 for(const ritualId of p.hand){const ritual=getCard(s,ritualId,ctx);if(!definition.eligible(ritual))continue;
 const combos=materialCombinations(s,ctx,seat,Number(ritual.level),[spellId,ritualId],definition.levelRule);
 for(let zone=0;zone<5;zone++)if(only?zone===(s.cards[only].zone??0):p.zones.spell[zone]===null||p.zones.spell[zone]===spellId)for(const materials of combos)for(let monsterZone=0;monsterZone<5;monsterZone++){
 if(p.zones.monster[monsterZone]!==null&&!materials.includes(p.zones.monster[monsterZone]!))continue;
 actions.push({type:'ACTIVATE_CONTRACT',seat,instanceId:spellId,zone,ritualId,materials,monsterZone,description:`${definition.label}: Ritual Summon ${ritual.name} with ${definition.levelRule==='EXACT'?'exactly':'at least'} ${ritual.level} Levels`});
 }}}
return actions;}
export function legalActions(s:DuelState,ctx:EngineContext,seat:Seat):LegalAction[]{
 if(s.winner!==null||s.drawnGame)return [];
 if(s.pendingChaos){if(seat!==s.pendingChaos.controller)return [];const hand=s.players[other(seat)].hand;const monsters=hand.filter(id=>getCard(s,id,ctx).type.includes('Monster'));return monsters.length?monsters.map(targetId=>({type:'COMPLETE_DUSTSHOOT' as const,seat,targetId,description:'Trap Dustshoot · return a revealed monster'})):[{type:'COMPLETE_DUSTSHOOT',seat,description:'No monster in revealed hand · finish inspection'}];}
 if(s.pendingRoll)return seat===s.pendingRoll.controller?[{type:'COMPLETE_DIE_ROLL',seat,description:'Apply the die result'}]:[];
 if(s.pendingRandomDiscard)return seat===s.pendingRandomDiscard.controller?s.pendingRandomDiscard.order.map((_,index)=>({type:'CHOOSE_RANDOM_DISCARD' as const,seat,index,description:`Select face-down card ${index+1} for the random discard`})) : [];
 if(s.pendingDeckChoice){const pending=s.pendingDeckChoice;if(seat!==pending.controller)return [];return s.players[other(seat)].zones.monster.filter((id):id is string=>id!==null).map(targetId=>({type:'COMPLETE_ZORC' as const,seat,sourceId:pending.sourceId,targetId,description:'Zorc: choose a monster to destroy'}));}
 if(s.pendingDiscard){
  if(seat!==s.pendingDiscard.controller)return [];
  const hand=s.players[seat].hand,options:LegalAction[]=[];
  if(s.pendingDiscard.count===1)return hand.map(id=>({type:'CHOOSE_DISCARD' as const,seat,discardIds:[id],description:'Delinquent Duo: choose 1 card to discard'}));
  for(let i=0;i<hand.length;i++)for(let j=i+1;j<hand.length;j++)options.push({type:'CHOOSE_DISCARD',seat,discardIds:[hand[i],hand[j]],description:'Graceful Charity: discard 2 cards'});
  return options;
 }
 if(s.pendingAttack?.damageStep && s.chain.length===0){
  if(s.pendingAttack.damageStep==='AFTER_CALCULATE' && s.pendingAttack.ddLadyId){
   const lady=s.cards[s.pendingAttack.ddLadyId];if(seat!==lady.controller)return [];
   return [{type:'ACTIVATE_DD_WARRIOR_LADY',seat,description:'D.D. Warrior Lady: banish both battling monsters after damage calculation'},
    {type:'DECLINE_DD_WARRIOR_LADY',seat,description:'Decline D.D. Warrior Lady effect'}];
  }
  if(seat!==s.pendingAttack.attacker)return [];
  return [{type:'ADVANCE_DAMAGE_STEP',seat,description:`Advance Damage Step: ${s.pendingAttack.damageStep}`}];
 }
 if(s.pendingAttack?.replay && s.chain.length===0){
  const pending=s.pendingAttack;
  if(seat!==pending.attacker)return [];
  const attacker=s.cards[pending.attackerId];
  if(!attacker||attacker.location!=='monster'||attacker.controller!==seat)return [];
  const defenders=s.players[pending.defender].zones.monster.filter((id):id is string=>id!==null);
  const options:LegalAction[]=[{type:'CANCEL_REPLAY',seat,description:'Stop this attack (attacker cannot attack again this turn)'}];
  if(defenders.length){for(const targetId of defenders){
   const card=getCard(s,targetId,ctx);
   
   if(!Number.isFinite(s.cards[targetId].position==='attack'?card.atk:card.def))continue;
   options.push({type:'REPLAY_ATTACK',seat,targetId,description:`Replay attack targeting ${s.cards[targetId].faceDown?'face-down monster in zone '+(s.cards[targetId].zone!+1):card.name}`});
  }}else options.push({type:'REPLAY_ATTACK',seat,description:'Replay as direct attack'});
  return options;
 }
 if(s.pendingAttack && s.chain.length===0){
  if(seat!==s.pendingAttack.defender)return [];
  const actions:LegalAction[]=[{type:'PASS_ATTACK_RESPONSE',seat,description:'Pass attack response and proceed to damage'}];
  for(const id of s.players[seat].zones.spell){if(!id)continue;const card=s.cards[id];if(!card.faceDown||card.setTurn===s.turn)continue;
   if(card.cardId===MIRROR_FORCE)actions.push({type:'ACTIVATE_ATTACK_TRAP',seat,instanceId:id,effectId:'MIRROR_FORCE',description:'Activate Mirror Force: destroy all opponent Attack Position monsters'});
   if(card.cardId===SAKURETSU_ARMOR)actions.push({type:'ACTIVATE_ATTACK_TRAP',seat,instanceId:id,effectId:'SAKURETSU_ARMOR',targetId:s.pendingAttack.attackerId,description:'Activate Sakuretsu Armor: destroy attacking monster'});
  }
  actions.push(...bookActions(s,ctx,seat),...deckResponseActions(s,ctx,seat));
  return actions;
 }
 if(s.pendingTriggers?.length)return triggerOptions(s,ctx,seat);
 if(s.pendingRitual){if(seat!==s.pendingRitual.controller)return [];const choices=ritualChoices(s,ctx,seat,s.pendingRitual.sourceId);return choices.length?choices:[{type:'FINISH_RITUAL',seat,description:'Ritual has no remaining legal materials'}];}
 if(s.pendingSearch){if(s.pendingSearch.controller!==seat)return [];return [{type:'DECLINE_TRIGGER',seat,description:'Decline optional search trigger'},...ritualSearchable(s,ctx,seat,s.pendingSearch.kind).map(searchId=>({type:'TRIGGER_SEARCH' as const,seat,sourceId:s.pendingSearch!.sourceId,searchId,description:`Activate search trigger: add ${getCard(s,searchId,ctx).name} to hand`}))];}
 if(s.chain.length){if(seat!==s.priority)return [];const actions=[...mstActions(s,ctx,seat),...bookActions(s,ctx,seat),...deckResponseActions(s,ctx,seat)];actions.push({type:'PASS_CHAIN',seat,description:'Pass chain response priority'});if(s.consecutivePasses===1)actions.push({type:'RESOLVE_CHAIN',seat,description:'Resolve chain (both players passed)'});return actions;}
 if(s.summonResponse){if(seat!==(s.summonResponse.priority??other(s.summonResponse.summoner)))return [];return [...deckResponseActions(s,ctx,seat),{type:'PASS_SUMMON_RESPONSE',seat,description:'Continue after summon'}];}
 if(s.freeResponse){if(s.freeResponse.priority!==seat)return [];return [...freeResponses(s,ctx,seat),{type:'PASS_FREE_RESPONSE',seat,description:'Continue after response opportunity'}];}
 if(s.current!==seat)return [];
 if(s.pendingDraw)return [{type:'DRAW_PHASE',seat,description:s.turn===1?'Begin first turn (no opening draw)':'Draw for Draw Phase'}];
 const actions:LegalAction[]=[];
 if(s.phase==='BATTLE'&&s.turn>1){
  const defenders=s.players[other(seat)].zones.monster.filter((id):id is string=>id!==null);
  for(const attackerId of s.players[seat].zones.monster){
   if(!attackerId)continue;
   const instance=s.cards[attackerId];
   if(instance.position!=='attack'||instance.faceDown||(instance.attackedTurn===s.turn&&!(instance.extraAttackTurn===s.turn&&instance.attacksThisTurn?.turn===s.turn&&instance.attacksThisTurn.count===1))||instance.cannotAttackTurn===s.turn||!Number.isFinite(getCard(s,attackerId,ctx).atk))continue;
   if(defenders.length){for(const targetId of defenders){const target=s.cards[targetId];if(!Number.isFinite(target.position==='attack'?getCard(s,targetId,ctx).atk:getCard(s,targetId,ctx).def))continue;actions.push({type:'DECLARE_ATTACK',seat,attackerId,targetId,description:`Attack ${target.faceDown?'face-down monster in zone '+(target.zone!+1):getCard(s,targetId,ctx).name} with ${getCard(s,attackerId,ctx).name}`});}}
   else actions.push({type:'DECLARE_ATTACK',seat,attackerId,description:`Direct attack with ${getCard(s,attackerId,ctx).name}`});
  }
 }
 if(mainPhase(s)){const p=s.players[seat];
 for(const id of p.zones.monster){if(!id)continue;const instance=s.cards[id];
 if(!instance.faceDown&&instance.summonedTurn!==s.turn&&instance.lastPositionTurn!==s.turn&&instance.attackedTurn!==s.turn){
  if(instance.position==='attack')actions.push({type:'CHANGE_POSITION',seat,instanceId:id,position:'faceUpDefense',description:`Change ${getCard(s,id,ctx).name} to face-up Defense Position`});
  else if(instance.position==='faceUpDefense')actions.push({type:'CHANGE_POSITION',seat,instanceId:id,position:'attack',description:`Change ${getCard(s,id,ctx).name} to Attack Position`});
 }
 }
 for(const id of p.zones.monster){if(!id)continue;const instance=s.cards[id];if(instance.faceDown&&instance.summonedTurn!==s.turn&&instance.lastPositionTurn!==s.turn)actions.push({type:'FLIP_SUMMON',seat,instanceId:id,description:`Flip Summon ${getCard(s,id,ctx).name}`});}for(const id of p.hand){const card=getCard(s,id,ctx);if(isNormalSummonable(card)&&!p.normalSummoned){for(let zone=0;zone<5;zone++)if(p.zones.monster[zone]===null){actions.push({type:'NORMAL_SUMMON',seat,instanceId:id,zone,position:'attack',description:`Normal Summon ${card.name} in zone ${zone+1}`});actions.push({type:'NORMAL_SUMMON',seat,instanceId:id,zone,position:'faceDownDefense',description:`Set ${card.name} in monster zone ${zone+1}`});}}
 if(isSpellTrap(card)){for(let zone=0;zone<5;zone++)if(p.zones.spell[zone]===null){actions.push({type:'SET_SPELL_TRAP',seat,instanceId:id,zone,description:`Set ${card.name} in spell/trap zone ${zone+1}`});if(card.id===GRACEFUL_CHARITY)actions.push({type:'ACTIVATE_GRACEFUL_CHARITY',seat,instanceId:id,zone,description:'Activate Graceful Charity: draw 3, then discard 2'});if(card.id===POT_OF_GREED)actions.push({type:'ACTIVATE_POT_OF_GREED',seat,instanceId:id,zone,description:'Activate Pot of Greed: draw two cards'});}}}
 // Normal Spells previously Set may activate during either Main Phase, even on the Set turn.
 for(const id of p.zones.spell){if(!id||!s.cards[id].faceDown)continue;const c=s.cards[id];
  if(c.cardId===POT_OF_GREED)actions.push({type:'ACTIVATE_POT_OF_GREED',seat,instanceId:id,zone:c.zone!,description:'Activate Pot of Greed: draw two cards'});
  if(c.cardId===GRACEFUL_CHARITY)actions.push({type:'ACTIVATE_GRACEFUL_CHARITY',seat,instanceId:id,zone:c.zone!,description:'Activate Graceful Charity: draw 3, then discard 2'});
 }
 actions.push(...deckMainActions(s,ctx,seat));
 // Thunder Dragon: discard as activation cost; search zero, one or two remaining copies.
 for(const id of p.hand){if(s.cards[id].cardId!==THUNDER_DRAGON)continue;const matches=p.deck.filter(x=>s.cards[x].cardId===THUNDER_DRAGON);const selections:string[][]=[[]];for(let i=0;i<matches.length;i++){selections.push([matches[i]]);for(let j=i+1;j<matches.length;j++)selections.push([matches[i],matches[j]]);}for(const searchIds of selections)actions.push({type:'ACTIVATE_THUNDER_DRAGON',seat,instanceId:id,searchIds,description:`Discard Thunder Dragon to search ${searchIds.length} copy/copies`});}
 // Tribute Summons require one material for Levels 5–6, two for Level 7+; this slice excludes special summon-only monsters.
 if(!p.normalSummoned)for(const id of p.hand){const c=getCard(s,id,ctx);const level=Number(c.level||0);if([9596126,72989439].includes(c.id)||!c.type.includes('Monster')||c.type.includes('Ritual')||c.type.includes('Fusion')||c.type.includes('Special Summon')||level<5)continue;
 const need=level<=6?1:2;const materials=p.zones.monster.filter((x):x is string=>x!==null);
 for(let i=0;i<materials.length;i++){const sets=need===1?[[materials[i]]]:materials.slice(i+1).map(x=>[materials[i],x]);
 for(const chosen of sets)for(let zone=0;zone<5;zone++)if(p.zones.monster[zone]===null||chosen.includes(p.zones.monster[zone]!))for(const position of ['attack','faceDownDefense'] as const)actions.push({type:'TRIBUTE_SUMMON',seat,instanceId:id,zone,materials:chosen,position,description:`Tribute ${chosen.length} monster(s) to ${position==='attack'?'Summon':'Set'} ${c.name}`});}}
 // Data-driven Ritual definitions: eligibility and Level rule vary by Spell.
 const rituals=ritualChoices(s,ctx,seat);actions.push(...rituals);
 for(const a of rituals)if(a.type==='ACTIVATE_CONTRACT'&&!actions.some(x=>x.type==='BEGIN_RITUAL'&&x.instanceId===a.instanceId&&x.zone===a.zone))actions.push({type:'BEGIN_RITUAL',seat,instanceId:a.instanceId,zone:a.zone,description:'Activate Ritual Spell'});
 }
 actions.push(...mstActions(s,ctx,seat),...bookActions(s,ctx,seat),...deckResponseActions(s,ctx,seat));
 actions.push({type:'ADVANCE',seat,description:`Proceed from ${s.phase} to next phase`});return actions;
}

/** Battle proceeds through an explicit Damage Step. The first slice supports basic
 * damage calculation and the mandatory Flip effects of Magician of Faith / Dekoichi.
 * Other Damage Step activations are intentionally not offered. */
function advanceDamageStep(s:DuelState,ctx:EngineContext){
 const pending=s.pendingAttack!;
 switch(pending.damageStep){
  case 'START':
   pending.damageStep='FLIP';
   log(s,'DAMAGE_STEP','Entered Damage Step; proceeding to before damage calculation.',pending.attacker);
   break;
  case 'FLIP':{
   if(pending.targetId){
    const target=s.cards[pending.targetId];
    if(target?.location==='monster' && target.faceDown){
     target.faceDown=false;target.position='faceUpDefense';if(target.cardId===TSUKUYOMI)target.spiritReturnTurn=s.turn;
     if(target.cardId===MAGICIAN_OF_FAITH||target.cardId===DEKOICHI||target.cardId===TSUKUYOMI||target.cardId===24317029||target.cardId===16226786)pending.revealedFlip=target.instanceId;
     log(s,'BATTLE_FLIP',`${getCard(s,target.instanceId,ctx).name} flipped face-up by battle.`,pending.defender);
    }
   }
   pending.damageStep='CALCULATE';break;
  }
  case 'CALCULATE':
   calculateBasicDamage(s,ctx);
   pending.ddLadyId=pending.targetId && (s.cards[pending.targetId].cardId===DD_WARRIOR_LADY)?pending.targetId:
    pending.targetId && s.cards[pending.attackerId].cardId===DD_WARRIOR_LADY?pending.attackerId:undefined;
   pending.damageStep=pending.ddLadyId?'AFTER_CALCULATE':'END';break;
  case 'AFTER_CALCULATE':
   throw new DuelEngineError('ILLEGAL_ACTION','Resolve or decline D.D. Warrior Lady before advancing');
  case 'END':{
   for(const id of pending.battleDestruction??[]){if(s.cards[id]?.location==='monster')toGraveyard(s,id,'battle');}
   const flip=pending.revealedFlip;
   if(flip){
    const c=s.cards[flip];
    (s.pendingTriggers??=[]).push({sourceId:flip,controller:c.owner,effectId:c.cardId===24317029?'SPY_SUMMON':c.cardId===16226786?'NIGHT_DESTROY':c.cardId===TSUKUYOMI?'TSUKUYOMI_SET':c.cardId===MAGICIAN_OF_FAITH?'MOF_RECOVER':'DEKOICHI_DRAW',mandatory:true});
    log(s,'TRIGGER_QUEUED',`${getCard(s,flip,ctx).name} Flip Effect queued after damage, including if destroyed.`,c.owner);
   }
   if(pending.shinatoDamage)(s.pendingTriggers??=[]).push({sourceId:pending.attackerId,controller:pending.attacker,effectId:'SHINATO_DAMAGE',mandatory:true,value:pending.shinatoDamage});
   settleLifePoints(s);
   s.pendingAttack=undefined;s.priority=s.current;
   log(s,'DAMAGE_STEP_END','Damage Step ended.',pending.attacker);
   break;
  }
  default:throw new DuelEngineError('ILLEGAL_ACTION','Damage Step is not active');
 }
}
function calculateBasicDamage(s:DuelState,ctx:EngineContext){
 const pending=s.pendingAttack!;const seat=pending.attacker;
 const attacker=s.cards[pending.attackerId];
 const attackerCard=getCard(s,pending.attackerId,ctx);
 const lpBefore=s.players.map(p=>p.lp),gyBefore=s.players.map(p=>[...p.graveyard]);
 const battling=[pending.attackerId,...pending.targetId?[pending.targetId]:[]].map(id=>({id,controller:s.cards[id].controller,cardId:s.cards[id].cardId}));
 const atk=battleAttack(s,pending.attackerId,ctx);
 if(!Number.isFinite(atk)||atk<0)throw new DuelEngineError('UNSUPPORTED_EFFECT','Attack value unavailable');
 attacker.attackedTurn=s.turn;attacker.attacksThisTurn={turn:s.turn,count:attacker.attacksThisTurn?.turn===s.turn?attacker.attacksThisTurn.count+1:1};
 const opponent=other(seat);
 if(!pending.targetId){
  s.players[opponent].lp=Math.max(0,s.players[opponent].lp-atk);
  log(s,'BATTLE',`${attackerCard.name} attacked directly for ${atk} damage.`,seat);
 }else{
  const target=s.cards[pending.targetId];const defenderCard=getCard(s,pending.targetId,ctx);
  const wasDefense=target.position!=='attack';
  const defense=Number(wasDefense?defenderCard.def:battleAttack(s,pending.targetId,ctx));
  if(!Number.isFinite(defense)||defense<0)throw new DuelEngineError('UNSUPPORTED_EFFECT','Defender stat unavailable');
  if(atk>defense){
   if(pending.targetId && (target.cardId===DD_WARRIOR_LADY||attacker.cardId===DD_WARRIOR_LADY))(pending.battleDestruction??=[]).push(pending.targetId);else if(attacker.cardId===40737112)toBanished(s,pending.targetId,true);else toGraveyard(s,pending.targetId,'battle');
   if(!wasDefense)s.players[opponent].lp=Math.max(0,s.players[opponent].lp-(atk-defense));
  }else if(atk<defense){
   if(!wasDefense){if(target.cardId===DD_WARRIOR_LADY||attacker.cardId===DD_WARRIOR_LADY)(pending.battleDestruction??=[]).push(pending.attackerId);else toGraveyard(s,pending.attackerId,'battle');s.players[seat].lp=Math.max(0,s.players[seat].lp-(defense-atk));}
   else s.players[seat].lp=Math.max(0,s.players[seat].lp-(defense-atk));
  }else if(!wasDefense){if(target.cardId===DD_WARRIOR_LADY||attacker.cardId===DD_WARRIOR_LADY)pending.battleDestruction=[pending.attackerId,pending.targetId];else {toGraveyard(s,pending.attackerId,'battle');toGraveyard(s,pending.targetId,'battle');}}
  if(attacker.cardId===SHINATO&&wasDefense&&target.location==='graveyard')pending.shinatoDamage=Number(defenderCard.atk)||0;
 if(attacker.cardId===72989439&&atk>defense&&attacker.effectUsedTurn!==s.turn&&(attacker.attacksThisTurn?.count??0)===1)(s.pendingTriggers??=[]).push({sourceId:pending.attackerId,controller:seat,effectId:'BLS_EXTRA_ATTACK',mandatory:false});
  log(s,'BATTLE',`${attackerCard.name} attacked ${defenderCard.name} (${atk} vs ${defense} ${wasDefense?'DEF':'ATK'}).`,seat);
 }
 for(const c of battling)if(c.cardId===88240808&&s.players[other(c.controller)].lp<lpBefore[other(c.controller)])(s.pendingTriggers??=[]).push({sourceId:c.id,controller:c.controller,effectId:'KYCOO_BANISH',mandatory:false,eligibleIds:gyBefore[other(c.controller)]});
}
function freeResponses(s:DuelState,ctx:EngineContext,seat:Seat){return [...mstActions(s,ctx,seat),...bookActions(s,ctx,seat),...deckResponseActions(s,ctx,seat)];}
function openFreeResponse(s:DuelState,ctx:EngineContext){if(s.pendingDraw||s.winner!==null||s.drawnGame)return;const ready=([s.current,other(s.current)] as Seat[]).find(seat=>freeResponses(s,ctx,seat).length);if(ready!==undefined)s.freeResponse={priority:ready,passed:[]};}
function signature(a:DuelAction){return JSON.stringify(a);}
export function dispatchDuel(original:DuelState,action:DuelAction,ctx:EngineContext):DuelState{
 // RESOLVE_CHAIN is a convenience action after the first pass: it counts as the second pass.
 if(!legalActions(original,ctx,action.seat).some(x=>signature(Object.fromEntries(Object.entries(x).filter(([k])=>k!=='description')) as DuelAction)===signature(Object.fromEntries(Object.entries(action).filter(([k])=>k!=='description')) as DuelAction)))throw new DuelEngineError('ILLEGAL_ACTION',`Illegal ${action.type} during ${original.phase}; unsupported effects are never silently allowed.`);
 const s=structuredClone(original);const seat=action.seat;const p=s.players[seat];
 switch(action.type){
 case 'PASS_FREE_RESPONSE':{const window=s.freeResponse!,next=other(seat);window.passed.push(seat);if(!window.passed.includes(next)&&freeResponses(s,ctx,next).length)window.priority=next;else s.freeResponse=undefined;log(s,'PASS_RESPONSE','Passed the free-chain response opportunity.',seat);break;}
 case 'COMPLETE_DUSTSHOOT':case 'ACTIVATE_DECK_EFFECT':case 'SPECIAL_SUMMON_CHAOS':case 'PASS_SUMMON_RESPONSE':case 'COMPLETE_ZORC':case 'COMPLETE_DIE_ROLL':case 'CHOOSE_RANDOM_DISCARD':dispatchDeckEffect(s,action,ctx);if((action.type==='COMPLETE_DUSTSHOOT'||action.type==='COMPLETE_ZORC'||action.type==='COMPLETE_DIE_ROLL'||action.type==='CHOOSE_RANDOM_DISCARD')&&!s.pendingDiscard&&!s.pendingDeckChoice)resolveChain(s,ctx);break;
 case 'DECLARE_ATTACK':{
  s.pendingAttack={attackerId:action.attackerId,targetId:action.targetId,attacker:seat,defender:other(seat),defenderField:s.players[other(seat)].zones.monster.filter((id):id is string=>id!==null)};
  s.priority=other(seat);
  log(s,'ATTACK_DECLARE',`${getCard(s,action.attackerId,ctx).name} declared ${action.targetId?'an attack on '+(s.cards[action.targetId].faceDown?'a face-down monster':getCard(s,action.targetId,ctx).name):'a direct attack'}. Waiting for defender response.`,seat);
  break;
 }
 case 'CANCEL_REPLAY':{
  const pending=s.pendingAttack!;
  s.cards[pending.attackerId].attackedTurn=s.turn;
  log(s,'ATTACK_REPLAY_CANCEL','Attacking player ended the attack during a replay.',seat);
  s.pendingAttack=undefined;s.priority=s.current;break;
 }
 case 'REPLAY_ATTACK':{
  const pending=s.pendingAttack!;
  pending.targetId=action.targetId;pending.replay=false;
  pending.defenderField=s.players[pending.defender].zones.monster.filter((id):id is string=>id!==null);
  s.priority=pending.defender;
  log(s,'ATTACK_REPLAY',`Attacking player selected ${action.targetId?'a new attack target':'a direct attack'} after the replay.`,seat);
  break;
 }
 case 'ACTIVATE_ATTACK_TRAP':{
  const instance=s.cards[action.instanceId];instance.faceDown=false;
  s.chain.push({instanceId:action.instanceId,controller:seat,effectId:action.effectId,targets:action.targetId?[action.targetId]:[],spellSpeed:2});
  s.priority=other(seat);s.consecutivePasses=0;
  log(s,'ACTIVATE',`${action.effectId} activated in response to attack declaration.`,seat);
  break;
 }
 case 'PASS_ATTACK_RESPONSE':{
  log(s,'ATTACK_PASS',`Player ${seat+1} passes attack declaration response.`,seat);
  s.pendingAttack!.damageStep='START';
  s.priority=s.current;
  log(s,'DAMAGE_STEP','Attack response closed. Damage Step begins.',seat);
  break;
 }
 case 'ADVANCE_DAMAGE_STEP':{advanceDamageStep(s,ctx);break;}
 case 'DECLINE_DD_WARRIOR_LADY':{
  s.pendingAttack!.ddLadyId=undefined;s.pendingAttack!.damageStep='END';
  log(s,'TRIGGER_DECLINED','D.D. Warrior Lady optional banishment declined.',seat);break;
 }
 case 'ACTIVATE_DD_WARRIOR_LADY':{
  const pending=s.pendingAttack!;const sourceId=pending.ddLadyId!;
  pending.ddLadyId=undefined;pending.damageStep='END';
  s.chain.push({instanceId:sourceId,controller:seat,effectId:'DD_WARRIOR_LADY_BANISH',targets:[pending.attackerId,pending.targetId!],spellSpeed:1});
  s.priority=other(seat);s.consecutivePasses=0;
  log(s,'ACTIVATE','D.D. Warrior Lady effect activated after damage calculation.',seat);break;
 }
 case 'CHANGE_POSITION':{
  const instance=s.cards[action.instanceId];instance.position=action.position;instance.faceDown=false;instance.lastPositionTurn=s.turn;
  log(s,'POSITION_CHANGE',`${getCard(s,action.instanceId,ctx).name} changed to ${action.position==='attack'?'Attack':'face-up Defense'} Position.`,seat);break;
 }
 case 'FLIP_SUMMON':{
 const instance=s.cards[action.instanceId];instance.faceDown=false;instance.position='attack';instance.lastPositionTurn=s.turn;enqueueApprenticeSummon(s,action.instanceId,seat);summonDeckTriggers(s,action.instanceId);
 const id=instance.cardId;chaosFlip(s,action.instanceId);
 if(id===MANJU||id===SENJU)s.pendingSearch={sourceId:action.instanceId,controller:seat,kind:id===MANJU?'RITUAL_ANY':'RITUAL_MONSTER'};
 if(id===MAGICIAN_OF_FAITH||id===DEKOICHI)(s.pendingTriggers??=[]).push({sourceId:action.instanceId,controller:seat,effectId:id===MAGICIAN_OF_FAITH?'MOF_RECOVER':'DEKOICHI_DRAW',mandatory:true});
 log(s,'FLIP_SUMMON',`${getCard(s,action.instanceId,ctx).name} was Flip Summoned.`,seat);break;
 }
 case 'DECLINE_PENDING_TRIGGER':{
  const index=s.pendingTriggers!.findIndex(t=>t.sourceId===action.sourceId&&t.controller===seat&&!t.mandatory);
  if(index<0)throw new DuelEngineError('ILLEGAL_ACTION','No optional trigger to decline');
  s.pendingTriggers!.splice(index,1);s.priority=s.pendingTriggers!.length?(s.pendingTriggers!.some(x=>x.controller===s.current)?s.current:other(s.current)):other(seat);
  log(s,'TRIGGER_DECLINED','Optional trigger declined.',seat);break;
 }
 case 'ACTIVATE_TRIGGER':{
 const index=s.pendingTriggers!.findIndex(t=>t.sourceId===action.sourceId&&t.controller===seat);
 const [t]=s.pendingTriggers!.splice(index,1);
 s.chain.push({instanceId:t.sourceId,controller:seat,effectId:t.effectId,targets:action.choiceId?[action.choiceId]:[],spellSpeed:1,monsterZone:action.monsterZone,value:t.value,declaredType:action.declaredType,searchIds:action.searchIds});
 // All mandatory triggers must join the chain before any response is allowed.
 s.priority=s.pendingTriggers!.length?(s.pendingTriggers!.some(x=>x.controller===s.current)?s.current:other(s.current)):other(seat);
 s.consecutivePasses=0;log(s,'ACTIVATE',`${t.mandatory?'Mandatory':'Optional'} trigger ${t.effectId} placed as Chain Link ${s.chain.length}.`,seat);break;
 }
 case 'DRAW_PHASE':if(s.turn>1)draw(s,seat,1);else log(s,'DRAW_SKIPPED','First player skips the opening draw.',seat);s.pendingDraw=false;openFreeResponse(s,ctx);break;
 case 'NORMAL_SUMMON':{const card=getCard(s,action.instanceId,ctx);removeFromHand(p,action.instanceId);placeMonster(s,action.instanceId,seat,action.zone,action.position||'attack',['attack','faceDownDefense']);const instance=s.cards[action.instanceId];p.normalSummoned=true;enqueueApprenticeSummon(s,action.instanceId,seat);summonDeckTriggers(s,action.instanceId,true);if(!instance.faceDown&&(card.id===MANJU||card.id===SENJU)){s.pendingSearch={sourceId:action.instanceId,controller:seat,kind:card.id===MANJU?'RITUAL_ANY':'RITUAL_MONSTER'};}log(s,'NORMAL_SUMMON',`${card.name} ${instance.faceDown?'set':'Normal Summoned'} to zone ${action.zone+1}`,seat);break;}
 case 'DECLINE_TRIGGER':{log(s,'DECLINE','Optional summon search effect was declined.',seat);s.pendingSearch=undefined;break;}
 case 'TRIGGER_SEARCH':{const pending=s.pendingSearch!;s.pendingSearch=undefined;s.chain.push({instanceId:pending.sourceId,controller:seat,effectId:'SEARCH_RITUAL',targets:[],spellSpeed:1,searchIds:[action.searchId]});s.priority=other(seat);s.consecutivePasses=0;log(s,'ACTIVATE',`Triggered search of ${getCard(s,action.searchId,ctx).name}.`,seat);break;}
 case 'ACTIVATE_THUNDER_DRAGON':{removeFromHand(p,action.instanceId);toGraveyard(s,action.instanceId);s.chain.push({instanceId:action.instanceId,controller:seat,effectId:'THUNDER_SEARCH',targets:[],spellSpeed:1,searchIds:action.searchIds});s.priority=other(seat);s.consecutivePasses=0;log(s,'ACTIVATE',`Thunder Dragon discarded as cost to search up to two copies.`,seat);break;}
 case 'TRIBUTE_SUMMON':{const card=getCard(s,action.instanceId,ctx);for(const id of action.materials)sendMaterialToGraveyard(s,id,seat);removeFromHand(p,action.instanceId);placeMonster(s,action.instanceId,seat,action.zone,action.position,['attack','faceDownDefense']);p.normalSummoned=true;enqueueApprenticeSummon(s,action.instanceId,seat);summonDeckTriggers(s,action.instanceId,true);log(s,'TRIBUTE_SUMMON',`${card.name} ${action.position==='faceDownDefense'?'Tribute Set':'Tribute Summoned'} using ${action.materials.length} monster(s).`,seat);break;}
 case 'BEGIN_RITUAL':{if(s.cards[action.instanceId].location==='hand')removeFromHand(p,action.instanceId);p.zones.spell[action.zone]=action.instanceId;Object.assign(s.cards[action.instanceId],{location:'spell',zone:action.zone,faceDown:false});s.chain.push({instanceId:action.instanceId,controller:seat,effectId:'RITUAL_CHOOSE',targets:[],spellSpeed:1});s.priority=other(seat);s.consecutivePasses=0;log(s,'ACTIVATE','Ritual Spell activated; choose materials when it resolves.',seat);break;}
 case 'FINISH_RITUAL':{const pending=s.pendingRitual!;s.pendingRitual=undefined;if(s.cards[pending.sourceId].location==='spell')toGraveyard(s,pending.sourceId,'rule');log(s,'RITUAL_FAILED','No legal Ritual selection remains.',seat);break;}
 case 'ACTIVATE_CONTRACT':{const resolving=Boolean(s.pendingRitual);s.pendingRitual=undefined;if(!resolving){if(s.cards[action.instanceId].location==='hand')removeFromHand(p,action.instanceId);p.zones.spell[action.zone]=action.instanceId;Object.assign(s.cards[action.instanceId],{location:'spell',zone:action.zone,faceDown:false});}s.chain.push({instanceId:action.instanceId,controller:seat,effectId:'CONTRACT_RITUAL',targets:[],spellSpeed:1,ritual:{ritualId:action.ritualId,materials:action.materials,monsterZone:action.monsterZone}});s.priority=other(seat);s.consecutivePasses=0;log(s,'ACTIVATE',`${ritualDefinitions[s.cards[action.instanceId].cardId].label} activated; Ritual materials selected.`,seat);if(resolving)resolveChain(s,ctx);break;}
 case 'SET_SPELL_TRAP':{const card=getCard(s,action.instanceId,ctx);removeFromHand(p,action.instanceId);p.zones.spell[action.zone]=action.instanceId;Object.assign(s.cards[action.instanceId],{location:'spell',zone:action.zone,faceDown:true,setTurn:s.turn});log(s,'SET',`${card.name} set to spell/trap zone ${action.zone+1}`,seat);break;}
 case 'CHOOSE_DISCARD':{
  const pending=s.pendingDiscard!;
  for(const id of action.discardIds){removeFromHand(p,id);toGraveyard(s,id,'discard');}
  log(s,'DISCARD',`${getCard(s,pending.sourceId,ctx).name}: discarded ${pending.count} selected card(s).`,seat);
  if(s.cards[pending.sourceId].location==='spell')toGraveyard(s,pending.sourceId);
  s.pendingDiscard=undefined;resolveChain(s,ctx);break;
 }
 case 'ACTIVATE_GRACEFUL_CHARITY':{
  if(s.cards[action.instanceId].location==='hand')removeFromHand(p,action.instanceId);
  p.zones.spell[action.zone]=action.instanceId;Object.assign(s.cards[action.instanceId],{location:'spell',zone:action.zone,faceDown:false});
  s.chain.push({instanceId:action.instanceId,controller:seat,effectId:'GRACEFUL_DRAW_DISCARD',targets:[],spellSpeed:1});s.priority=other(seat);s.consecutivePasses=0;
  log(s,'ACTIVATE','Graceful Charity activated: draw 3, then discard 2 at resolution.',seat);break;
 }
 case 'ACTIVATE_POT_OF_GREED':{if(s.cards[action.instanceId].location==='hand')removeFromHand(p,action.instanceId);p.zones.spell[action.zone]=action.instanceId;Object.assign(s.cards[action.instanceId],{location:'spell',zone:action.zone,faceDown:false});s.chain.push({instanceId:action.instanceId,controller:seat,effectId:'DRAW_2',targets:[],spellSpeed:1});s.priority=other(seat);s.consecutivePasses=0;log(s,'ACTIVATE','Chain Link 1: Pot of Greed activated.',seat);break;}
 case 'ACTIVATE_BOOK_OF_MOON':{
  const instance=s.cards[action.instanceId];
  if(instance.location==='hand'){removeFromHand(p,action.instanceId);p.zones.spell[action.zone]=action.instanceId;}
  Object.assign(instance,{location:'spell',zone:action.zone,faceDown:false});
  s.chain.push({instanceId:action.instanceId,controller:seat,effectId:'BOOK_OF_MOON_SET',targets:[action.targetId],spellSpeed:2});
  s.priority=other(seat);s.consecutivePasses=0;
  log(s,'ACTIVATE',`Book of Moon targets ${getCard(s,action.targetId,ctx).name}.`,seat);break;
 }
 case 'ACTIVATE_MST':{const instance=s.cards[action.instanceId];if(instance.location==='hand'){removeFromHand(p,action.instanceId);p.zones.spell[action.zone]=action.instanceId;}instance.location='spell';instance.zone=action.zone;instance.faceDown=false;s.chain.push({instanceId:action.instanceId,controller:seat,effectId:'MST_DESTROY',targets:[action.targetId],spellSpeed:2});s.priority=other(seat);s.consecutivePasses=0;log(s,'ACTIVATE',`Chain Link ${s.chain.length}: MST targets ${getCard(s,action.targetId,ctx).name}.`,seat);break;}
 case 'PASS_CHAIN':{s.consecutivePasses++;log(s,'PASS',`Player ${seat+1} passes chain response.`,seat);if(s.consecutivePasses===2){resolveChain(s,ctx);}else s.priority=other(seat);break;}
 case 'RESOLVE_CHAIN':{log(s,'PASS',`Player ${seat+1} passes chain response.`,seat);resolveChain(s,ctx);break;}
 case 'ADVANCE':{if(s.phase==='END'){for(const id of [...s.players[0].zones.monster,...s.players[1].zones.monster])if(id&&s.cards[id].cardId===TSUKUYOMI&&!s.cards[id].faceDown&&s.cards[id].spiritReturnTurn===s.turn){const c=s.cards[id];returnToHand(s,id);log(s,'SPIRIT_RETURN','Tsukuyomi returned to hand in the End Phase.',c.owner);}}const idx=phases.indexOf(s.phase);if(idx===phases.length-1){s.current=other(seat);s.turn++;s.phase='DRAW';s.pendingDraw=true;s.players[s.current].normalSummoned=false;}else{s.phase=phases[idx+1];}if(s.phase==='STANDBY')for(const equip of Object.values(s.cards))if(equip.location==='spell'&&!equip.faceDown&&equip.cardId===45986603&&equip.linkedTarget&&equip.controller!==s.current){s.players[s.current].lp+=1000;log(s,'LP_GAIN','Snatch Steal: gained 1000 LP.',s.current);}if(s.phase==='STANDBY')for(const id of s.players[s.current].graveyard)if(s.cards[id].cardId===SERPENT)(s.pendingTriggers??=[]).push({sourceId:id,controller:s.current,effectId:'SERPENT_RECOVER',mandatory:false});s.priority=s.current;log(s,'PHASE',`Turn ${s.turn}: Player ${s.current+1} ${s.phase}`,s.current);openFreeResponse(s,ctx);break;}
 default:throw new DuelEngineError('ILLEGAL_ACTION','Unsupported action');
 }
 return s;
}
function reshuffleAfterSearch(deck:string[],s:DuelState,seat:Seat){let seed=(s.seed+Math.imul(s.turn,9187)+s.events.length*8719+seat*17)>>>0;const result=[...deck];for(let i=result.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=Math.floor(seed/4294967296*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
function resolveChain(s:DuelState,resolveContext:EngineContext){const priorSummon=s.summonResponse?.sourceId;while(s.chain.length&&s.winner===null&&!s.drawnGame){const link=s.chain.pop()!;if(link.effectId==='RITUAL_CHOOSE'){s.pendingRitual={sourceId:link.instanceId,controller:link.controller};s.consecutivePasses=0;s.priority=s.current;return;}else if(resolveDeckEffect(s,link,resolveContext)){if(s.pendingChaos||s.pendingDiscard||s.pendingDeckChoice||s.pendingRoll||s.pendingRandomDiscard)return;}else if(link.effectId==='SANGAN_SEARCH'){
 const id=link.targets[0];const success=Boolean(id)&&addDeckCardToHand(s,link.controller,id,resolveContext,x=>{const c=getCard(s,x,resolveContext);return c.type.includes('Monster')&&typeof c.atk==='number'&&c.atk<=1500;});
 s.players[link.controller].deck=reshuffleAfterSearch(s.players[link.controller].deck,s,link.controller);
 log(s,'RESOLVE',`Sangan search ${success?'succeeded':'found no valid selection'}.`,link.controller);
 }else if(link.effectId==='MOF_RECOVER'){
 const id=link.targets[0];const success=Boolean(id)&&recoverGraveCard(s,link.controller,id,resolveContext,x=>isSpell(s,x,resolveContext));
 log(s,'RESOLVE',`Magician of Faith ${success?'recovered a Spell':'resolved without recovering a card'}.`,link.controller);
 }else if(link.effectId==='APPRENTICE_COUNTER'){
 const id=link.targets[0];
 if(id && spellCounterTargets(s).includes(id)){
  s.cards[id].spellCounters=(s.cards[id].spellCounters??0)+1;
  log(s,'SPELL_COUNTER',`Apprentice Magician placed one Spell Counter on ${getCard(s,id,resolveContext).name}.`,link.controller);
 }else log(s,'RESOLVE','No valid Spell Counter target at resolution.',link.controller);
 }else if(link.effectId==='APPRENTICE_RECRUIT'){
 const id=link.targets[0];const p=s.players[link.controller];const zone=link.monsterZone;
 const card=id?getCard(s,id,resolveContext):undefined;
 if(id&&zone!==undefined&&p.deck.includes(id)&&p.zones.monster[zone]===null&&card?.type.includes('Monster')&&card.race==='Spellcaster'&&Number(card.level)>0&&Number(card.level)<=2){
  p.deck.splice(p.deck.indexOf(id),1);
  placeMonster(s,id,link.controller,zone,'faceDownDefense',['faceDownDefense']);
  p.deck=reshuffleAfterSearch(p.deck,s,link.controller);
  log(s,'SPECIAL_SUMMON',`Apprentice Magician Special Summoned ${card.name} face-down in Defense Position.`,link.controller);
 }else log(s,'RESOLVE','Apprentice Magician recruit resolved without a legal summon.',link.controller);
 }else if(link.effectId==='TOMATO_SUMMON'||link.effectId==='SHINING_ANGEL_SUMMON'){
 const id=link.targets[0];const p=s.players[link.controller];const zone=link.monsterZone;const card=id?getCard(s,id,resolveContext):undefined;
 if(id&&zone!==undefined&&zone>=0&&zone<5&&p.zones.monster[zone]===null&&p.deck.includes(id)&&card?.type.includes('Monster')&&card.attribute===(link.effectId==='TOMATO_SUMMON'?'DARK':'LIGHT')&&typeof card.atk==='number'&&card.atk<=1500){
  p.deck.splice(p.deck.indexOf(id),1);placeMonster(s,id,link.controller,zone,'attack',['attack']);
  p.deck=reshuffleAfterSearch(p.deck,s,link.controller);log(s,'SPECIAL_SUMMON',`${link.effectId==='TOMATO_SUMMON'?'Mystic Tomato':'Shining Angel'} Special Summoned ${card.name} from the Deck.`,link.controller);
 }else log(s,'RESOLVE','Battle recruiter resolved without a valid Special Summon.',link.controller);
 }else if(link.effectId==='DD_WARRIOR_LADY_BANISH'){
  for(const id of link.targets){if(s.cards[id]?.location==='monster')toBanished(s,id);}
  if(s.pendingAttack)s.pendingAttack.battleDestruction=[];
  log(s,'BANISH','D.D. Warrior Lady banished both battling monsters that remained on the field.',link.controller);
 }else if(link.effectId==='DEKOICHI_DRAW'){
 drawEffect(s,link.controller,1);log(s,'RESOLVE','Dekoichi draw effect resolved.',link.controller);
 }else if(link.effectId==='GRACEFUL_DRAW_DISCARD'){
  const drawnIds=s.players[link.controller].deck.slice(0,3);
  draw(s,link.controller,3);
  if(s.winner===null){s.pendingDiscard={sourceId:link.instanceId,controller:link.controller,count:2,drawnIds};s.priority=link.controller;s.consecutivePasses=0;return;}
 }else if(link.effectId==='SEARCH_RITUAL'||link.effectId==='THUNDER_SEARCH'){const p=s.players[link.controller];let found=0;for(const id of link.searchIds||[]){if(p.deck.includes(id)){p.deck.splice(p.deck.indexOf(id),1);p.hand.push(id);s.cards[id].location='hand';found++;}}p.deck=reshuffleAfterSearch(p.deck,s,link.controller);log(s,'SEARCH',`Search resolved, added ${found} card(s) to hand; shuffled Deck.`,link.controller);}else if(link.effectId==='DRAW_2'){draw(s,link.controller,2);log(s,'RESOLVE','Pot of Greed draws two cards (unless the player decks out).',link.controller);}else if(link.effectId==='CONTRACT_RITUAL'){const ritual=link.ritual!;const p=s.players[link.controller];const definition=ritualDefinitions[s.cards[link.instanceId].cardId];const monster=getCard(s,ritual.ritualId,resolveContext);const total=ritual.materials.reduce((sum,id)=>sum+Number(getCard(s,id,resolveContext).level||0),0);const validLevel=definition&&(definition.levelRule==='EXACT'?total===Number(monster.level):total>=Number(monster.level));const ready=Boolean(definition&&definition.eligible(monster)&&validLevel)&&p.hand.includes(ritual.ritualId)&&ritual.materials.every(id=>{const c=s.cards[id];return c&&c.controller===link.controller&&(c.location==='hand'||c.location==='monster');})&&(p.zones.monster[ritual.monsterZone]===null||ritual.materials.includes(p.zones.monster[ritual.monsterZone]!));if(ready){for(const id of ritual.materials)sendMaterialToGraveyard(s,id,link.controller);removeFromHand(p,ritual.ritualId);placeMonster(s,ritual.ritualId,link.controller,ritual.monsterZone,'attack',['attack']);s.cards[ritual.ritualId].properlySummoned=true;summonDeckTriggers(s,ritual.ritualId);enqueueApprenticeSummon(s,ritual.ritualId,link.controller);log(s,'RITUAL_SUMMON',`${definition.label} successfully Ritual Summoned ${monster.name}.`,link.controller);}else log(s,'RITUAL_FAILED','Ritual materials or destination no longer valid at resolution.',link.controller);}else if(link.effectId==='BOOK_OF_MOON_SET'){
  const id=link.targets[0];const target=s.cards[id];
  if(target?.location==='monster' && !target.faceDown){
   target.position='faceDownDefense';target.faceDown=true;detachFaceDown(s,id);
   log(s,'POSITION_EFFECT',`Book of Moon turned ${getCard(s,id,resolveContext).name} face-down in Defense Position.`,link.controller);
  }else log(s,'RESOLVE','Book of Moon resolved without changing its target.',link.controller);
 }else if(link.effectId==='MST_DESTROY'){const target=link.targets[0];if(onField(s,target)){toGraveyard(s,target);log(s,'RESOLVE',`MST destroyed ${target}; destruction does not negate an already activated Normal Spell.`,link.controller);}else log(s,'RESOLVE','MST target is no longer on the field; no card destroyed.',link.controller);}else if(link.effectId==='MIRROR_FORCE'){
  const opponent=other(link.controller);
  const ids=s.players[opponent].zones.monster.filter((id):id is string=>id!==null).filter(id=>s.cards[id].position==='attack'&&!s.cards[id].faceDown);
  for(const id of ids)toGraveyard(s,id);
  log(s,'RESOLVE',`Mirror Force destroyed ${ids.length} Attack Position monster(s).`,link.controller);
 }else if(link.effectId==='SAKURETSU_ARMOR'){
  const id=link.targets[0];if(id&&s.cards[id]?.location==='monster'){toGraveyard(s,id);log(s,'RESOLVE','Sakuretsu Armor destroyed the attacking monster.',link.controller);}
  else log(s,'RESOLVE','Sakuretsu Armor did not destroy a monster.',link.controller);
 }else throw new DuelEngineError('UNSUPPORTED_EFFECT','Unknown effect');if(s.cards[link.instanceId].location==='spell'&&!s.cards[link.instanceId].linkedTarget&&s.cards[link.instanceId].cardId!==97077563)toGraveyard(s,link.instanceId,'rule');}s.freeResponse=undefined;if(!s.chain.length&&s.deferredTriggers?.length){(s.pendingTriggers??=[]).push(...s.deferredTriggers);s.deferredTriggers=[];}if(s.summonResponse?.sourceId===priorSummon)s.summonResponse=undefined;s.consecutivePasses=0;s.priority=s.current;
 if(s.pendingAttack && s.pendingAttack.damageStep){
  // A Damage Step trigger chain does not restart attack declaration or damage calculation.
  s.priority=s.pendingAttack.attacker;
 }else if(s.pendingAttack){
  const pending=s.pendingAttack;const attacker=s.cards[pending.attackerId];
  const currentField=s.players[pending.defender].zones.monster.filter((id):id is string=>id!==null);
  if(!attacker||attacker.location!=='monster'||attacker.controller!==pending.attacker||attacker.position!=='attack'||attacker.faceDown){
   s.pendingAttack=undefined;log(s,'ATTACK_CANCEL','Attack canceled because attacker left the field.',pending.attacker);
  }else if(pending.targetId && (s.cards[pending.targetId]?.location!=='monster'||s.cards[pending.targetId]?.controller!==pending.defender)){
   pending.replay=true;pending.defenderField=currentField;s.priority=pending.attacker;
   log(s,'REPLAY_REQUIRED','Attack target is no longer available. Attacker must select a new target or cancel.',pending.attacker);
  }else if(JSON.stringify(currentField)!==JSON.stringify(pending.defenderField??currentField)){
   pending.replay=true;pending.defenderField=currentField;s.priority=pending.attacker;
   log(s,'REPLAY_REQUIRED','Available attack targets changed. Attacker must select a new target or cancel.',pending.attacker);
  }else {pending.damageStep='START';log(s,'DAMAGE_STEP','Attack response chain resolved. Damage Step begins.',pending.attacker);}
 }
}
export function unsupportedEffects(ctx:EngineContext,ids:number[]):string[]{return [...new Set(ids)].filter(id=>!chaosEffectIds.has(id)&&!ritualDeckEffectIds.has(id)&&id!==BOOK_OF_MOON&&id!==MIRROR_FORCE&&id!==SAKURETSU_ARMOR&&id!==GRACEFUL_CHARITY&&id!==POT_OF_GREED&&id!==MYSTICAL_SPACE_TYPHOON&&id!==CONTRACT_WITH_THE_ABYSS&&id!==CONTRACT_WITH_THE_DARK_MASTER&&id!==SHINATOS_ARK&&id!==MANJU&&id!==SENJU&&id!==THUNDER_DRAGON&&id!==SANGAN&&id!==MAGICIAN_OF_FAITH&&id!==DEKOICHI&&id!==MYSTIC_TOMATO&&id!==SHINING_ANGEL&&id!==DD_WARRIOR_LADY&&id!==APPRENTICE_MAGICIAN).map(id=>ctx.cards.get(id)?.name||String(id));}
