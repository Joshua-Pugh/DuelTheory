import {seededCoinTosses} from '../framework/random';
import {excavateUntil} from '../framework/excavation';
import {getCard,log,revealEffectCards,placeMonster,seededShuffle,toGraveyard,settleLifePoints,type DuelState,type EngineContext,type Seat,type LegalAction,type ChainLink} from './model';
import type {LightAction,LightChoice,LightEffect} from './lightDeckEffects';
export const REASONING=58577036,GATE=43040603,DIMENSION=23557835,CRANE=30914564,BLOWBACK=25551951,MARIONETTE=8034697,CEASEFIRE=36468556,REINCARNATION=74848038,VORTEX=69162969;
export const reasoningIds=new Set([87751584,REASONING,GATE,DIMENSION,CRANE,BLOWBACK,MARIONETTE,CEASEFIRE,REINCARNATION,VORTEX]);
const other=(seat:Seat):Seat=>seat===0?1:0;
const monsters=(s:DuelState)=>Object.values(s.cards).filter(c=>c.location==='monster');
const zones=(s:DuelState,seat:Seat)=>s.players[seat].zones.monster.flatMap((id,i)=>id===null?[i]:[]);
const canSummon=(s:DuelState,seat:Seat)=>s.summonLockedTurn?.[seat]!==s.turn;
export function canGateHit(s:DuelState,id:string,ctx:EngineContext){const c=getCard(s,id,ctx);return c.type.includes('Monster')&&!/Ritual|Fusion|Special Summon/.test(c.type)&&![9596126,72989439,77527210,91998119].includes(c.id);}
export function dimensionCandidates(s:DuelState,ctx:EngineContext,seat:Seat){return s.players[seat].banished.filter(id=>{const c=s.cards[id],card=getCard(s,id,ctx);return !c.token&&!c.faceDown&&card.type.includes('Monster')&&!card.type.includes('Spirit')&&(canGateHit(s,id,ctx)||c.properlySummoned);});}
export function reasoningActions(s:DuelState,ctx:EngineContext,seat:Seat,responses=false):LegalAction[]{
 const p=s.players[seat],result:LegalAction[]=[];
 const add=(instanceId:string,effectId:LightEffect,extra:Partial<Extract<LightAction,{type:'ACTIVATE_LIGHT_EFFECT'}>>={})=>result.push({type:'ACTIVATE_LIGHT_EFFECT',seat,instanceId,effectId,...extra,description:`${getCard(s,instanceId,ctx).name} · activate effect`});
 if(!responses)for(const c of monsters(s).filter(c=>c.controller===seat&&!c.faceDown)){
  if(c.cardId===87751584&&c.effectUsedTurn!==s.turn&&monsters(s).length)add(c.instanceId,'GATLING');
  if(c.cardId===BLOWBACK&&c.effectUsedTurn!==s.turn)for(const t of Object.values(s.cards).filter(t=>t.controller!==seat&&['monster','spell'].includes(t.location)))add(c.instanceId,'BLOWBACK',{targetId:t.instanceId});
  if(c.cardId===MARIONETTE&&(c.spellCounters??0)>=2)for(const t of monsters(s))add(c.instanceId,'MARIONETTE',{targetId:t.instanceId});
 }
 for(const id of [...p.hand,...p.zones.spell.filter((x):x is string=>!!x)]){
  const c=s.cards[id],hand=c.location==='hand';if(!hand&&!c.faceDown)continue;
  if(c.cardId===CEASEFIRE&&!hand&&c.setTurn!==s.turn&&monsters(s).some(m=>m.faceDown||getCard(s,m.instanceId,ctx).type.includes('Effect')))add(id,'CEASEFIRE',{zone:c.zone});
  if(responses)continue;
  for(const zone of hand?p.zones.spell.flatMap((x,i)=>x===null?[i]:[]):[c.zone!]){
   if(c.cardId===REASONING&&canSummon(s,seat)&&zones(s,seat).length&&p.deck.length)add(id,'REASONING',{zone});
   if(c.cardId===GATE&&canSummon(s,seat)&&p.deck.length)for(const m of monsters(s).filter(m=>m.controller===seat&&m.cannotTributeTurn!==s.turn))add(id,'MONSTER_GATE',{zone,materials:[m.instanceId]});
   if(c.cardId===DIMENSION&&p.lp>2000&&[seat,other(seat)].some(n=>canSummon(s,n)&&zones(s,n).length&&dimensionCandidates(s,ctx,n).length))add(id,'DIMENSION_FUSION',{zone});
   if(c.cardId===VORTEX&&monsters(s).some(m=>m.controller!==seat&&!m.faceDown))for(const cost of p.hand.filter(x=>x!==id))add(id,'VORTEX',{zone,materials:[cost]});
   if(c.cardId===REINCARNATION)for(const cost of p.hand.filter(x=>x!==id))for(const targetId of [...p.graveyard,...(getCard(s,cost,ctx).type.includes('Monster')?[cost]:[])].filter(x=>getCard(s,x,ctx).type.includes('Monster')))add(id,'REINCARNATION',{zone,materials:[cost],targetId});
  }
 }
 return result;
}
export const reasoningChoice=(kind:string)=>['GATLING_PICK','REASON_LEVEL','GATE_SUMMON','DIMENSION_PICK'].includes(kind);
export function reasoningChoices(s:DuelState,ctx:EngineContext,seat:Seat):LegalAction[]{
 const p=s.pendingLightChoice!;if(p.controller!==seat)return [];
 const base={type:'COMPLETE_LIGHT_CHOICE' as const,seat,sourceId:p.sourceId,description:'Resolve Reasoning Gate effect'};
 if(p.kind==='GATLING_PICK')return monsters(s).filter(c=>!p.chosenIds?.includes(c.instanceId)).map(c=>({...base,choiceId:c.instanceId,description:'Gatling Dragon · choose a monster to destroy'}));
 if(p.kind==='REASON_LEVEL')return Array.from({length:12},(_,i)=>({...base,declaredType:String(i+1),description:`Declare Level ${i+1}`}));
 if(p.kind==='GATE_SUMMON')return zones(s,seat).flatMap(monsterZone=>['attack','faceUpDefense'].map(declaredType=>({...base,monsterZone,declaredType})));
 if(p.kind==='DIMENSION_PICK'){
  const picked=p.picks??[],used=picked.filter(x=>x.seat===seat),required=Math.min(dimensionCandidates(s,ctx,seat).length,zones(s,seat).length);
  if(used.length>=required)return [{type:'FINISH_LIGHT_CHOICE',seat,sourceId:p.sourceId,description:'Continue simultaneous Special Summon'}];
  return dimensionCandidates(s,ctx,seat).filter(id=>!picked.some(x=>x.id===id)).flatMap(choiceId=>zones(s,seat).filter(z=>!used.some(x=>x.zone===z)).flatMap(monsterZone=>['attack','faceUpDefense'].map(declaredType=>({...base,choiceId,monsterZone,declaredType}))));
 }
 return [];
}
/** Resolve the picked cards before queuing any summon triggers, so DMOC can recover milled Spells. */
function excavate(s:DuelState,ctx:EngineContext,sourceId:string,seat:Seat,level?:number){
 const p=s.players[seat],{picked,hit}=excavateUntil(p.deck,id=>canGateHit(s,id,ctx));
 revealEffectCards(s,seat,picked,ctx,'Excavated cards');
 if(!hit){p.deck=seededShuffle(p.deck,s.seed+s.events.length*7919);s.pendingLightChoice=undefined;log(s,'RESOLVE','No Normal Summonable monster found; shuffled the excavated cards back into the Deck.',seat);return;}
 p.deck.splice(0,picked.length);
 const summon=Number(getCard(s,hit,ctx).level)!==level&&!getCard(s,hit,ctx).type.includes('Spirit')&&canSummon(s,seat)&&zones(s,seat).length>0;
 for(const id of picked)if(id!==hit||!summon)toGraveyard(s,id,'effect');
 if(summon){p.deck.unshift(hit);s.pendingLightChoice={kind:'GATE_SUMMON',sourceId,controller:seat,firstId:hit};}else s.pendingLightChoice=undefined;
}
function nextDimension(s:DuelState,ctx:EngineContext,p:LightChoice){
 const first=p.origin!,second=other(first),picked=p.picks??[];
 if(p.controller===first){s.pendingLightChoice={...p,controller:second};if(canSummon(s,second)&&dimensionCandidates(s,ctx,second).length&&zones(s,second).length)return;}
 for(const item of picked){const pool=s.players[item.seat].banished;pool.splice(pool.indexOf(item.id),1);placeMonster(s,item.id,item.seat,item.zone,item.position,['attack','faceUpDefense']);}
 s.pendingLightChoice=undefined;log(s,'SPECIAL_SUMMON',`Dimension Fusion Special Summoned ${picked.length} monster(s) simultaneously.`,first);
}
export function completeReasoning(s:DuelState,a:Extract<LightAction,{type:'COMPLETE_LIGHT_CHOICE'|'FINISH_LIGHT_CHOICE'}>,ctx:EngineContext){
 const p=s.pendingLightChoice!;
 if(p.kind==='GATLING_PICK'&&a.type==='COMPLETE_LIGHT_CHOICE'){(p.chosenIds??=[]).push(a.choiceId!);if(p.chosenIds.length>=Math.min(p.level!,monsters(s).length)){for(const id of p.chosenIds)if(s.cards[id].location==='monster')toGraveyard(s,id);s.pendingLightChoice=undefined;}}
 else if(p.kind==='REASON_LEVEL'){log(s,'DECLARE',`Reasoning: Player ${a.seat+1} declared Level ${'declaredType'in a?a.declaredType:''}.`,a.seat);excavate(s,ctx,p.sourceId,other(a.seat),Number('declaredType'in a?a.declaredType:0));}
 else if(p.kind==='GATE_SUMMON'&&a.type==='COMPLETE_LIGHT_CHOICE'){s.players[a.seat].deck.splice(s.players[a.seat].deck.indexOf(p.firstId!),1);placeMonster(s,p.firstId!,a.seat,a.monsterZone!,a.declaredType as 'attack'|'faceUpDefense',['attack','faceUpDefense']);s.pendingLightChoice=undefined;log(s,'SPECIAL_SUMMON','Excavated monster Special Summoned.',a.seat);}
 else if(p.kind==='DIMENSION_PICK'){
  if(a.type==='COMPLETE_LIGHT_CHOICE')(p.picks??=[]).push({id:a.choiceId!,seat:a.seat,zone:a.monsterZone!,position:a.declaredType as 'attack'|'faceUpDefense'});
  const required=canSummon(s,a.seat)?Math.min(zones(s,a.seat).length,dimensionCandidates(s,ctx,a.seat).length):0;
  if((p.picks??[]).filter(x=>x.seat===a.seat).length>=required)nextDimension(s,ctx,p);
 }
}
export function awardMarionetteCounters(s:DuelState,ids?:string[]){for(const id of ids??[]){const c=s.cards[id];if(c?.location==='monster'&&!c.faceDown&&c.cardId===MARIONETTE)c.spellCounters=(c.spellCounters??0)+1;}}
export function resolveReasoning(s:DuelState,l:ChainLink,ctx:EngineContext):boolean{
 const seat=l.controller,op=other(seat),p=s.players[seat],target=l.targets[0];
 switch(l.effectId){
 case 'REASONING':if(canSummon(s,seat)&&zones(s,seat).length)s.pendingLightChoice={kind:'REASON_LEVEL',sourceId:l.instanceId,controller:op};break;
 case 'MONSTER_GATE':if(canSummon(s,seat))excavate(s,ctx,l.instanceId,seat);break;
 case 'DIMENSION_FUSION':{const first=([s.current,other(s.current)] as Seat[]).find(n=>canSummon(s,n)&&zones(s,n).length&&dimensionCandidates(s,ctx,n).length);if(first!==undefined)s.pendingLightChoice={kind:'DIMENSION_PICK',sourceId:l.instanceId,controller:first,origin:first,picks:[]};break;}
 case 'SACRED_CRANE_DRAW':{const id=p.deck.shift();if(!id){s.winner=op;log(s,'DECK_OUT','Sacred Crane could not draw from an empty Deck.',seat);}else{p.hand.push(id);s.cards[id].location='hand';log(s,'DRAW','Sacred Crane drew 1 card.',seat);}break;}
 case 'VORTEX':for(const c of monsters(s).filter(c=>c.controller===op&&!c.faceDown))toGraveyard(s,c.instanceId);break;
 case 'REINCARNATION':if(p.graveyard.includes(target)){p.graveyard.splice(p.graveyard.indexOf(target),1);p.hand.push(target);s.cards[target].location='hand';log(s,'RECOVER','Monster Reincarnation recovered a monster.',seat);}break;
 case 'GATLING':case 'BLOWBACK':{const rolls=seededCoinTosses(3,s.seed+s.events.length*7919),heads=rolls.filter(Boolean).length;log(s,'COIN_RESULT',`${getCard(s,l.instanceId,ctx).name}: ${rolls.map(h=>h?'Heads':'Tails').join(', ')}.`,seat);if(l.effectId==='GATLING'&&heads>0&&monsters(s).length)s.pendingLightChoice={kind:'GATLING_PICK',sourceId:l.instanceId,controller:seat,level:heads,chosenIds:[]};else if(l.effectId==='BLOWBACK'&&heads>=2&&['monster','spell'].includes(s.cards[target]?.location))toGraveyard(s,target);break;}
 case 'MARIONETTE':if(s.cards[target]?.location==='monster')toGraveyard(s,target);break;
 case 'CEASEFIRE':{for(const c of monsters(s).filter(c=>c.faceDown)){c.faceDown=false;c.position='faceUpDefense';if([5047001,2134346].includes(c.cardId))c.spiritReturnTurn=s.turn;}const count=monsters(s).filter(c=>getCard(s,c.instanceId,ctx).type.includes('Effect')||getCard(s,c.instanceId,ctx).type.includes('Spirit')).length;s.players[op].lp=Math.max(0,s.players[op].lp-count*500);settleLifePoints(s);log(s,'LP_DAMAGE',`Ceasefire dealt ${count*500} damage. Flip effects do not activate.`,seat);break;}
 default:return false;
 }return true;
}
