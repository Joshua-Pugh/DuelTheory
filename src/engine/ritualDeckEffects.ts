import {restrictStat} from './goatControlEffects';
import {lightResponses,HOSHI,SOUL} from './lightDeckEffects';
import {chaosResponses,chaosMain,resolveChaos} from './chaosTurboEffects';
import {getCard,revealEffectCards,log,removeFromHand,toGraveyard,toBanished,placeMonster,seededShuffle,settleLifePoints,detachFaceDown,type DuelState,type EngineContext,type Seat,type LegalAction,type ChainLink} from './model';

export const TRIBE=33184167,TSUKUYOMI=34853266,CHAOS_SORCERER=9596126,BLS=72989439,BREAKER=71413901,ZORC=97642679,SHINATO=86327225,SERPENT=8131171;
export const HEAVY_STORM=19613556,NOBLEMAN=71044499,DUO=44763025;
export type DeckEffect='CARD_DESTRUCTION'|'RAIGEKI_BREAK'|'DUSTSHOOT'|'TRIBE_DESTROY'|'CHAOS_BANISH'|'BREAKER_DESTROY'|'ZORC_ROLL'|'HEAVY_STORM'|'NOBLEMAN'|'DUO'|'RING'|'TORRENTIAL'|'CALL'|'PREMATURE'|'SNATCH';
export type DeckEffectAction=
 | {type:'ACTIVATE_DECK_EFFECT';seat:Seat;instanceId:string;effectId:DeckEffect;targetId?:string;costId?:string;declaredType?:string;zone?:number;monsterZone?:number}
 | {type:'PASS_SUMMON_NEGATION';seat:Seat}
 | {type:'SPECIAL_SUMMON_CHAOS';seat:Seat;instanceId:string;materials:string[];monsterZone:number;position:'attack'|'faceUpDefense'}
 | {type:'COMPLETE_DUSTSHOOT';seat:Seat;targetId?:string}
 | {type:'COMPLETE_DIE_ROLL';seat:Seat}
 | {type:'CHOOSE_RANDOM_DISCARD';seat:Seat;index:number}
 | {type:'PASS_SUMMON_RESPONSE';seat:Seat}
 | {type:'COMPLETE_ZORC';seat:Seat;sourceId:string;targetId:string};

const other=(seat:Seat):Seat=>seat===0?1:0;
const monsters=(s:DuelState)=>[...s.players[0].zones.monster,...s.players[1].zones.monster].filter((id):id is string=>id!==null);
const spells=(s:DuelState)=>[...s.players[0].zones.spell,...s.players[1].zones.spell].filter((id):id is string=>id!==null);
export const faceUpMonsters=(s:DuelState)=>monsters(s).filter(id=>!s.cards[id].faceDown);
export function battleAttack(s:DuelState,id:string,ctx:EngineContext):number{const c=s.cards[id],card=getCard(s,id,ctx);let value=(restrictStat(s,id,'atk',ctx)??Number(card.atk))+(c.cardId===BREAKER?(c.spellCounters??0)*300:0);for(const source of Object.values(s.cards).filter(x=>x.location==='monster'&&!x.faceDown)){if(source.cardId===HOSHI)value+=card.attribute==='LIGHT'?500:card.attribute==='DARK'?-400:0;if(source.cardId===SOUL&&source.controller!==c.controller&&s.current===c.controller&&s.phase==='BATTLE')value-=300;}return Math.max(0,value);}
export function summonDeckTriggers(s:DuelState,id:string,normal=false){
 const c=s.cards[id];if(c.faceDown)return;const ready=([c.controller,other(c.controller)] as Seat[]).filter(seat=>s.players[seat].zones.spell.some(x=>x&&[29401950,41420027,53582587,83555666,97077563,4178474,64697231].includes(s.cards[x].cardId)&&s.cards[x].faceDown&&s.cards[x].setTurn!==s.turn));if(ready.length)s.summonResponse={negatable:normal,summoner:c.controller,sourceId:id,priority:ready[0]};
 if(c.cardId===2134346)c.spiritReturnTurn=s.turn;
 if(c.cardId===TSUKUYOMI){c.spiritReturnTurn=s.turn;(s.pendingTriggers??=[]).push({sourceId:id,controller:c.controller,effectId:'TSUKUYOMI_SET',mandatory:true});}
 if(c.cardId===40737112)(s.pendingTriggers??=[]).push({sourceId:id,controller:c.controller,effectId:'DMOC_RECOVER',mandatory:false});
 if(c.cardId===BREAKER&&normal)(s.pendingTriggers??=[]).push({sourceId:id,controller:c.controller,effectId:'BREAKER_COUNTER',mandatory:true});
}
export function deckMainActions(s:DuelState,ctx:EngineContext,seat:Seat):LegalAction[]{
 const p=s.players[seat],actions:LegalAction[]=[];
 const add=(instanceId:string,effectId:DeckEffect,extra:Partial<Extract<DeckEffectAction,{type:'ACTIVATE_DECK_EFFECT'}>>={},description?:string)=>actions.push({type:'ACTIVATE_DECK_EFFECT',seat,instanceId,effectId,...extra,description:description??`Activate ${getCard(s,instanceId,ctx).name} effect`});
 for(const id of p.zones.monster){if(!id||s.cards[id].faceDown)continue;const c=s.cards[id];
  if(c.cardId===TRIBE){const types=['Aqua','Beast','Beast-Warrior','Dinosaur','Dragon','Fairy','Fiend','Fish','Insect','Machine','Plant','Pyro','Reptile','Rock','Sea Serpent','Spellcaster','Thunder','Warrior','Winged Beast','Zombie'];for(const costId of p.hand)for(const declaredType of types)add(id,'TRIBE_DESTROY',{costId,declaredType},`Discard 1 card; destroy face-up ${declaredType} monsters`);}
  if((c.cardId===CHAOS_SORCERER||c.cardId===BLS)&&c.effectUsedTurn!==s.turn&&c.attackedTurn!==s.turn)for(const targetId of monsters(s)){if(c.cardId===CHAOS_SORCERER&&s.cards[targetId].faceDown)continue;add(id,'CHAOS_BANISH',{targetId});}
  if(c.cardId===BREAKER&&(c.spellCounters??0)>0)for(const targetId of spells(s))add(id,'BREAKER_DESTROY',{targetId});
  if(c.cardId===ZORC&&c.effectUsedTurn!==s.turn&&s.players[other(seat)].zones.monster.some(Boolean))add(id,'ZORC_ROLL',{},'Roll a die · Dark Master - Zorc');
 }
 const light=p.graveyard.filter(id=>getCard(s,id,ctx).type.includes('Monster')&&getCard(s,id,ctx).attribute==='LIGHT');
 const dark=p.graveyard.filter(id=>getCard(s,id,ctx).type.includes('Monster')&&getCard(s,id,ctx).attribute==='DARK');
 const kycoo=s.players[other(seat)].zones.monster.some(id=>id&&!s.cards[id].faceDown&&s.cards[id].cardId===88240808);
 if(!kycoo)for(const id of p.hand){if(![CHAOS_SORCERER,BLS].includes(s.cards[id].cardId))continue;for(const l of light)for(const d of dark)for(let monsterZone=0;monsterZone<5;monsterZone++)if(p.zones.monster[monsterZone]===null)for(const position of ['attack','faceUpDefense'] as const)actions.push({type:'SPECIAL_SUMMON_CHAOS',seat,instanceId:id,materials:[l,d],monsterZone,position,description:`Special Summon ${getCard(s,id,ctx).name} in ${position==='attack'?'Attack':'Defense'} Position`});}
 for(const id of [...p.hand,...p.zones.spell.filter((id):id is string=>id!==null&&Boolean(s.cards[id].faceDown))]){
  const c=s.cards[id],zones=c.location==='hand'?p.zones.spell.map((v,i)=>v===null?i:-1).filter(i=>i>=0):[c.zone!];
  for(const zone of zones){
   if(c.cardId===70828912&&p.lp>800)for(const targetId of p.graveyard.filter(id=>canRevive(s,id,ctx)))for(let monsterZone=0;monsterZone<5;monsterZone++)if(p.zones.monster[monsterZone]===null)add(id,'PREMATURE',{zone,targetId,monsterZone});
   if(c.cardId===45986603&&p.zones.monster.some(x=>x===null))for(const targetId of s.players[other(seat)].zones.monster.filter((id):id is string=>id!==null&&!s.cards[id].faceDown))add(id,'SNATCH',{zone,targetId});
   if(c.cardId===HEAVY_STORM&&spells(s).some(x=>x!==id))add(id,'HEAVY_STORM',{zone});
   if(c.cardId===NOBLEMAN)for(const targetId of monsters(s).filter(x=>s.cards[x].faceDown))add(id,'NOBLEMAN',{zone,targetId},'Activate Nobleman of Crossout · choose face-down monster');
   if(c.cardId===DUO&&p.lp>1000&&s.players[other(seat)].hand.length)add(id,'DUO',{zone});
  }
 }
 return [...actions,...chaosMain(s,seat)];
}
export function dispatchDeckEffect(s:DuelState,a:DeckEffectAction,ctx:EngineContext){
 const p=s.players[a.seat];
 if(a.type==='COMPLETE_DUSTSHOOT'){const pending=s.pendingChaos!;const opponent=s.players[other(a.seat)];if(a.targetId&&opponent.hand.includes(a.targetId)){removeFromHand(opponent,a.targetId);opponent.deck.push(a.targetId);s.cards[a.targetId].location='deck';opponent.deck=seededShuffle(opponent.deck,s.seed+s.events.length*7919);}s.pendingChaos=undefined;if(s.cards[pending.sourceId].location==='spell')toGraveyard(s,pending.sourceId,'rule');log(s,'RESOLVE','Trap Dustshoot hand inspection completed; returned monster shuffled into Deck.',a.seat);return;}
 if(a.type==='COMPLETE_DIE_ROLL'){
  const roll=s.pendingRoll!;s.pendingRoll=undefined;const result=roll.result;log(s,'DIE_RESULT',`Dark Master - Zorc rolled ${result}.`,a.seat);
  if(result===6||result<=2){const owner=result===6?a.seat:other(a.seat);for(const id of [...s.players[owner].zones.monster])if(id)toGraveyard(s,id);}
  else if(s.players[other(a.seat)].zones.monster.some(Boolean))s.pendingDeckChoice={sourceId:roll.sourceId,controller:a.seat,kind:'ZORC_DESTROY_ONE'};
  return;
 }
 if(a.type==='CHOOSE_RANDOM_DISCARD'){
  const pending=s.pendingRandomDiscard!,id=pending.order[a.index];s.pendingRandomDiscard=undefined;
  removeFromHand(p,id);toGraveyard(s,id,'discard');log(s,'RANDOM_DISCARD',`Delinquent Duo: ${getCard(s,id,ctx).name} was selected face-down and discarded.`,a.seat);
  if(p.hand.length){s.pendingDiscard={sourceId:pending.sourceId,controller:a.seat,count:1};s.priority=a.seat;s.consecutivePasses=0;}
  else if(s.cards[pending.sourceId].location==='spell')toGraveyard(s,pending.sourceId,'rule');
  return;
 }
 if(a.type==='PASS_SUMMON_NEGATION'){if(s.summonResponse)s.summonResponse.negatable=false;log(s,'SUMMON_ALLOWED','Summon allowed; resolve on-summon effects.',a.seat);return;}
 if(a.type==='PASS_SUMMON_RESPONSE'){const window=s.summonResponse,otherSeat=other(a.seat);if(window&&!window.passed?.includes(otherSeat)&&deckResponseActions(s,ctx,otherSeat).length){window.passed=[...(window.passed??[]),a.seat];window.priority=otherSeat;}else s.summonResponse=undefined;log(s,'SUMMON_RESPONSE','Passed summon response.',a.seat);return;}
 if(a.type==='COMPLETE_ZORC'){toGraveyard(s,a.targetId);s.pendingDeckChoice=undefined;log(s,'RESOLVE',`Zorc destroyed ${getCard(s,a.targetId,ctx).name}.`,a.seat);return;}
 if(a.type==='SPECIAL_SUMMON_CHAOS'){for(const id of a.materials)toBanished(s,id);removeFromHand(p,a.instanceId);placeMonster(s,a.instanceId,a.seat,a.monsterZone,a.position,['attack','faceUpDefense']);s.cards[a.instanceId].properlySummoned=true;summonDeckTriggers(s,a.instanceId);if(s.summonResponse?.sourceId===a.instanceId)s.summonResponse.negatable=true;log(s,'SPECIAL_SUMMON',`${getCard(s,a.instanceId,ctx).name} Special Summoned by banishing a LIGHT and a DARK monster.`,a.seat);return;}
 const c=s.cards[a.instanceId];
 if(a.costId){removeFromHand(p,a.costId);toGraveyard(s,a.costId,'cost');}
 if(a.effectId==='BREAKER_DESTROY')c.spellCounters=(c.spellCounters??0)-1;
 if(a.effectId==='CHAOS_BANISH'){c.effectUsedTurn=s.turn;c.cannotAttackTurn=s.turn;}
 if(a.effectId==='ZORC_ROLL')c.effectUsedTurn=s.turn;
 if(a.effectId==='DUO')p.lp-=1000;if(a.effectId==='PREMATURE')p.lp-=800;
 if(a.zone!==undefined){if(c.location==='hand')removeFromHand(p,a.instanceId);p.zones.spell[a.zone]=a.instanceId;Object.assign(c,{location:'spell',zone:a.zone,faceDown:false});}
 s.chain.push({instanceId:a.instanceId,controller:a.seat,effectId:a.effectId,targets:a.targetId?[a.targetId]:[],spellSpeed:['RING','TORRENTIAL','CALL','RAIGEKI_BREAK','DUSTSHOOT'].includes(a.effectId)?2:1,declaredType:a.declaredType,monsterZone:a.monsterZone});s.priority=other(a.seat);s.consecutivePasses=0;
 log(s,'ACTIVATE',`${getCard(s,a.instanceId,ctx).name} activated${a.declaredType?`; declared ${a.declaredType}`:''}.`,a.seat);
}
/** Returns true only for effects implemented here. Resolver preserves normal chain ordering. */
export function resolveDeckEffect(s:DuelState,link:ChainLink,ctx:EngineContext):boolean{
 const before=link.effectId==='SPY_SUMMON'?new Set(s.players[link.controller].zones.monster.filter(Boolean)):undefined;
 if(resolveChaos(s,link,ctx)){if(before)for(const id of s.players[link.controller].zones.monster)if(id&&!before.has(id))summonDeckTriggers(s,id);return true;}
 const {controller:seat,effectId}=link,p=s.players[seat],target=link.targets[0],c=s.cards[link.instanceId];
 if(effectId==='RING'){
  if(s.cards[target]?.location==='monster'&&!s.cards[target].faceDown){const damage=battleAttack(s,target,ctx);toGraveyard(s,target);for(const player of s.players)player.lp=Math.max(0,player.lp-damage);settleLifePoints(s);}
 }else if(effectId==='TORRENTIAL'){
  for(const id of monsters(s))toGraveyard(s,id);
 }else if(effectId==='CALL'||effectId==='PREMATURE'){
  if(c.location==='spell'&&!c.faceDown&&p.graveyard.includes(target)&&link.monsterZone!==undefined&&p.zones.monster[link.monsterZone]===null){p.graveyard.splice(p.graveyard.indexOf(target),1);placeMonster(s,target,seat,link.monsterZone,'attack',['attack']);c.linkedTarget=target;summonDeckTriggers(s,target);}
 }else if(effectId==='SNATCH'){
  const t=s.cards[target],zone=p.zones.monster.findIndex(x=>x===null);
  if(c.location==='spell'&&t?.location==='monster'&&!t.faceDown&&t.controller!==seat&&zone>=0){c.previousController=t.controller;s.players[t.controller].zones.monster[t.zone!]=null;t.controller=seat;t.zone=zone;p.zones.monster[zone]=target;c.linkedTarget=target;}
 }else if(effectId==='DMOC_RECOVER'){
  if(p.graveyard.includes(target)&&getCard(s,target,ctx).type.includes('Spell')){p.graveyard.splice(p.graveyard.indexOf(target),1);p.hand.push(target);s.cards[target].location='hand';revealEffectCards(s,seat,[target],ctx,'Dark Magician of Chaos returned a Spell');}
 }else if(effectId==='BLS_EXTRA_ATTACK'){
  if(c.location==='monster'&&!c.faceDown&&c.effectUsedTurn!==s.turn){c.extraAttackTurn=s.turn;c.effectUsedTurn=s.turn;}
 }else if(effectId==='SHINATO_DAMAGE'){
  s.players[other(seat)].lp=Math.max(0,s.players[other(seat)].lp-(link.value??0));settleLifePoints(s);
 }else if(effectId==='TRIBE_DESTROY'){
  for(const id of faceUpMonsters(s).filter(id=>getCard(s,id,ctx).race===link.declaredType))toGraveyard(s,id);
 }else if(effectId==='CHAOS_BANISH'){
  if(s.cards[target]?.location==='monster'&&(c.cardId===BLS||!s.cards[target].faceDown))toBanished(s,target);
 }else if(effectId==='BREAKER_DESTROY'){
  if(s.cards[target]?.location==='spell')toGraveyard(s,target);
 }else if(effectId==='HEAVY_STORM'){
  for(const id of spells(s))toGraveyard(s,id);
 }else if(effectId==='NOBLEMAN'){
  if(s.cards[target]?.location==='monster'&&s.cards[target].faceDown){const card=getCard(s,target,ctx);toBanished(s,target);if(card.type.includes('Flip'))for(const owner of [0,1] as Seat[]){for(const id of [...s.players[owner].deck])if(getCard(s,id,ctx).name===card.name){s.players[owner].deck.splice(s.players[owner].deck.indexOf(id),1);s.cards[id].location='banished';s.cards[id].faceDown=false;s.players[owner].banished.push(id);}s.players[owner].deck=seededShuffle(s.players[owner].deck,s.seed+s.events.length+owner*7919);}log(s,'REVEAL',`Nobleman of Crossout banished ${card.name}${card.type.includes('Flip')?' and matching copies from both Decks':''}.`,seat);}
 }else if(effectId==='DUO'){
  const opponent=other(seat),hand=s.players[opponent].hand;
  if(hand.length){s.pendingRandomDiscard={sourceId:link.instanceId,controller:opponent,order:seededShuffle(hand,effectRandom(s))};s.priority=opponent;s.consecutivePasses=0;log(s,'RANDOM_DISCARD_READY','Delinquent Duo: hand shuffled face-down for the random discard.',opponent);}
 }else if(effectId==='ZORC_ROLL'){
  const result=1+effectRandom(s)%6;s.pendingRoll={sourceId:link.instanceId,controller:seat,result};s.priority=seat;s.consecutivePasses=0;
  log(s,'DIE_ROLL_START','Dark Master - Zorc: rolling a six-sided die.',seat);
 }else if(effectId==='TSUKUYOMI_SET'){
  if(s.cards[target]?.location==='monster'&&!s.cards[target].faceDown){s.cards[target].position='faceDownDefense';s.cards[target].faceDown=true;detachFaceDown(s,target);}
 }else if(effectId==='BREAKER_COUNTER'){
  if(c.location==='monster'&&!c.faceDown)c.spellCounters=1;
 }else if(effectId==='SERPENT_RECOVER'){
  const i=p.graveyard.indexOf(link.instanceId);if(i>=0){p.graveyard.splice(i,1);p.hand.push(link.instanceId);c.location='hand';revealEffectCards(s,seat,[link.instanceId],ctx,'Sinister Serpent returned to hand');}
 }else return false;
 log(s,'RESOLVE',`${getCard(s,link.instanceId,ctx).name} effect resolved.`,seat);return true;
}

function canRevive(s:DuelState,id:string,ctx:EngineContext){const card=getCard(s,id,ctx);return card.type.includes('Monster')&&!card.type.includes('Spirit')&&(!card.type.includes('Ritual')&&!card.type.includes('Fusion')&&![CHAOS_SORCERER,BLS,77527210].includes(card.id)||Boolean(s.cards[id].properlySummoned));}
export function deckResponseActions(s:DuelState,ctx:EngineContext,seat:Seat):LegalAction[]{
 const p=s.players[seat],actions:LegalAction[]=[];
 for(const id of p.zones.spell){if(!id||!s.cards[id].faceDown||s.cards[id].setTurn===s.turn)continue;const c=s.cards[id];
  const add=(effectId:DeckEffect,targetId?:string,monsterZone?:number)=>actions.push({type:'ACTIVATE_DECK_EFFECT',seat,instanceId:id,effectId,zone:c.zone,targetId,monsterZone,description:`Activate ${getCard(s,id,ctx).name}`});
  if(c.cardId===83555666)for(const target of faceUpMonsters(s))add('RING',target);
  if(c.cardId===53582587&&s.summonResponse)add('TORRENTIAL');
  if(c.cardId===97077563)for(const target of p.graveyard.filter(id=>canRevive(s,id,ctx)))for(let zone=0;zone<5;zone++)if(p.zones.monster[zone]===null)add('CALL',target,zone);
 }
 return [...actions,...chaosResponses(s,ctx,seat),...lightResponses(s,ctx,seat)];
}


/** Avalanche adjacent session seeds before a replayable random effect. */
function effectRandom(s:DuelState){let n=(s.seed+Math.imul(s.events.length+1,0x9e3779b9))>>>0;n=Math.imul(n^(n>>>16),0x21f0aaad);n=Math.imul(n^(n>>>15),0x735a2d97);return (n^(n>>>15))>>>0;}

/** Main-deck activation/resolution coverage; side-deck cards remain a separate pass. */
export const ritualDeckEffectIds:ReadonlySet<number>=new Set([TRIBE,TSUKUYOMI,CHAOS_SORCERER,BLS,BREAKER,ZORC,SHINATO,SERPENT,HEAVY_STORM,NOBLEMAN,DUO,40737112,70828912,45986603,97077563,83555666,53582587]);
