import {draw,getCard,log,placeMonster,removeFromHand,toGraveyard,detachFaceDown,type DuelState,type EngineContext,type Seat,type LegalAction,type DuelAction,type ChainLink} from './model';
export const METAMORPHOSIS=46411259,TER=63519819,MIMIC=74713516;
/** Deliberately bounded prototype Fusion selection; other effects still require manual play. */
export const supportedFusions=new Set([87751584,TER,58528964,17881964,56907389,19066538,54752875]);
export const goatControlIds=new Set([METAMORPHOSIS,TER,MIMIC,...supportedFusions]);
const other=(seat:Seat):Seat=>seat===0?1:0;
const monsters=(s:DuelState)=>Object.values(s.cards).filter(c=>c.location==='monster');
export const restricts=(s:DuelState,id:string)=>monsters(s).some(c=>c.cardId===TER&&!c.faceDown&&c.instanceId!==id);
export const absorbedMonster=(s:DuelState,id:string)=>Object.values(s.cards).find(c=>c.location==='spell'&&c.absorbed&&c.linkedTarget===id);
export function restrictStat(s:DuelState,id:string,stat:'atk'|'def',ctx:EngineContext):number|undefined{
 if(s.cards[id]?.cardId!==TER||s.cards[id].faceDown)return;
 const equip=absorbedMonster(s,id);return equip&&!equip.faceDown?Math.max(0,Number(getCard(s,equip.instanceId,ctx)[stat])||0):0;
}
export function goatControlMain(s:DuelState,ctx:EngineContext,seat:Seat):LegalAction[]{
 const p=s.players[seat],actions:LegalAction[]=[];
 for(const id of p.zones.monster){const c=id?s.cards[id]:undefined;if(!id||!c||c.faceDown||c.cardId!==TER||c.effectUsedTurn===s.turn||absorbedMonster(s,id)||!p.zones.spell.includes(null))continue;
  for(const targetId of s.players[other(seat)].zones.monster)if(targetId)actions.push({type:'ACTIVATE_LIGHT_EFFECT',seat,instanceId:id,effectId:'TER_ABSORB',targetId,description:'Equip an opposing monster to Thousand-Eyes Restrict'});
 }
 if(s.summonLockedTurn?.[seat]===s.turn)return actions;
 for(const id of [...p.hand,...p.zones.spell.filter((x):x is string=>!!x&&!!s.cards[x].faceDown)]){
  if(s.cards[id].cardId!==METAMORPHOSIS)continue;
  const zones=s.cards[id].location==='spell'?[s.cards[id].zone!]:p.zones.spell.flatMap((x,i)=>x===null?[i]:[]);
  for(const material of p.zones.monster){if(!material)continue;const level=Number(getCard(s,material,ctx).level);
   if(!(p.extra||[]).some(x=>supportedFusions.has(s.cards[x].cardId)&&Number(getCard(s,x,ctx).level)===level))continue;
   for(const zone of zones)actions.push({type:'ACTIVATE_LIGHT_EFFECT',seat,instanceId:id,effectId:'METAMORPHOSIS',materials:[material],zone,description:'Tribute 1 monster for Metamorphosis'});
  }
 }
 return actions;
}
export function dispatchGoatControl(s:DuelState,a:Extract<DuelAction,{type:'ACTIVATE_LIGHT_EFFECT'}>,ctx:EngineContext){
 const p=s.players[a.seat],c=s.cards[a.instanceId];let level:number|undefined;
 if(a.effectId==='METAMORPHOSIS'){const before=s.pendingTriggers?.length||0;const material=a.materials![0];level=Number(getCard(s,material,ctx).level);toGraveyard(s,material,'cost');const waiting=s.pendingTriggers?.splice(before)||[];if(waiting.length)(s.deferredTriggers??=[]).push(...waiting);if(c.location==='hand')removeFromHand(p,a.instanceId);p.zones.spell[a.zone!]=a.instanceId;Object.assign(c,{location:'spell',zone:a.zone,faceDown:false});}
 else c.effectUsedTurn=s.turn;
 s.chain.push({instanceId:a.instanceId,controller:a.seat,effectId:a.effectId,targets:a.targetId?[a.targetId]:[],spellSpeed:1,value:level});s.priority=other(a.seat);s.consecutivePasses=0;
 log(s,'ACTIVATE',`${getCard(s,a.instanceId,ctx).name} activated${level?`; Level ${level} monster Tributed as cost`:''}.`,a.seat);
}
export function metamorphosisChoices(s:DuelState,ctx:EngineContext,seat:Seat):LegalAction[]{
 const pending=s.pendingLightChoice;if(pending?.kind!=='METAMORPHOSIS'||pending.controller!==seat)return [];
 const p=s.players[seat],options:LegalAction[]=[];
 if(s.summonLockedTurn?.[seat]!==s.turn)for(const choiceId of p.extra||[]){if(!supportedFusions.has(s.cards[choiceId].cardId)||getCard(s,choiceId,ctx).level!==pending.level)continue;
  for(let monsterZone=0;monsterZone<5;monsterZone++)if(p.zones.monster[monsterZone]===null)for(const declaredType of ['attack','faceUpDefense'] as const)options.push({type:'COMPLETE_LIGHT_CHOICE',seat,sourceId:pending.sourceId,choiceId,monsterZone,declaredType,description:'Metamorphosis · Special Summon a matching Fusion Monster'});
 }
 return options.length?options:[{type:'FINISH_LIGHT_CHOICE',seat,sourceId:pending.sourceId,description:'No legal Fusion Summon remains · finish effect'}];
}
export function completeMetamorphosis(s:DuelState,a:Extract<DuelAction,{type:'COMPLETE_LIGHT_CHOICE'}>){
 const p=s.players[a.seat],id=a.choiceId!;p.extra=p.extra?.filter(x=>x!==id);placeMonster(s,id,a.seat,a.monsterZone!,a.declaredType as 'attack'|'faceUpDefense',['attack','faceUpDefense']);s.cards[id].properlySummoned=false;s.pendingLightChoice=undefined;log(s,'SPECIAL_SUMMON','Metamorphosis Special Summoned a Fusion Monster (not a proper Fusion Summon).',a.seat);
}
export function resolveGoatControl(s:DuelState,link:ChainLink,ctx:EngineContext):boolean{
 const seat=link.controller,p=s.players[seat],source=s.cards[link.instanceId];
 if(link.effectId==='METAMORPHOSIS')s.pendingLightChoice={kind:'METAMORPHOSIS',sourceId:link.instanceId,controller:seat,level:link.value};
 else if(link.effectId==='MIMIC_DRAW')draw(s,seat,1);
 else if(link.effectId==='TER_ABSORB'){
  const target=s.cards[link.targets[0]],zone=p.zones.spell.indexOf(null);
  if(source?.location==='monster'&&!source.faceDown&&source.cardId===TER&&!absorbedMonster(s,source.instanceId)&&target?.location==='monster'&&target.controller!==seat&&zone>=0){
   detachFaceDown(s,target.instanceId);s.players[target.controller].zones.monster[target.zone!]=null;
   const hidden=!!target.faceDown;Object.assign(target,{location:'spell',controller:seat,zone,position:undefined,absorbed:true,equippedHidden:hidden,linkedTarget:source.instanceId});p.zones.spell[zone]=target.instanceId;
  }
 }else return false;
 log(s,'RESOLVE',`${getCard(s,link.instanceId,ctx).name} effect resolved.`,seat);return true;
}
/** TER replaces only battle destruction, never effect destruction. Damage is unchanged. */
export function replaceRestrictBattleDestruction(s:DuelState,id:string){const c=s.cards[id],equip=absorbedMonster(s,id);if(c?.cardId!==TER||c.faceDown||!equip)return false;toGraveyard(s,equip.instanceId,'effect');log(s,'BATTLE_REPLACEMENT','Thousand-Eyes Restrict destroyed its equipped monster instead.',c.controller);return true;}
