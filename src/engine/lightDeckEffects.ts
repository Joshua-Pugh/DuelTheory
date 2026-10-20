import {shuffleSearchedDeck} from './deckShuffle';
import {reasoningActions,reasoningChoice,reasoningChoices,completeReasoning,resolveReasoning} from './reasoningGateEffects';
import {monarchActions,resolveMonarch} from './monarchEffects';
import {goatControlMain,dispatchGoatControl,resolveGoatControl,metamorphosisChoices,completeMetamorphosis} from './goatControlEffects';
import {draw,getCard,revealEffectCards,log,placeMonster,removeFromHand,returnToHand,settleLifePoints,toBanished,toGraveyard,type DuelState,type EngineContext,type ChainLink,type Seat,type LegalAction} from './model';
export const SOUL=77527210,ZABORG=51945556,PARSHATH=18036057,ASURA=2134346,CANNON=11384280,ARCHER=91869203,VENUS=64734921,SHINE_BALL=39552864,HOSHI=67629977,EXILED=74131780,SWAP=31036355,ROTA=32807846,TRUNADE=42703248,SOLAR=44472639,WABOKU=12607053,SCAPEGOAT=73915051,LAST_WILL=85602018,DUST=60082869;
export const lightEffectIds=new Set([SOUL,ZABORG,PARSHATH,ASURA,CANNON,ARCHER,VENUS,HOSHI,EXILED,SWAP,ROTA,TRUNADE,SOLAR,WABOKU,SCAPEGOAT,LAST_WILL,DUST]);
export type LightEffect='GATLING'|'REASONING'|'MONSTER_GATE'|'DIMENSION_FUSION'|'VORTEX'|'REINCARNATION'|'BLOWBACK'|'MARIONETTE'|'CEASEFIRE'|'MIND_CONTROL'|'DECREE'|'ROAR'|'MIND_CRUSH'|'BRAIN'|'THANKSGIVING'|'SMASHING'|'ENEMY_POSITION'|'ENEMY_CONTROL'|'BOTTOMLESS'|'CYLINDER'|'SOLEMN_CHAIN'|'SOLEMN_SUMMON'|'METAMORPHOSIS'|'TER_ABSORB'|'VENUS'|'CANNON'|'ARCHER'|'EXILED'|'SWAP'|'ROTA'|'TRUNADE'|'SOLAR'|'WABOKU'|'SCAPEGOAT'|'LAST_WILL'|'DUST';
export type LightChoice={chosenIds?:string[];counterRecipients?:string[];origin?:Seat;picks?:{id:string;seat:Seat;zone:number;position:'attack'|'faceUpDefense'}[];level?:number;kind:'GATLING_PICK'|'REASON_LEVEL'|'GATE_SUMMON'|'DIMENSION_PICK'|'MIND_CRUSH_NAME'|'METAMORPHOSIS'|'VENUS'|'ROTA'|'SWAP_FIRST'|'SWAP_SECOND'|'DUST_SET';sourceId:string;controller:Seat;firstId?:string};
export type LightAction={type:'ACTIVATE_LIGHT_EFFECT';seat:Seat;instanceId:string;effectId:LightEffect;zone?:number;targetId?:string;materials?:string[]}|{type:'SPECIAL_SUMMON_SOUL';seat:Seat;instanceId:string;materials:string[];monsterZone:number;declaredType:'attack'|'faceUpDefense'}|{type:'COMPLETE_LIGHT_CHOICE';seat:Seat;sourceId:string;choiceId?:string;monsterZone?:number;zone?:number;declaredType?:string}|{type:'FINISH_LIGHT_CHOICE';seat:Seat;sourceId:string};
const other=(seat:Seat):Seat=>seat===0?1:0;
const ownMonsters=(s:DuelState,seat:Seat)=>s.players[seat].zones.monster.filter((id):id is string=>id!==null);
const allMonsters=(s:DuelState)=>[...ownMonsters(s,0),...ownMonsters(s,1)];
const empty=(s:DuelState,seat:Seat)=>s.players[seat].zones.monster.flatMap((id,i)=>id===null?[i]:[]);
export const canSummon=(s:DuelState,seat:Seat)=>s.summonLockedTurn?.[seat]!==s.turn;
export function canRecruit(s:DuelState,id:string,ctx:EngineContext){const c=getCard(s,id,ctx);return c.type.includes('Monster')&&!c.type.includes('Spirit')&&!c.type.includes('Ritual')&&!c.type.includes('Fusion')&&!c.type.includes('Special Summon')&&![SOUL,72989439,9596126].includes(c.id);}
function pairs(ids:string[]){return ids.flatMap((a,i)=>ids.slice(i+1).map(b=>[a,b]));}
export function lightMainActions(s:DuelState,ctx:EngineContext,seat:Seat):LegalAction[]{
 const p=s.players[seat],result:LegalAction[]=[];
 const add=(instanceId:string,effectId:LightEffect,extra:Partial<Extract<LightAction,{type:'ACTIVATE_LIGHT_EFFECT'}>>={})=>result.push({type:'ACTIVATE_LIGHT_EFFECT',seat,instanceId,effectId,...extra,description:`Activate ${getCard(s,instanceId,ctx).name}`});
 for(const id of ownMonsters(s,seat)){const c=s.cards[id];if(c.faceDown)continue;
  if(c.cardId===VENUS&&canSummon(s,seat)&&p.lp>500&&empty(s,seat).length&&[...p.hand,...p.deck].some(x=>s.cards[x].cardId===SHINE_BALL))add(id,'VENUS');
  if(c.cardId===CANNON)for(const material of ownMonsters(s,seat).filter(id=>s.cards[id].cannotTributeTurn!==s.turn))add(id,'CANNON',{materials:[material]});
  if(c.cardId===ARCHER)for(const materials of pairs(ownMonsters(s,seat).filter(id=>s.cards[id].cannotTributeTurn!==s.turn)))add(id,'ARCHER',{materials});
  if(c.cardId===EXILED&&c.cannotTributeTurn!==s.turn)for(const targetId of allMonsters(s).filter(x=>x!==id))add(id,'EXILED',{materials:[id],targetId});
 }
 if(canSummon(s,seat)&&!ownMonsters(s,other(seat)).some(id=>!s.cards[id].faceDown&&s.cards[id].cardId===88240808))for(const id of p.hand.filter(x=>s.cards[x].cardId===SOUL))for(const materials of pairs(p.graveyard.filter(x=>getCard(s,x,ctx).type.includes('Monster')&&getCard(s,x,ctx).attribute==='LIGHT')))for(const monsterZone of empty(s,seat))for(const declaredType of ['attack','faceUpDefense'] as const)result.push({type:'SPECIAL_SUMMON_SOUL',seat,instanceId:id,materials,monsterZone,declaredType,description:`Special Summon Soul of Purity and Light · ${declaredType==='attack'?'ATK':'DEF'}`});
 for(const id of [...p.hand,...p.zones.spell.filter((x):x is string=>x!==null&&Boolean(s.cards[x].faceDown))]){
  const c=s.cards[id],zones=c.location==='spell'?[c.zone!]:p.zones.spell.flatMap((x,i)=>x===null?[i]:[]);
  for(const zone of zones){
   if(c.cardId===ROTA&&p.deck.some(x=>getCard(s,x,ctx).race==='Warrior'&&Number(getCard(s,x,ctx).level)<=4))add(id,'ROTA',{zone});
   if(c.cardId===TRUNADE&&[...s.players[0].zones.spell,...s.players[1].zones.spell].some(x=>x&&x!==id))add(id,'TRUNADE',{zone});
   if(c.cardId===SWAP&&ownMonsters(s,seat).length&&ownMonsters(s,other(seat)).length)add(id,'SWAP',{zone});
   if(c.cardId===LAST_WILL)add(id,'LAST_WILL',{zone});
  }
 }
 return [...result,...reasoningActions(s,ctx,seat),...monarchActions(s,ctx,seat),...goatControlMain(s,ctx,seat),...lightResponses(s,ctx,seat)];
}
export function lightResponses(s:DuelState,ctx:EngineContext,seat:Seat):LegalAction[]{
 const p=s.players[seat],actions:LegalAction[]=[];
 for(const id of [...p.hand,...p.zones.spell.filter((x):x is string=>x!==null)]){
  const c=s.cards[id],fromHand=c.location==='hand';if(fromHand&&(s.current!==seat))continue;
  if(!fromHand&&(!c.faceDown||c.setTurn===s.turn))continue;
  const zones=fromHand?p.zones.spell.flatMap((x,i)=>x===null?[i]:[]):[c.zone!];
  const add=(effectId:LightEffect,targetId?:string)=>{for(const zone of zones)actions.push({type:'ACTIVATE_LIGHT_EFFECT',seat,instanceId:id,effectId,zone,targetId,description:`Activate ${getCard(s,id,ctx).name}`});};
  if(!fromHand&&c.cardId===WABOKU)add('WABOKU');
  if(!fromHand&&c.cardId===SOLAR&&ownMonsters(s,seat).some(x=>!s.cards[x].faceDown&&getCard(s,x,ctx).attribute==='LIGHT'))add('SOLAR');
  if(!fromHand&&c.cardId===DUST)for(const target of s.players[other(seat)].zones.spell)if(target)add('DUST',target);
  if(c.cardId===SCAPEGOAT&&canSummon(s,seat)&&s.summonedThisTurn?.[seat]!==s.turn&&empty(s,seat).length>=4)add('SCAPEGOAT');
 }
 return [...actions,...reasoningActions(s,ctx,seat,true),...monarchActions(s,ctx,seat,true)];
}
export function lightChoiceActions(s:DuelState,ctx:EngineContext,seat:Seat):LegalAction[]{
 if(s.pendingLightChoice&&reasoningChoice(s.pendingLightChoice.kind))return reasoningChoices(s,ctx,seat);
 if(s.pendingLightChoice?.kind==='METAMORPHOSIS')return metamorphosisChoices(s,ctx,seat);
 const pending=s.pendingLightChoice;if(!pending||pending.controller!==seat)return [];
 if(pending.kind==='MIND_CRUSH_NAME')return [...ctx.cards.values()].filter(c=>c.type!=='Token Monster').map(c=>({type:'COMPLETE_LIGHT_CHOICE' as const,seat,sourceId:pending.sourceId,declaredType:c.name,description:'Mind Crush · name a card'}));
 const p=s.players[seat],base={type:'COMPLETE_LIGHT_CHOICE' as const,seat,sourceId:pending.sourceId,description:'Choose a card to resolve the effect'},choices:LegalAction[]=[];
 if(pending.kind==='VENUS')for(const choiceId of [...p.hand,...p.deck].filter(id=>s.cards[id].cardId===SHINE_BALL))for(const monsterZone of empty(s,seat))for(const declaredType of ['attack','faceUpDefense'] as const)choices.push({...base,choiceId,monsterZone,declaredType});
 if(pending.kind==='ROTA')for(const choiceId of p.deck.filter(id=>{const c=getCard(s,id,ctx);return c.type.includes('Monster')&&c.race==='Warrior'&&Number(c.level)<=4;}))choices.push({...base,choiceId});
 if(pending.kind==='SWAP_FIRST'||pending.kind==='SWAP_SECOND')for(const choiceId of ownMonsters(s,seat))choices.push({...base,choiceId});
 if(pending.kind==='DUST_SET')for(const choiceId of p.hand.filter(id=>{const c=getCard(s,id,ctx);return c.type.includes('Spell')||c.type.includes('Trap');}))for(const zone of p.zones.spell.flatMap((x,i)=>x===null?[i]:[]))choices.push({...base,choiceId,zone});
 if(!choices.length||pending.kind==='DUST_SET')choices.push({type:'FINISH_LIGHT_CHOICE',seat,sourceId:pending.sourceId,description:pending.kind==='DUST_SET'?'Do not Set a card':'No valid selection · finish effect'});
 return choices;
}
export function dispatchLight(s:DuelState,a:LightAction,ctx:EngineContext){
 const p=s.players[a.seat];
 if((a.type==='COMPLETE_LIGHT_CHOICE'||a.type==='FINISH_LIGHT_CHOICE')&&s.pendingLightChoice&&reasoningChoice(s.pendingLightChoice.kind)){completeReasoning(s,a,ctx);return;}
 if(a.type==='ACTIVATE_LIGHT_EFFECT'&&['METAMORPHOSIS','TER_ABSORB'].includes(a.effectId)){dispatchGoatControl(s,a,ctx);return;}
 if(a.type==='COMPLETE_LIGHT_CHOICE'&&s.pendingLightChoice?.kind==='METAMORPHOSIS'){completeMetamorphosis(s,a);return;}
 if(a.type==='SPECIAL_SUMMON_SOUL'){for(const id of a.materials)toBanished(s,id);removeFromHand(p,a.instanceId);placeMonster(s,a.instanceId,a.seat,a.monsterZone,a.declaredType,['attack','faceUpDefense']);s.cards[a.instanceId].properlySummoned=true;log(s,'SPECIAL_SUMMON','Soul of Purity and Light Special Summoned by banishing 2 LIGHT monsters.',a.seat);return;}
 if(a.type==='FINISH_LIGHT_CHOICE'){s.pendingLightChoice=undefined;return;}
 if(a.type==='COMPLETE_LIGHT_CHOICE'){
  const pending=s.pendingLightChoice!,id=a.choiceId!;s.pendingLightChoice=undefined;
  if(pending.kind==='MIND_CRUSH_NAME'){s.chain.push({instanceId:pending.sourceId,controller:a.seat,effectId:'MIND_CRUSH',targets:[],declaredType:a.declaredType,spellSpeed:2});s.priority=other(a.seat);s.consecutivePasses=0;log(s,'ACTIVATE',`Mind Crush activated; declared ${a.declaredType}.`,a.seat);return;}
  if(pending.kind==='VENUS'){if(!canSummon(s,a.seat))return;const fromDeck=p.deck.includes(id);if(fromDeck)p.deck.splice(p.deck.indexOf(id),1);else removeFromHand(p,id);placeMonster(s,id,a.seat,a.monsterZone!,a.declaredType as 'attack'|'faceUpDefense',['attack','faceUpDefense']);if(fromDeck)shuffleSearchedDeck(s,a.seat);log(s,'SPECIAL_SUMMON','Venus Special Summoned Mystical Shine Ball.',a.seat);}
  if(pending.kind==='ROTA'){p.deck.splice(p.deck.indexOf(id),1);p.hand.push(id);s.cards[id].location='hand';revealEffectCards(s,a.seat,[id],ctx,'Reinforcement of the Army added to hand');shuffleSearchedDeck(s,a.seat);log(s,'SEARCH',`Reinforcement of the Army added ${getCard(s,id,ctx).name}; shuffled Deck.`,a.seat);}
  if(pending.kind==='SWAP_FIRST'){s.pendingLightChoice={...pending,kind:'SWAP_SECOND',controller:other(a.seat),firstId:id};return;}
  if(pending.kind==='SWAP_SECOND'){const first=s.cards[pending.firstId!],second=s.cards[id];if(first?.location==='monster'&&second?.location==='monster'&&first.controller!==second.controller){const owner=first.controller,z1=first.zone!,z2=second.zone!;s.players[owner].zones.monster[z1]=id;p.zones.monster[z2]=first.instanceId;Object.assign(first,{controller:a.seat,zone:z2,lastPositionTurn:s.turn});Object.assign(second,{controller:owner,zone:z1,lastPositionTurn:s.turn});log(s,'CONTROL_CHANGE','Creature Swap exchanged both chosen monsters; positions are locked for this turn.',owner);}}
  if(pending.kind==='DUST_SET'){removeFromHand(p,id);p.zones.spell[a.zone!]=id;Object.assign(s.cards[id],{location:'spell',zone:a.zone,faceDown:true,setTurn:s.turn});log(s,'SET','Dust Tornado Set a Spell/Trap from hand.',a.seat);}
  return;
 }
 const c=s.cards[a.instanceId];
 if(!['MONSTER_GATE','VORTEX','REINCARNATION'].includes(a.effectId))for(const id of a.materials??[]){if(s.cards[id].cannotTributeTurn===s.turn)throw Error('This monster cannot be Tributed.');toGraveyard(s,id,'cost');}
 if(a.effectId==='MONSTER_GATE')for(const id of a.materials??[]){const before=s.pendingTriggers?.length??0;toGraveyard(s,id,'cost');const triggers=s.pendingTriggers?.splice(before)??[];(s.deferredTriggers??=[]).push(...triggers);}
 if(a.effectId==='VORTEX'||a.effectId==='REINCARNATION')for(const id of a.materials??[]){removeFromHand(p,id);toGraveyard(s,id,'discard');}
 if(a.effectId==='DIMENSION_FUSION')p.lp-=2000;
 if(a.effectId==='BLOWBACK'||a.effectId==='GATLING')s.cards[a.instanceId].effectUsedTurn=s.turn;
 if(a.effectId==='MARIONETTE')s.cards[a.instanceId].spellCounters!-=2;
 if(a.effectId==='BRAIN')p.lp-=800;if(a.effectId.startsWith('SOLEMN'))p.lp=Math.ceil(p.lp/2);
 if(a.effectId==='VENUS')p.lp-=500;
 if(a.effectId==='SCAPEGOAT'){s.summonLockedTurn??=[0,0];s.summonLockedTurn[a.seat]=s.turn;}
 if(a.zone!==undefined){if(c.location==='hand')removeFromHand(p,a.instanceId);p.zones.spell[a.zone]=a.instanceId;Object.assign(c,{location:'spell',zone:a.zone,faceDown:false});}
 if(a.effectId==='MIND_CRUSH'){s.pendingLightChoice={kind:'MIND_CRUSH_NAME',sourceId:a.instanceId,controller:a.seat};return;}
 s.chain.push({instanceId:a.instanceId,controller:a.seat,effectId:a.effectId,targets:a.targetId&&a.effectId!=='SMASHING'?[a.targetId]:[],nonTargetId:a.effectId==='SMASHING'?a.targetId:undefined,spellSpeed:a.effectId.startsWith('SOLEMN')?3:['CEASEFIRE','ROAR','DECREE','ENEMY_POSITION','ENEMY_CONTROL','BOTTOMLESS','CYLINDER','SOLAR','WABOKU','SCAPEGOAT','DUST'].includes(a.effectId)?2:1});s.priority=other(a.seat);s.consecutivePasses=0;log(s,'ACTIVATE',`${getCard(s,a.instanceId,ctx).name} activated.`,a.seat);
}
export function resolveLight(s:DuelState,link:ChainLink,ctx:EngineContext):boolean{
 if(resolveReasoning(s,link,ctx)||resolveMonarch(s,link,ctx)||resolveGoatControl(s,link,ctx))return true;
 const seat=link.controller,p=s.players[seat],target=link.targets[0];
 if(link.effectId==='VENUS'){if(canSummon(s,seat)&&empty(s,seat).length&&[...p.hand,...p.deck].some(id=>s.cards[id].cardId===SHINE_BALL))s.pendingLightChoice={kind:'VENUS',sourceId:link.instanceId,controller:seat};}
 else if(link.effectId==='ROTA'){if(p.deck.some(id=>getCard(s,id,ctx).race==='Warrior'&&Number(getCard(s,id,ctx).level)<=4))s.pendingLightChoice={kind:'ROTA',sourceId:link.instanceId,controller:seat};}
 else if(link.effectId==='CANNON'||link.effectId==='ARCHER'){s.players[other(seat)].lp=Math.max(0,s.players[other(seat)].lp-(link.effectId==='CANNON'?500:1200));settleLifePoints(s);}
 else if(link.effectId==='EXILED'||link.effectId==='ZABORG_DESTROY'){if(s.cards[target]?.location==='monster')toGraveyard(s,target);}
 else if(link.effectId==='PARSHATH_DRAW')draw(s,seat,1);
 else if(link.effectId==='WABOKU'){s.wabokuTurn??=[0,0];s.wabokuTurn[seat]=s.turn;}
 else if(link.effectId==='SOLAR'){const count=ownMonsters(s,seat).filter(id=>!s.cards[id].faceDown&&getCard(s,id,ctx).attribute==='LIGHT').length;s.players[other(seat)].lp=Math.max(0,s.players[other(seat)].lp-count*600);settleLifePoints(s);}
 else if(link.effectId==='TRUNADE'){const ids=[...s.players[0].zones.spell,...s.players[1].zones.spell].filter((id):id is string=>id!==null);for(const id of ids)if(id!==link.instanceId&&s.cards[id].location==='spell')returnToHand(s,id);}
 else if(link.effectId==='SWAP'){if(ownMonsters(s,seat).length&&ownMonsters(s,other(seat)).length)s.pendingLightChoice={kind:'SWAP_FIRST',sourceId:link.instanceId,controller:seat};}
 else if(link.effectId==='DUST'){if(s.cards[target]?.location==='spell'&&s.cards[target].controller!==seat){toGraveyard(s,target);s.pendingLightChoice={kind:'DUST_SET',sourceId:link.instanceId,controller:seat};}}
 else if(link.effectId==='LAST_WILL'){s.lastWills??=[];s.lastWills.push({sourceId:link.instanceId,controller:seat,turn:s.turn});}
 else if(link.effectId==='LAST_WILL_SUMMON'){if(canSummon(s,seat)&&p.deck.includes(target)&&canRecruit(s,target,ctx)&&Number(getCard(s,target,ctx).atk)<=1500&&link.monsterZone!==undefined&&p.zones.monster[link.monsterZone]===null){p.deck.splice(p.deck.indexOf(target),1);placeMonster(s,target,seat,link.monsterZone,link.declaredType==='faceUpDefense'?'faceUpDefense':'attack',['attack','faceUpDefense']);shuffleSearchedDeck(s,seat);}}
 else if(link.effectId==='SCAPEGOAT'){const zones=empty(s,seat);if(zones.length>=4){for(const zone of zones.slice(0,4)){s.tokenSerial=(s.tokenSerial??0)+1;const id=`sheep-${s.turn}-${seat}-${s.tokenSerial}`;s.cards[id]={instanceId:id,cardId:73915052,owner:seat,controller:seat,location:'monster',zone,position:'faceUpDefense',faceDown:false,token:true,summonedTurn:s.turn,lastPositionTurn:s.turn};p.zones.monster[zone]=id;}log(s,'SPECIAL_SUMMON','Scapegoat Special Summoned 4 Sheep Tokens in Defense Position.',seat);}}
 else return false;
 log(s,'RESOLVE',`${link.effectId.replaceAll('_',' ')} resolved.`,seat);return true;
}
