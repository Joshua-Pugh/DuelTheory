import {removalPayoff,sensibleActions} from './strategy';
import {planChaosTurn} from './planning';
import type {Card} from '../core/types';import type {DuelState,LegalAction,Seat} from '../engine/model';
import {bestLegalAction,goatObservation,hasDecision,type Decision} from './policy';
const TD=31786629,NIGHT=16226786,SERPENT=8131171,SANGAN=26202165,SPY=24317029,FAITH=31560081,DEKO=87621407,BLS=72989439,SORC=9596126,BOOK=14087893;
/** A deterministic, resource-first Chaos Turbo prototype, not a trained/tournament-strength agent. */
export function chooseChaosTurboHeuristic(state:DuelState,legal:readonly LegalAction[],seat:Seat,catalog:readonly Card[]):Decision<LegalAction>|undefined{
 // Legal search-option order can mirror a shuffled pile. Canonicalize without reading descriptions.
 const actions=sensibleActions(state,legal,seat,catalog).map(action=>({action,key:JSON.stringify(Object.fromEntries(Object.entries(action).filter(([key])=>key!=='description').sort(([a],[b])=>a.localeCompare(b))))})).sort((a,b)=>a.key.localeCompare(b.key)).map(x=>x.action);if(!hasDecision(state,seat,actions))return;
 const cards=new Map(catalog.map(c=>[c.id,c]));
 return bestLegalAction(goatObservation(state,seat),actions,(s,a)=>{
  const own=s.players[seat],enemy=s.players[seat===0?1:0],field=(who:Seat)=>s.players[who].zones.monster.filter((id):id is string=>!!id),ours=field(seat),theirs=field(seat===0?1:0);
  const card=(id:string|undefined)=>id?cards.get(s.cards[id]?.cardId):undefined;
  const atk=(id:string)=>{const c=s.cards[id];return Number(card(id)?.atk??1600)+(c.cardId===71413901?(c.spellCounters??0)*300:0);};
  const chaosReady=own.hand.some(id=>[BLS,SORC].includes(card(id)?.id??0))&&['LIGHT','DARK'].every(attribute=>own.graveyard.some(id=>card(id)?.attribute===attribute));
  const worth=(id:string|undefined)=>{if(!id)return 0;const c=card(id);if(!c)return 1700;return c.id===BLS?3600:c.id===SORC?2900:c.id===88240808&&chaosReady?4800:c.id===55144522?3400:c.id===79571449?3300:c.id===44763025?3100:c.id===FAITH?2200:c.id===SPY?2100:c.id===DEKO?2000:c.id===NIGHT?1500:c.type.includes('Monster')?Math.max(Number(c.atk)||0,Number(c.def)||0)+200:1500;};
  // Night recovers a Flip; Serpent returns later; spare Thunder Dragons become discard value.
  const discard=(id:string)=>{const c=card(id);if(c?.id===NIGHT&&own.graveyard.some(x=>card(x)?.type.includes('Flip')&&x!==id))return -1400;if(c?.id===SERPENT)return -1000;if(c?.id===TD&&(own.hand.filter(x=>card(x)?.id===TD).length>1||!own.deck.some(x=>card(x)?.id===TD)))return -700;const attribute=c?.attribute;if(attribute&&['LIGHT','DARK'].includes(attribute)&&!own.graveyard.some(x=>card(x)?.attribute===attribute)&&own.hand.some(x=>[BLS,SORC].includes(card(x)?.id??0)))return worth(id)-900;return worth(id);};
  const removal=(id:string|undefined)=>removalPayoff(s,id,seat,x=>worth(x));
  const sum=(ids:readonly string[])=>ids.reduce((n,id)=>n+worth(id),0),cost=(ids:readonly string[]|undefined)=>ids?.reduce((n,id)=>n+discard(id),0)??0;
  const result=(value:number,reason:string)=>({value,reason});
  const source='instanceId'in a?a.instanceId:'sourceId'in a?a.sourceId:undefined;
  const target='targetId'in a?a.targetId:undefined;
  const inChain=s.chain.length>0,defending=s.pendingAttack?.defender===seat;
  const combatPayoff=(id:string)=>s.turn>1&&s.phase!=='MAIN_2'&&(atk(id)>=enemy.lp&&theirs.length===0||card(id)?.id!==SERPENT&&theirs.some(t=>!s.cards[t].faceDown&&s.cards[t].position==='attack'&&atk(t)<atk(id)));
  const support=(id:string)=>[SERPENT,SANGAN].includes(card(id)?.id??0);
  if(a.type==='DRAW_PHASE')return result(1000,'Draw for the turn.');
  if(['ADVANCE_DAMAGE_STEP','COMPLETE_DIE_ROLL'].includes(a.type))return result(1000,'Continue the required battle or random result.');
  if(a.type==='CHOOSE_RANDOM_DISCARD')return result(100,'Choose a face-down random discard without inspecting it.');
  if(a.type==='CHOOSE_DISCARD')return result(200-cost(a.discardIds)/100,'Discard recoverable cards or surplus Thunder Dragons; preserve power cards.');
  if(a.type==='ACTIVATE_THUNDER_DRAGON')return result(a.searchIds.length?180+a.searchIds.length*10:-30,'Thin the deck with Thunder Dragon and prepare discard fodder.');
  if(a.type==='ACTIVATE_POT_OF_GREED')return result(160,'Generate immediate card advantage with Pot of Greed.');
  if(a.type==='ACTIVATE_GRACEFUL_CHARITY')return result(145,'Dig for power cards and load useful LIGHT/DARK or recoverable discards.');
  if(a.type==='COMPLETE_DUSTSHOOT')return result(100+worth(a.targetId)/100,'Return the strongest revealed monster to disrupt the opponent.');
  if(a.type==='TRIGGER_SEARCH')return result(100+worth(a.searchId)/100,'Choose a useful legal search target.');
  if(a.type==='ACTIVATE_TRIGGER'){
   const effect=s.pendingTriggers?.find(t=>t.sourceId===a.sourceId)?.effectId;
   let value=100+worth(a.choiceId)/100;
   if(effect==='ZABORG_DESTROY'&&a.choiceId)value=s.cards[a.choiceId].controller===seat?-200:100+removal(a.choiceId)/100;
   if(effect==='NIGHT_DESTROY'&&a.choiceId)value=100+removal(a.choiceId)/100;
   if(effect==='KYCOO_BANISH')value=100+(a.searchIds?.length??0)*10+(a.searchIds??[]).reduce((n,id)=>n+worth(id)/1000,0);
   if(effect==='TSUKUYOMI_SET'&&a.choiceId){value=s.cards[a.choiceId].controller===seat?([FAITH,DEKO,SPY].includes(card(a.choiceId)?.id??0)?130:-40):125+atk(a.choiceId)/1000;}
   if(a.monsterZone!==undefined)value+=a.declaredType==='faceUpDefense'&&(card(a.choiceId)?.id===SPY)?5:a.declaredType==='attack'?2:0;
   return result(value,'Resolve the flip/recovery engine or exploit a useful summon trigger.');
  }
  if(a.type==='SPECIAL_SUMMON_CHAOS'){
   const materialCost=a.materials.reduce((n,id)=>n+worth(id)+(card(id)?.type.includes('Flip')&&own.hand.some(x=>card(x)?.id===NIGHT)?1000:0),0)/2000,strongest=Math.max(0,...theirs.filter(id=>!s.cards[id].faceDown).map(atk));
   const established=ours.length>=2&&Math.max(0,...ours.map(atk))>=strongest;
   return result((established?-65:s.turn===1&&ours.length?-15:s.turn===1?35:ours.length>=3&&theirs.length===0?25:95)+(card(a.instanceId)?.id===BLS?5:0)+(a.position==='attack'?5:-10)+(strongest>2000?12:0)-materialCost,'Convert established LIGHT/DARK resources into a Chaos threat without banishing valuable recovery targets first.');
  }
  if(a.type==='NORMAL_SUMMON'||a.type==='TRIBUTE_SUMMON'){
   const c=card(a.instanceId),set=a.position==='faceDownDefense',flip=c?.type.includes('Flip'),pressure=Math.max(0,...theirs.filter(id=>!s.cards[id].faceDown).map(atk));
   if(a.type==='TRIBUTE_SUMMON')return result(-20,'Preserve the flip engine rather than spend multiple monsters on a normal Tribute Summon.');
   const liveDiscard=actions.some(x=>x.type==='ACTIVATE_GRACEFUL_CHARITY'||x.type==='ACTIVATE_DECK_EFFECT'&&x.costId===a.instanceId&&(x.targetId? s.cards[x.targetId]?.controller!==seat:theirs.some(id=>!s.cards[id].faceDown&&card(id)?.race===x.declaredType)));
   if(c?.id===SERPENT)return result(set?(ours.length===0&&theirs.length>0&&!liveDiscard?55:-15):combatPayoff(a.instanceId)?95:-40,'Keep Serpent for repeatable discard costs; set it only when a blocker is needed, or attack for lethal.');
   if(c?.id===SANGAN)return result(set?70:combatPayoff(a.instanceId)?90:-25,'Set Sangan for defense and its search; attack only when there is a concrete combat payoff.');
   let value=set?(flip?75:15):(flip?10:65+(c?.id===71413901?8:0));
   if(c?.id===FAITH&&!own.graveyard.some(id=>card(id)?.type.includes('Spell')))value-=30;
   if(c?.id===SPY&&set)value+=pressure>1400?15:8;
   if(!set&&(Number(c?.atk)||0)<pressure&&!flip)value-=25;
   if(c?.id===TD)value=-25;
   return result(value,'Establish Spy/Dekoichi/Faith for resource advantage, or summon a useful attacker.');
  }
  if(a.type==='FLIP_SUMMON'&&support(a.instanceId)&&!combatPayoff(a.instanceId))return result(-20,'Keep the support monster face-down rather than expose it as a weak attacker.');
  if(a.type==='FLIP_SUMMON'&&card(a.instanceId)?.id===NIGHT){const targets=theirs.filter(id=>s.cards[id].faceDown||atk(id)>1600||[FAITH,SPY,DEKO,88240808].includes(card(id)?.id??0));return result(targets.length?110:-15,'Keep Night Assailant set until its removal answers a meaningful threat.');}
  if(a.type==='FLIP_SUMMON')return result(110,'Cash in a surviving flip monster for another resource advantage.');
  if(a.type==='SET_SPELL_TRAP'){
   const c=card(a.instanceId),same=own.zones.spell.some(id=>id&&card(id)?.id===c?.id);
   if(same||own.zones.spell.filter(Boolean).length>=2)return result(-25,'Keep follow-up interaction in hand instead of stacking duplicate or excessive back row.');
   return result(c?.type.includes('Trap')?40-(same?20:0):c?.id===BOOK?(s.phase==='MAIN_2'?25:own.hand.filter(id=>card(id)?.id===BOOK).length>1?20:-5):-20,'Prepare interaction while keeping a Book in hand for this turn’s battle when useful.');
  }
  if(a.type==='CHANGE_POSITION'&&support(a.instanceId)){const threatened=theirs.some(id=>s.cards[id].faceDown||atk(id)>atk(a.instanceId));return result(a.position==='faceUpDefense'&&threatened?85:a.position==='attack'&&combatPayoff(a.instanceId)?90:-20,'Keep vulnerable support monsters in defense unless attacking has a clear payoff.');}
  if(a.type==='CHANGE_POSITION')return result(a.position==='attack'&&atk(a.instanceId)>=Math.max(0,...theirs.filter(id=>!s.cards[id].faceDown).map(atk))?25:-10,'Move a useful surviving monster into attack position.');
  if(a.type==='DECLARE_ATTACK'||a.type==='REPLAY_ATTACK'){
   const attacker=a.type==='DECLARE_ATTACK'?a.attackerId:s.pendingAttack!.attackerId,power=atk(attacker);
   if(!a.targetId)return result(power>=enemy.lp?10000:70+power/1000,'Convert board advantage into direct damage.');
   const t=s.cards[a.targetId],guard=t.faceDown?1800:t.position==='attack'?atk(a.targetId):Number(card(a.targetId)?.def??1800),advantage=power-guard;
   return result(advantage>0?80+worth(a.targetId)/1000:advantage===0&&!t.faceDown&&t.position==='attack'&&worth(a.targetId)>=worth(attacker)?20:-20,'Prefer favorable attacks; estimate unknown defenders without reading their identities.');
  }
  if(a.type==='ACTIVATE_BOOK_OF_MOON'){
   const t=s.cards[a.targetId],top=s.chain.at(-1),attacker=s.pendingAttack?.attackerId;
   if(t.controller===seat){const endangered=s.chain.some(l=>l.targets.includes(a.targetId)&&!(l.effectId==='CHAOS_BANISH'&&card(l.instanceId)?.id===BLS)||l.effectId==='MIRROR_FORCE'&&t.position==='attack');return result(endangered?120+worth(a.targetId)/1000:-15,'Protect a threatened monster from destruction/control or preserve its flip value.');}
   const defendingTarget=s.pendingAttack?.targetId,guard=defendingTarget?(s.cards[defendingTarget].position==='attack'?atk(defendingTarget):Number(card(defendingTarget)?.def??1800)):0;
   const battleDanger=defending&&attacker===a.targetId&&(Math.max(0,atk(a.targetId)-guard)>=own.lp||atk(a.targetId)>=2200||!!defendingTarget&&atk(a.targetId)>guard&&worth(defendingTarget)>=2800);
   const resetSearch=[95492061,23401839,FAITH,SPY,DEKO,NIGHT].includes(card(a.targetId)?.id??0);
   return result(!inChain&&s.current===seat&&card(a.targetId)?.id===88240808&&chaosReady?115:battleDanger?90+atk(a.targetId)/1000-(resetSearch&&own.lp>atk(a.targetId)?65:0):!inChain&&s.current===seat&&atk(a.targetId)>Math.max(0,...ours.map(atk))&&Number(card(a.targetId)?.def??2000)<Math.max(0,...ours.map(atk))?50:top?.effectId==='TER_ABSORB'&&top.instanceId===a.targetId?65:-15,'Stop a dangerous attack or make a known threat easier to defeat.');
  }
  if(a.type==='ACTIVATE_ATTACK_TRAP')return result(defending?100:-20,'Stop the declared attack when the battle trap is legal.');
  if(a.type==='ACTIVATE_MST')return result(s.cards[a.targetId]?.controller!==seat?35+removal(a.targetId)/100:-100,'Remove opposing back-row interaction.');
  if(a.type==='ACTIVATE_DECK_EFFECT'){
   switch(a.effectId){
    case 'DUO':return result(enemy.hand.length>=2?150:enemy.hand.length?70:-20,'Trade Delinquent Duo for opposing hand resources.');
    case 'DUSTSHOOT':return result(155,'Use Trap Dustshoot while the opponent still has four cards.');
    case 'BREAKER_DESTROY':return result(s.cards[target!]?.controller!==seat?45+removal(target)/100:-100,'Spend Breaker’s counter to clear opposing back row.');
    case 'NOBLEMAN':return result(s.cards[target!]?.controller!==seat?85:-100,'Remove an opposing set monster; preserve our own flip engine.');
    case 'HEAVY_STORM':return result((sum(enemy.zones.spell.filter((id):id is string=>!!id))-sum(own.zones.spell.filter((id):id is string=>!!id&&id!==source)))/100-3,'Use Heavy Storm when the exchange favors us.');
    case 'TRIBE_DESTROY':{const matching=(ids:string[])=>ids.filter(id=>!s.cards[id].faceDown&&card(id)?.race===a.declaredType);return result(matching(theirs).length?(sum(matching(theirs))-sum(matching(ours))-cost(a.costId?[a.costId]:[]))/100-5:-30,'Use Tribe only when the revealed monster-type exchange justifies the discard.');}
    case 'SNATCH':return result(70+worth(target)/100,'Turn an opposing threat into our own board advantage.');
    case 'CHAOS_BANISH':{const id=target!,power=atk(source!),t=s.cards[id];return result(t.controller!==seat&&(atk(id)>=power||t.position!=='attack'||theirs.length>1)?90+worth(id)/1000:-10,'Banish a difficult threat; preserve attacks when combat is the better payoff.');}
    case 'RAIGEKI_BREAK':{const t=s.cards[target!];return result(t.controller!==seat?(removal(target)-cost(a.costId?[a.costId]:[]))/100+(defending?45:5):-40,'Pair Raigeki Break with Night Assailant, Serpent or spare Thunder Dragon for an efficient exchange.');}
    case 'RING':{const damage=atk(target!);return result(damage>=enemy.lp&&damage<own.lp?10000:damage>=own.lp?-100:s.cards[target!].controller!==seat?35+damage/1000:-20,'Use Ring for safe lethal damage or an efficient removal, avoiding self-lethal.');}
    case 'TORRENTIAL':return result((sum(theirs)-sum(ours))/100-5,'Use Torrential only when the board exchange is favorable.');
    case 'CARD_DESTRUCTION':return result(own.hand.length>1&&own.hand.filter(id=>[TD,NIGHT,SERPENT].includes(card(id)?.id??0)).length>=2&&cost(own.hand.filter(id=>id!==source))<1000?80:-20,'Reload a hand rich in discard value; avoid throwing away strong hands.');
    default:return result(target?35+worth(target)/1000:20,'Use a supported legal effect.');
   }
  }
  if(a.type==='COMPLETE_LIGHT_CHOICE')return result(70+worth(a.choiceId)/100+(a.declaredType==='4'?5:a.declaredType==='attack'?2:0),'Make a required resolution choice from the legal options.');
  if(a.type==='FINISH_LIGHT_CHOICE')return result(5,'Finish a required resolution without an optional extra action.');
  if(a.type==='ADVANCE')return result(0,'Move on after useful resource-building, setup and attacks.');
  if(['PASS_CHAIN','RESOLVE_CHAIN','PASS_ATTACK_RESPONSE','PASS_SUMMON_RESPONSE','PASS_SUMMON_NEGATION','PASS_FREE_RESPONSE','CANCEL_REPLAY','DECLINE_TRIGGER','DECLINE_PENDING_TRIGGER','DECLINE_DD_WARRIOR_LADY'].includes(a.type))return result(0,'Preserve interaction when no beneficial response is needed.');
  return result(10,'Complete the available supported action.');
 });
}

/** Bounded tactical planning falls back to the resource strategy at uncertain boundaries. */
export function chooseChaosTurbo(state:DuelState,legal:readonly LegalAction[],seat:Seat,catalog:readonly Card[]):Decision<LegalAction>|undefined{
 const options=sensibleActions(state,legal,seat,catalog),fallback=chooseChaosTurboHeuristic(state,options,seat,catalog);
 return fallback?planChaosTurn(state,options,seat,catalog,chooseChaosTurboHeuristic)??fallback:undefined;
}
