import {shuffleSearchedDeck} from './deckShuffle';
import {canRecruit,canSummon,type LightAction} from './lightDeckEffects';
import {getCard,log,placeMonster,removeFromHand,toBanished,toGraveyard,type ChainLink,type DuelState,type EngineContext,type LegalAction,type PendingTrigger,type Seat} from './model';

export const GREN=36584821,BAZOO=40133511,SCOUT=3773196,BANISHER=61528025,SOUL_RELEASE=5758500,RETURN=27174286,SURVIVOR=48092532;
export const GORILLA=39168895,TURTLE=77044671,RAT=97017120,KOKKI=57281778,VAMPIRE=53839837,LILY=79575620,BOOK_LIFE=2204140;
export const graveyardDeckIds=new Set([GREN,BAZOO,SCOUT,BANISHER,SOUL_RELEASE,RETURN,SURVIVOR,GORILLA,TURTLE,RAT,KOKKI,VAMPIRE,LILY,BOOK_LIFE]);
export type GraveyardEffect='BAZOO'|'SOUL_RELEASE'|'RETURN_DIMENSION'|'BOOK_LIFE'|'LILY_BOOST'|'LILY_SKIP';
const other=(seat:Seat):Seat=>seat===0?1:0;
const zones=(s:DuelState,seat:Seat)=>s.players[seat].zones.monster.flatMap((id,i)=>id===null?[i]:[]);
export const graveBanishBlocked=(s:DuelState,seat:Seat)=>s.players[other(seat)].zones.monster.some(id=>id&&!s.cards[id].faceDown&&s.cards[id].cardId===88240808);
export function revivable(s:DuelState,id:string,ctx:EngineContext){const c=getCard(s,id,ctx);return c.type.includes('Monster')&&!c.type.includes('Spirit')&&(!c.type.includes('Ritual')&&!c.type.includes('Fusion')&&!c.type.includes('Special Summon')&&![9596126,72989439,77527210].includes(c.id)||!!s.cards[id].properlySummoned);}
export function graveyardStat(s:DuelState,id:string,stat:'atk'|'def',ctx:EngineContext){const c=s.cards[id];return c.cardId===GREN?s.players[c.controller].banished.length*400:Number(getCard(s,id,ctx)[stat]);}
function combinations(ids:string[],max:number){const result:string[][]=[];function visit(start:number,chosen:string[]){if(chosen.length)result.push(chosen);if(chosen.length===max)return;for(let i=start;i<ids.length;i++)visit(i+1,[...chosen,ids[i]]);}visit(0,[]);return result;}

export function graveyardActions(s:DuelState,ctx:EngineContext,seat:Seat,response=false):LegalAction[]{
 const p=s.players[seat],out:LegalAction[]=[];
 const add=(instanceId:string,effectId:GraveyardEffect,extra:Partial<Extract<LightAction,{type:'ACTIVATE_LIGHT_EFFECT'}>>={})=>out.push({type:'ACTIVATE_LIGHT_EFFECT',seat,instanceId,effectId,...extra,description:`Activate ${getCard(s,instanceId,ctx).name}`});
 if(!response&&!graveBanishBlocked(s,seat))for(const id of p.zones.monster){const c=id?s.cards[id]:undefined;if(c?.cardId===BAZOO&&!c.faceDown&&c.effectUsedTurn!==s.turn)for(const materials of combinations(p.graveyard.filter(x=>getCard(s,x,ctx).type.includes('Monster')),3))add(id!,'BAZOO',{materials});}
 for(const id of [...p.hand,...p.zones.spell.filter((id):id is string=>!!id&&!!s.cards[id].faceDown)]){
  const c=s.cards[id],spellZones=c.location==='spell'?[c.zone!]:p.zones.spell.flatMap((x,i)=>x===null?[i]:[]);
  for(const zone of spellZones){
   if(c.cardId===RETURN&&c.location==='spell'&&c.setTurn!==s.turn&&p.lp>0&&canSummon(s,seat)&&zones(s,seat).length&&p.banished.some(x=>revivable(s,x,ctx)))add(id,'RETURN_DIMENSION',{zone});
   if(response)continue;
   if(c.cardId===SOUL_RELEASE&&!graveBanishBlocked(s,seat)&&s.players.some(p=>p.graveyard.length))add(id,'SOUL_RELEASE',{zone});
   if(c.cardId===BOOK_LIFE&&!graveBanishBlocked(s,seat)&&canSummon(s,seat))for(const targetId of p.graveyard.filter(x=>getCard(s,x,ctx).race==='Zombie'&&revivable(s,x,ctx)))for(const foe of s.players[other(seat)].graveyard.filter(x=>getCard(s,x,ctx).type.includes('Monster')))for(const monsterZone of zones(s,seat))for(const declaredType of ['attack','faceUpDefense'])add(id,'BOOK_LIFE',{zone,targetId,searchIds:[foe],monsterZone,declaredType});
  }
 }
 return out;
}

export const graveyardChoice=(kind:string)=>['SOUL_RELEASE_TARGET','RETURN_PICK','VAMPIRE_SEND'].includes(kind);
export function graveyardChoices(s:DuelState,ctx:EngineContext,seat:Seat):LegalAction[]{
 const q=s.pendingLightChoice!;if(q.controller!==seat)return [];
 const base={type:'COMPLETE_LIGHT_CHOICE' as const,seat,sourceId:q.sourceId},out:LegalAction[]=[];
 if(q.kind==='SOUL_RELEASE_TARGET'){
  if(!graveBanishBlocked(s,seat))for(const choiceId of s.players.flatMap(p=>p.graveyard).filter(id=>!q.chosenIds?.includes(id)))out.push({...base,choiceId,description:'Soul Release · choose up to 5 cards from either Graveyard'});
  if(q.chosenIds?.length||!out.length)out.push({type:'FINISH_LIGHT_CHOICE',seat,sourceId:q.sourceId,description:'Confirm Soul Release targets'});
 }else if(q.kind==='VAMPIRE_SEND'){
  for(const choiceId of s.players[seat].deck.filter(id=>getCard(s,id,ctx).type.includes(q.declaredType!)))out.push({...base,choiceId,description:`Vampire Lord · send a ${q.declaredType} from your Deck to the Graveyard`});
  if(!out.length)out.push({type:'FINISH_LIGHT_CHOICE',seat,sourceId:q.sourceId,description:'No card of the declared type · finish'});
 }else{
  const picks=q.picks??[],free=zones(s,seat).filter(zone=>!picks.some(p=>p.zone===zone));
  if(canSummon(s,seat))for(const choiceId of s.players[seat].banished.filter(id=>revivable(s,id,ctx)&&!picks.some(p=>p.id===id)))for(const monsterZone of free)for(const declaredType of ['attack','faceUpDefense'])out.push({...base,choiceId,monsterZone,declaredType,description:'Return from the Different Dimension · choose monsters and positions'});
  if(!out.length)out.push({type:'FINISH_LIGHT_CHOICE',seat,sourceId:q.sourceId,description:'Summon all selected monsters'});
 }
 return out;
}
function finishReturn(s:DuelState,ctx:EngineContext){const q=s.pendingLightChoice!;s.pendingLightChoice=undefined;for(const pick of q.picks??[]){const p=s.players[pick.seat];if(!canSummon(s,pick.seat)||!p.banished.includes(pick.id)||p.zones.monster[pick.zone]!==null||!revivable(s,pick.id,ctx))continue;p.banished.splice(p.banished.indexOf(pick.id),1);placeMonster(s,pick.id,pick.seat,pick.zone,pick.position,['attack','faceUpDefense']);s.cards[pick.id].returnBanishTurn=s.turn;}log(s,'SPECIAL_SUMMON','Return from the Different Dimension Special Summoned the selected banished monsters.',q.controller);}
export function dispatchGraveyard(s:DuelState,a:LightAction,ctx:EngineContext):boolean{
 if((a.type==='COMPLETE_LIGHT_CHOICE'||a.type==='FINISH_LIGHT_CHOICE')&&s.pendingLightChoice&&graveyardChoice(s.pendingLightChoice.kind)){
  const q=s.pendingLightChoice,id=a.type==='COMPLETE_LIGHT_CHOICE'?a.choiceId:undefined;
  if(q.kind==='SOUL_RELEASE_TARGET'){
   if(id)(q.chosenIds??=[]).push(id);
   if(a.type==='FINISH_LIGHT_CHOICE'||q.chosenIds?.length===5){s.pendingLightChoice=undefined;s.chain.push({instanceId:q.sourceId,controller:a.seat,effectId:'SOUL_RELEASE',targets:q.chosenIds??[],spellSpeed:1});s.priority=other(a.seat);s.consecutivePasses=0;log(s,'ACTIVATE','Soul Release targets the selected Graveyard cards.',a.seat);}
  }else if(q.kind==='VAMPIRE_SEND'){
   s.pendingLightChoice=undefined;if(id&&s.players[a.seat].deck.includes(id)){toGraveyard(s,id,'send');log(s,'SEND',`Vampire Lord sent ${getCard(s,id,ctx).name} from the Deck to the Graveyard.`,a.seat);}shuffleSearchedDeck(s,a.seat);
  }else{
   if(id&&a.type==='COMPLETE_LIGHT_CHOICE')(q.picks??=[]).push({id,seat:a.seat,zone:a.monsterZone!,position:a.declaredType as 'attack'|'faceUpDefense'});
   if(a.type==='FINISH_LIGHT_CHOICE'||!graveyardChoices(s,ctx,a.seat).some(a=>a.type==='COMPLETE_LIGHT_CHOICE'))finishReturn(s,ctx);
  }
  return true;
 }
 if(a.type!=='ACTIVATE_LIGHT_EFFECT'||!['BAZOO','SOUL_RELEASE','RETURN_DIMENSION','BOOK_LIFE','LILY_BOOST','LILY_SKIP'].includes(a.effectId))return false;
 const c=s.cards[a.instanceId],p=s.players[a.seat];
 if(a.effectId==='LILY_BOOST'||a.effectId==='LILY_SKIP'){
  (s.pendingAttack!.lilyDecided??=[]).push(a.instanceId);
  if(a.effectId==='LILY_BOOST'){p.lp-=2000;s.chain.push({instanceId:a.instanceId,controller:a.seat,effectId:'LILY_BOOST',targets:[],spellSpeed:2});s.priority=other(a.seat);s.consecutivePasses=0;log(s,'ACTIVATE','Injection Fairy Lily paid 2000 LP for +3000 ATK during this damage calculation.',a.seat);}return true;
 }
 if(a.effectId==='BAZOO'){for(const id of a.materials??[])toBanished(s,id);c.effectUsedTurn=s.turn;}
 if(a.effectId==='RETURN_DIMENSION')p.lp=Math.ceil(p.lp/2);
 if(a.zone!==undefined){if(c.location==='hand')removeFromHand(p,a.instanceId);p.zones.spell[a.zone]=a.instanceId;Object.assign(c,{location:'spell',zone:a.zone,faceDown:false});}
 if(a.effectId==='SOUL_RELEASE'){s.pendingLightChoice={kind:'SOUL_RELEASE_TARGET',sourceId:a.instanceId,controller:a.seat,chosenIds:[]};return true;}
 s.chain.push({instanceId:a.instanceId,controller:a.seat,effectId:a.effectId,targets:a.effectId==='BOOK_LIFE'?[a.targetId!,...a.searchIds??[]]:[],monsterZone:a.monsterZone,declaredType:a.declaredType,value:a.materials?.length,spellSpeed:a.effectId==='RETURN_DIMENSION'?2:1});s.priority=other(a.seat);s.consecutivePasses=0;log(s,'ACTIVATE',`${getCard(s,a.instanceId,ctx).name} activated.`,a.seat);return true;
}

export function graveyardTriggerOptions(s:DuelState,ctx:EngineContext,t:PendingTrigger):LegalAction[]|undefined{
 const seat=t.controller,base={type:'ACTIVATE_TRIGGER' as const,seat,sourceId:t.sourceId},out:LegalAction[]=[];
 if(t.effectId==='VAMPIRE_SEND')return ['Monster','Spell','Trap'].map(declaredType=>({...base,declaredType,description:`Vampire Lord · declare ${declaredType}`}));
 if(t.effectId==='KOKKI_DESTROY')return [{...base,choiceId:t.eligibleIds?.[0],description:'Ryu Kokki · destroy the battling Warrior or Spellcaster'}];
 if(!['TURTLE_SUMMON','RAT_SUMMON','SCOUT_RETURN','SURVIVOR_RETURN','VAMPIRE_RETURN'].includes(t.effectId))return;
 const p=s.players[seat],recruit=t.effectId==='TURTLE_SUMMON'||t.effectId==='RAT_SUMMON';
 const ids=recruit?p.deck.filter(id=>{const c=getCard(s,id,ctx);return canRecruit(s,id,ctx)&&(t.effectId==='TURTLE_SUMMON'?c.race==='Zombie'&&Number(c.def)<=2000:c.attribute==='EARTH'&&Number(c.atk)<=1500);}):[t.sourceId];
 if(canSummon(s,seat))for(const choiceId of ids)for(const monsterZone of zones(s,seat))for(const declaredType of t.effectId==='RAT_SUMMON'||t.effectId==='SCOUT_RETURN'?['attack']:['attack','faceUpDefense'])out.push({...base,choiceId,monsterZone,declaredType,description:`${getCard(s,t.sourceId,ctx).name} · Special Summon ${getCard(s,choiceId,ctx).name}`});
 if(!t.mandatory)out.push({type:'DECLINE_PENDING_TRIGGER',seat,sourceId:t.sourceId,description:'Decline optional recruiter effect'});
 else if(!out.length)out.push({...base,description:'Resolve without a Special Summon (no available Monster Zone)'});
 return out;
}

export function resolveGraveyard(s:DuelState,l:ChainLink,ctx:EngineContext):boolean{
 const seat=l.controller,p=s.players[seat],c=s.cards[l.instanceId],target=l.targets[0];
 if(l.effectId==='BAZOO'){if(c.location==='monster'&&!c.faceDown)(c.bazooBoosts??=[]).push({amount:(l.value??0)*300,expiresTurn:s.turn+1});}
 else if(l.effectId==='SOUL_RELEASE'){if(!graveBanishBlocked(s,seat))for(const id of l.targets)if(s.cards[id]?.location==='graveyard')toBanished(s,id);}
 else if(l.effectId==='BOOK_LIFE'){
  if(canSummon(s,seat)&&p.graveyard.includes(target)&&revivable(s,target,ctx)&&getCard(s,target,ctx).race==='Zombie'&&l.monsterZone!==undefined&&p.zones.monster[l.monsterZone]===null){p.graveyard.splice(p.graveyard.indexOf(target),1);placeMonster(s,target,seat,l.monsterZone,l.declaredType==='faceUpDefense'?'faceUpDefense':'attack',['attack','faceUpDefense']);}
  const foe=l.targets[1];if(!graveBanishBlocked(s,seat)&&s.players[other(seat)].graveyard.includes(foe))toBanished(s,foe);
 }else if(l.effectId==='RETURN_DIMENSION'){if(canSummon(s,seat)&&zones(s,seat).length&&p.banished.some(id=>revivable(s,id,ctx)))s.pendingLightChoice={kind:'RETURN_PICK',sourceId:l.instanceId,controller:seat,picks:[]};}
 else if(l.effectId==='LILY_BOOST'){if(c.location==='monster'&&!c.faceDown)(s.pendingAttack!.lilyBoosted??=[]).push(l.instanceId);}
 else if(l.effectId==='VAMPIRE_SEND'){s.pendingLightChoice={kind:'VAMPIRE_SEND',sourceId:l.instanceId,controller:other(seat),declaredType:l.declaredType};}
 else if(l.effectId==='KOKKI_DESTROY'){if(s.cards[target]?.location==='monster'&&!s.cards[target].faceDown&&['Warrior','Spellcaster'].includes(getCard(s,target,ctx).race??''))toGraveyard(s,target);}
 else if(['TURTLE_SUMMON','RAT_SUMMON','SCOUT_RETURN','SURVIVOR_RETURN','VAMPIRE_RETURN'].includes(l.effectId)){
  const recruit=l.effectId==='TURTLE_SUMMON'||l.effectId==='RAT_SUMMON',pile=recruit?p.deck:l.effectId==='VAMPIRE_RETURN'?p.graveyard:p.banished;
  if(canSummon(s,seat)&&target&&pile.includes(target)&&l.monsterZone!==undefined&&p.zones.monster[l.monsterZone]===null){pile.splice(pile.indexOf(target),1);placeMonster(s,target,seat,l.monsterZone,l.declaredType==='faceUpDefense'?'faceUpDefense':'attack',['attack','faceUpDefense']);}
  if(recruit)shuffleSearchedDeck(s,seat);
 }else return false;
 log(s,'RESOLVE',`${getCard(s,l.instanceId,ctx).name} effect resolved.`,seat);return true;
}

/** At End Phase, delayed banishment can itself enable a D.D. return this phase. */
export function graveyardPhaseTriggers(s:DuelState){
 if(s.chain.length||s.pendingLightChoice||s.pendingTriggers?.length||s.summonResponse)return;
 if(s.phase==='END'){
  for(const c of Object.values(s.cards))if(c.location==='monster'&&c.returnBanishTurn===s.turn&&!c.faceDown)toBanished(s,c.instanceId);
  for(const c of Object.values(s.cards))if(c.location==='banished'&&c.banishedTurn===s.turn&&c.ddReturnTurn!==s.turn&&(c.cardId===SCOUT||c.cardId===SURVIVOR&&c.survivorReturn)){
   c.ddReturnTurn=s.turn;(s.pendingTriggers??=[]).push({sourceId:c.instanceId,controller:c.owner,effectId:c.cardId===SCOUT?'SCOUT_RETURN':'SURVIVOR_RETURN',mandatory:true});
  }
 }
 if(s.phase==='STANDBY')for(const c of Object.values(s.cards))if(c.location==='graveyard'&&c.controller===s.current&&c.vampireReturnTurn===s.turn){c.vampireReturnTurn=undefined;(s.pendingTriggers??=[]).push({sourceId:c.instanceId,controller:c.owner,effectId:'VAMPIRE_RETURN',mandatory:true});}
}
/** Gorilla's continuous destruction waits until after calculation when revealed by battle. */
export function enforceGorillas(s:DuelState){if(s.pendingAttack&&['FLIP','CALCULATE'].includes(s.pendingAttack.damageStep??''))return;for(const c of Object.values(s.cards))if(c.location==='monster'&&!c.faceDown&&c.position==='faceUpDefense'&&c.cardId===GORILLA)toGraveyard(s,c.instanceId);}
export function lilyActions(s:DuelState,seat:Seat):LegalAction[]|undefined{
 const b=s.pendingAttack;if(b?.damageStep!=='CALCULATE')return;
 const id=[b.attackerId,b.targetId].find(id=>id&&s.cards[id]?.location==='monster'&&!s.cards[id].faceDown&&s.cards[id].cardId===LILY&&!b.lilyDecided?.includes(id));
 if(!id)return;
 if(s.cards[id].controller!==seat)return [];
 const base={type:'ACTIVATE_LIGHT_EFFECT' as const,seat,instanceId:id},out:LegalAction[]=[{...base,effectId:'LILY_SKIP',description:'Do not pay · continue damage calculation'}];
 if(s.players[seat].lp>2000)out.unshift({...base,effectId:'LILY_BOOST',description:'Pay 2000 LP · gain 3000 ATK for this battle'});
 return out;
}
