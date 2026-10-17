import {openPriority,continueProgram,seededShuffle,executeProgram,candidates,matchingTriggers,type EffectResult,type EffectEvent,type EffectAdapter,type EffectProgram,type EffectContext,type Entity,type Selection} from '../../framework';
import {ashenCardMap} from '../../ashenDecks';
import {cardPresentation,type Resource} from '../../ashenPresentation';
import {emptyAshenRules,type Battlefield,type AshenWork} from '../../ashenBattlefieldState';
import {tabletopDispatch} from '../../services/CreatorTabletop';
import {bruteEffects,FLAMEBELCHER_ABILITY} from './bruteEffects';

const player=(id:string):0|1=>{if(id!=='0'&&id!=='1')throw Error('Unknown Ashen player.');return Number(id) as 0|1;};
export const ashenData=(state:Battlefield,id:string)=>state.table.cards[id]?.presentation||ashenCardMap.get(state.table.cards[id]?.cardId);
export function ashenStats(state:Battlefield,id:string){
 const c=state.table.cards[id],data=ashenData(state,id),mods=state.rules?.modifiers.filter(m=>m.id===id)||[];
 const keywords=[...(bruteEffects[c?.cardId]?.keywords||[]),...mods.flatMap(m=>m.keywords)];
 for(const [rig,target] of Object.entries(state.rules?.attachments||{}))if(target===id&&state.table.cards[rig]?.zone==='support'&&state.table.cards[rig].cardId==='ashen-brute-flamebelcher-rig'&&c?.zone==='unit')keywords.push('Ranged');
 let bonus=c?.counters||0;
 if(c?.zone==='unit'&&data?.faction==='Brute')for(const aura of Object.values(state.table.cards)){
  if(aura.controller!==c.controller||aura.faceDown)continue;
  if(aura.zone==='unit'&&aura.instanceId!==id&&aura.cardId==='ashen-brute-warband-overseer'){bonus++;keywords.push('Charge');}
  if(aura.zone==='support'&&aura.cardId==='ashen-brute-banner-of-the-broken-fist')keywords.push('Charge');
  if(aura.zone==='support'&&aura.cardId==='ashen-brute-warband-of-bloodfire')bonus+=Object.values(state.table.cards).filter(b=>b.zone==='unit'&&ashenData(state,b.instanceId)?.faction==='Brute').length;
 }
 return {attack:(data?.attack||0)+bonus+mods.reduce((n,m)=>n+(m.stats.attack||0),0),defense:(data?.defense||0)+bonus+mods.reduce((n,m)=>n+(m.stats.defense||0),0),damage:state.rules?.damage[id]||0,keywords:[...new Set(keywords)]};
}
export const moveAshenCard=(state:Battlefield,id:string,zone:string)=>{
 const c=state.table.cards[id];if(!c)throw Error('Unknown card.');
 if(c.presentation&&['graveyard','banished'].includes(zone)){state.table.piles[`${c.controller}:${c.zone}`]=state.table.piles[`${c.controller}:${c.zone}`].filter(i=>i!==id);delete state.table.cards[id];}else state.table=tabletopDispatch(state.table,{type:'MOVE',instanceId:id,seat:zone==='graveyard'?c.owner:c.controller,zone});
 if(state.rules){for(const [rig,target] of Object.entries(state.rules.attachments||{}))if(rig===id||target===id)delete state.rules.attachments![rig];delete state.rules.damage[id];if(state.rules.counters)delete state.rules.counters[id];state.rules.modifiers=state.rules.modifiers.filter(m=>m.id!==id);}
};
export const ashenAdapter:EffectAdapter<Battlefield>={
 attach:(s,source,target)=>{const rig=s.table.cards[source],unit=s.table.cards[target];if(rig?.zone!=='support'||unit?.zone!=='unit'||unit.controller!==rig.controller)throw Error('Outfit requires a friendly Unit on the frontline.');s.rules??=emptyAshenRules();s.rules.attachments??={};s.rules.attachments[source]=target;},
 stats:(s,id)=>{const stats=ashenStats(s,id);return {attack:stats.attack,defense:stats.defense};},
 random:s=>{s.rules??=emptyAshenRules();s.rules.shuffleSeed=(Math.imul(s.rules.shuffleSeed??0x9e3779b9,1664525)+1013904223)>>>0;return s.rules.shuffleSeed/4294967296;},
 shuffle:(s,p,zone)=>{s.rules??=emptyAshenRules();const seed=s.rules.shuffleSeed??0x9e3779b9;s.table.piles[`${p}:${zone}`]=seededShuffle(s.table.piles[`${p}:${zone}`],seed);s.rules.shuffleSeed=(Math.imul(seed,1664525)+1013904223)>>>0;},
 counters:(s,id)=>s.rules?.counters?.[id]||{},
 entities:s=>Object.values(s.table.cards).map(c=>({id:c.instanceId,controller:String(c.controller),zone:c.zone,type:c.type,tags:[ashenData(s,c.instanceId)?.faction||'',...(c.presentation?['Token']:[]),...(s.rules?.duel?.combat?.attackers.includes(c.instanceId)?['Attacking']:[])],exhausted:c.rotated||c.faceDown,stats:{attack:ashenStats(s,c.instanceId).attack,defense:ashenStats(s,c.instanceId).defense}})),
 resources:(s,p)=>({...s.basins[player(p)]}),
 adjustResource:(s,p,r,delta)=>{if(!['untuned','fury','oath','ash','veil'].includes(r))throw Error('Unknown essence.');const pool=s.basins[player(p)];const n=pool[r as Resource]+delta;if(n<0||n>999)throw Error('Invalid essence balance.');pool[r as Resource]=n;},
 exhaust:(s,id)=>{s.table.cards[id].rotated=true;},move:moveAshenCard,
 counter:(s,id,name,delta)=>{s.rules??=emptyAshenRules();s.rules.counters??={};s.rules.counters[id]??={};const next=(s.rules.counters[id][name]||0)+delta;if(next<0||next>999)throw Error('Invalid counter balance.');s.rules.counters[id][name]=next;},
 draw:(s,p,count)=>{const available=Math.min(count,s.table.piles[`${p}:deck`].length);for(let n=0;n<available;n++)s.table=tabletopDispatch(s.table,{type:'DRAW',seat:player(p)});},
 destroy:(s,id)=>{const c=s.table.cards[id];if(!c||!['unit','support','ley'].includes(c.zone))return false;
  moveAshenCard(s,id,'graveyard');
  return true;
 },
 heal:(s,id,amount)=>{const c=s.table.cards[id];if(c?.zone==='command')s.table.health[c.controller]+=amount;else if(c?.zone==='unit'&&s.rules)s.rules.damage[id]=Math.max(0,(s.rules.damage[id]||0)-amount);},
 damage:(s,id,amount)=>{const c=s.table.cards[id];if(!c)return false;if(c.zone==='command'){s.table.health[c.controller]-=amount;return false;}if(c.zone!=='unit')throw Error('Damage requires a Unit or Command Station.');s.rules??=emptyAshenRules();s.rules.damage[id]=(s.rules.damage[id]||0)+amount;if(s.rules.damage[id]>=ashenStats(s,id).defense)return ashenAdapter.destroy(s,id);return false;},
 modify:(s,id,stats,keywords,duration)=>{if(!s.table.cards[id]||['graveyard','banished','deck','hand'].includes(s.table.cards[id].zone))return;s.rules??=emptyAshenRules();s.rules.modifiers.push({id,stats:{...stats},keywords:[...keywords],duration});},
 token:(s,p,definition)=>{s.rules??=emptyAshenRules();let id:string;do{id=`ashen-token-${++s.rules.serial}`;}while(s.table.cards[id]);const seat=player(p);s.table.cards[id]={instanceId:id,cardId:'token',name:definition.name,type:definition.type,owner:seat,controller:seat,zone:definition.zone,faceDown:false,rotated:!definition.keywords?.includes('Charge'),counters:0,presentation:{name:definition.name,type:definition.type,subtype:'Unit — Brute Token',faction:'Brute',attack:definition.stats.attack,defense:definition.stats.defense,effectText:definition.keywords?.join(', ')||'Deployment Fatigue.'}};s.table.piles[`${p}:${definition.zone}`].push(id);if(definition.keywords?.length)s.rules.modifiers.push({id,stats:{},keywords:[...definition.keywords],duration:'permanent'});if(ashenStats(s,id).keywords.includes('Charge'))s.table.cards[id].rotated=false;if(definition.tags.includes('Attacking')&&s.rules.duel?.combat){s.rules.duel.combat.attackers.push(id);s.table.cards[id].rotated=true;}return id;},
};
export function availableAshenAbilities(state:Battlefield,id:string):EffectProgram[]{const c=state.table.cards[id];if(!c)return [];const abilities=[...(bruteEffects[c.cardId]?.activated||[])];if(c.zone==='unit'&&Object.entries(state.rules?.attachments||{}).some(([rig,target])=>target===id&&state.table.cards[rig]?.zone==='support'&&state.table.cards[rig].cardId==='ashen-brute-flamebelcher-rig'))abilities.push(FLAMEBELCHER_ABILITY);return abilities;}
export function playProgram(state:Battlefield,id:string):EffectProgram{
 const card=state.table.cards[id],definition=bruteEffects[card?.cardId];
 if(!card||!definition||card.zone!=='hand')throw Error('This card is not in the assisted effect batch.');
 if(card.controller!==state.table.active&&!(state.rules?.duel&&card.type==='Tactic'))throw Error('Only the active player can deploy cards.');
 if(card.type==='Ley Font'&&state.rules?.fontPlayed[card.controller])throw Error('You have already played a Ley Font this turn.');
 const cost=cardPresentation(ashenData(state,id)!).resourceCost;
 if(!cost&&card.type!=='Ley Font')throw Error('Printed cost is not verified for this card; use manual play.');
 const printed=cost||{};
 const {untuned=0,...colored}=printed;
 const base=definition.onPlay||{version:1 as const,id:'deploy',label:`Deploy ${card.name}`,steps:[]};
 return {...base,cost:{...base.cost,resources:colored,generic:untuned}};
}
export function effectChoices(state:Battlefield,program:EffectProgram,context:EffectContext):{kind:'costCards'|'targets';selection:Selection;entities:Entity[]}[]{
 return ([['costCards',program.cost?.cards],['targets',program.targets]] as const).flatMap(([kind,selection])=>selection?[{kind,selection,entities:candidates(state,ashenAdapter,selection,context)}]:[]);
}
export function resolveAshenEffect(state:Battlefield,program:EffectProgram,context:EffectContext,deploy=false):Battlefield{
 if(state.rules?.pending)throw Error('Finish the pending effect first.');
 const original=state.table.cards[context.source];if(!original||original.controller!==Number(context.player))throw Error('You do not control the source.');
 if(original.controller!==state.table.active)throw Error('Assisted effects currently resolve during the active player’s sandbox turn.');
 const rule=bruteEffects[original.cardId]||{coverage:'partial' as const};if(!bruteEffects[original.cardId]&&!availableAshenAbilities(state,original.instanceId).length)throw Error('This effect is not implemented.');
 if(deploy)program=playProgram(state,context.source);
 else {const canonical=availableAshenAbilities(state,original.instanceId).find(p=>p.id===program.id);if(!canonical||!['unit','support'].includes(original.zone))throw Error('Ability unavailable here.');program=canonical;}
 if(!deploy){const result=executeProgram(state,ashenAdapter,program,context);return completeOrPause(result,program.label);}
 // Validate/pay on the original board, then deploy before resolving entry effects.
 const checked=executeProgram(state,ashenAdapter,{...program,steps:[]},context);
 let staged=checked.state;staged.rules??=emptyAshenRules();
 if(deploy){const zone=original.type==='Unit'?'unit':original.type==='Ley Font'?'ley':['Rune','Relic'].includes(original.type)?'support':'graveyard';moveAshenCard(staged,original.instanceId,zone);
  if(original.type==='Ley Font'){staged.rules.fontPlayed[original.controller]=true;staged.table.cards[original.instanceId].faceDown=!!rule.entersSpent;}
  if(original.type==='Unit')staged.table.cards[original.instanceId].rotated=!ashenStats(staged,original.instanceId).keywords.includes('Charge');
 }
 // Costs are removed from the resolution pass; its targets are revalidated.
 const resolution=executeProgram(staged,ashenAdapter,{...program,cost:undefined}, {...context,costCards:[]});
 const entered=ashenAdapter.entities(staged).find(e=>e.id===original.instanceId);
 const events=[...checked.events.flatMap(e=>(e.kind==='cost-card'||e.kind==='sacrificed')&&e.entity?.zone==='unit'?[{...e,kind:'destroyed'}]:[]),...(entered&&['unit','support','ley'].includes(entered.zone)?[{kind:'entered',source:context.source,player:context.player,entity:entered}]:[]),...resolution.events];
 resolution.events=events;if(resolution.pending)resolution.pending.events=events;return completeOrPause(resolution,program.label);
}
export function pendingAshenChoices(state:Battlefield){
 const flow=state.rules?.pending?.flow,step=flow?.steps[0];
 if(!flow||(step?.op!=='choose'&&step?.op!=='select'))return null;
 const entities=candidates(state,ashenAdapter,step.selection,flow.context);entities.sort((a,b)=>{const pile=state.table.piles[`${a.controller}:${a.zone}`];return a.zone===b.zone&&a.controller===b.controller?pile.indexOf(a.id)-pile.indexOf(b.id):0;});
 return {selection:step.selection,entities,context:flow.context};
}
export function resumeAshenEffect(state:Battlefield,ids:string[]):Battlefield{
 const pending=state.rules?.pending;if(!pending)throw Error('No effect choice is pending.');
 const staged=structuredClone(state);delete staged.rules!.pending;
 return completeOrPause(continueProgram(staged,ashenAdapter,pending.flow,ids),pending.label,pending.work);
}
export function completeOrPause(result:EffectResult<Battlefield>,label:string,work?:AshenWork):Battlefield{
 if(result.pending){result.state.rules??=emptyAshenRules();result.state.rules.pending={flow:result.pending,label,work};result.state.table.events.push(`Choose cards to continue: ${label}.`);return result.state;}
 let state=drainTriggers(result.state,result.events,work);
 for(const event of result.events)if(event.kind==='revealed'&&event.entity)state.table.events.push(`Revealed: ${state.table.cards[event.entity.id]?.name||event.entity.type}.`);
 state.table.events.push(state.rules?.duel?`Resolved: ${label}.`:`Assisted sandbox: ${label}. Clash/combat remain manual.`);return state;
}
function logResolution(state:Battlefield,program:EffectProgram){state.table.events.push(`Assisted sandbox: ${program.label}. Clash/combat and unimplemented observer effects remain manual.`);return state;}
export function resolveBurnEffect(state:Battlefield,id:string){const program=bruteEffects[state.table.cards[id]?.cardId]?.onBurn;if(!program)return state;const result=executeProgram(state,ashenAdapter,program,{player:String(state.table.cards[id].controller),source:id});return logResolution(drainTriggers(result.state,result.events),program);}
function sacrificeEvents(events:EffectEvent[]){return events.flatMap(e=>(e.kind==='cost-card'||e.kind==='sacrificed')&&e.entity?.zone==='unit'?[e,{...e,kind:'destroyed'}]:[e]);}
export function stateBasedDeaths(state:Battlefield):EffectEvent[]{
 const events:EffectEvent[]=[];let budget=128;
 while(budget--){
  const observers=ashenAdapter.entities(state),lethal=observers.filter(e=>e.zone==='unit'&&(ashenStats(state,e.id).defense<=0||ashenStats(state,e.id).damage>=ashenStats(state,e.id).defense));
  if(!lethal.length)return events;
  for(const entity of lethal)if(ashenAdapter.destroy(state,entity.id))events.push({kind:'destroyed',source:entity.id,player:entity.controller,entity,observers});
 }
 throw Error('State-based destruction limit reached.');
}
export function drainTriggers(initial:Battlefield,events:EffectEvent[],previous?:AshenWork):Battlefield{
 let state=initial;const work:AshenWork=previous?structuredClone(previous):{events:[],triggers:[],budget:256};
 work.events.push(...sacrificeEvents(events),...stateBasedDeaths(state));
 while(work.events.length||work.triggers.length){
  if(--work.budget<0)throw Error('Trigger loop limit reached.');
  if(!work.triggers.length){const event=work.events.shift()!;if((event.kind==='cost-card'||event.kind==='sacrificed')&&event.entity?.zone==='unit'&&event.entity.tags.includes('Brute')&&state.rules?.duel)state.rules.duel.sacrificed[Number(event.entity.controller) as 0|1]++;
   const subscriptions=Object.values(state.table.cards).flatMap(c=>(bruteEffects[c.cardId]?.triggers||[]).map(trigger=>({source:c.instanceId,trigger})));
   for(const entry of matchingTriggers(state,ashenAdapter,event,subscriptions)){
    state.rules??=emptyAshenRules();state.rules.triggerUses??={};const key=`${state.rules.turn}:${entry.context.source}:${entry.triggerId}`;
    if(entry.limit&&(state.rules.triggerUses[key]||0)>=entry.limit)continue;
    state.rules.triggerUses[key]=(state.rules.triggerUses[key]||0)+1;work.triggers.push(entry);
   }
   continue;
  }
  const entry=work.triggers.shift()!;
  if(state.rules?.duel){state.rules.duel.stack.push({...entry,kind:'trigger'});state.rules.duel.priority=openPriority(['0','1'],entry.context.player);continue;}
  const resolved=executeProgram(state,ashenAdapter,entry.program,entry.context);state=resolved.state;
  if(resolved.pending){state.rules??=emptyAshenRules();state.rules.pending={flow:resolved.pending,label:entry.program.label,work};return state;}
  work.events.push(...sacrificeEvents(resolved.events),...stateBasedDeaths(state));state.table.events.push(`Triggered: ${entry.program.label}.`);
 }
 return state;
}
