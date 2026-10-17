import {executeProgram,candidates,matchingTriggers,type EffectEvent,type EffectAdapter,type EffectProgram,type EffectContext,type Entity,type Selection} from '../../framework';
import {ashenCardMap} from '../../ashenDecks';
import {cardPresentation,type Resource} from '../../ashenPresentation';
import {emptyAshenRules,type Battlefield} from '../../ashenBattlefieldState';
import {tabletopDispatch} from '../../services/CreatorTabletop';
import {bruteEffects} from './bruteEffects';

const player=(id:string):0|1=>{if(id!=='0'&&id!=='1')throw Error('Unknown Ashen player.');return Number(id) as 0|1;};
export const ashenData=(state:Battlefield,id:string)=>state.table.cards[id]?.presentation||ashenCardMap.get(state.table.cards[id]?.cardId);
export function ashenStats(state:Battlefield,id:string){const data=ashenData(state,id);const mods=state.rules?.modifiers.filter(m=>m.id===id)||[];return {attack:(data?.attack||0)+mods.reduce((n,m)=>n+(m.stats.attack||0),0),defense:(data?.defense||0)+mods.reduce((n,m)=>n+(m.stats.defense||0),0),damage:state.rules?.damage[id]||0,keywords:[...(bruteEffects[state.table.cards[id]?.cardId]?.keywords||[]),...mods.flatMap(m=>m.keywords)]};}
const move=(state:Battlefield,id:string,zone:string)=>{
 const c=state.table.cards[id];if(!c)throw Error('Unknown card.');
 state.table=tabletopDispatch(state.table,{type:'MOVE',instanceId:id,seat:zone==='graveyard'?c.owner:c.controller,zone});
 if(state.rules){delete state.rules.damage[id];state.rules.modifiers=state.rules.modifiers.filter(m=>m.id!==id);}
};
export const ashenAdapter:EffectAdapter<Battlefield>={
 entities:s=>Object.values(s.table.cards).map(c=>({id:c.instanceId,controller:String(c.controller),zone:c.zone,type:c.type,tags:[ashenData(s,c.instanceId)?.faction||'',...(c.presentation?['Token']:[])],exhausted:c.rotated||c.faceDown})),
 resources:(s,p)=>({...s.basins[player(p)]}),
 adjustResource:(s,p,r,delta)=>{if(!['untuned','fury','oath','ash','veil'].includes(r))throw Error('Unknown essence.');const pool=s.basins[player(p)];const n=pool[r as Resource]+delta;if(n<0||n>999)throw Error('Invalid essence balance.');pool[r as Resource]=n;},
 exhaust:(s,id)=>{s.table.cards[id].rotated=true;},move,
 counter:(s,id,name,delta)=>{s.rules??=emptyAshenRules();s.rules.counters??={};s.rules.counters[id]??={};const next=(s.rules.counters[id][name]||0)+delta;if(next<0||next>999)throw Error('Invalid counter balance.');s.rules.counters[id][name]=next;},
 draw:(s,p,count)=>{if(s.table.piles[`${p}:deck`].length<count)throw Error('Not enough cards in deck to resolve this effect.');for(let n=0;n<count;n++)s.table=tabletopDispatch(s.table,{type:'DRAW',seat:player(p)});},
 destroy:(s,id)=>{const c=s.table.cards[id];if(!c||!['unit','support','ley'].includes(c.zone))return false;
  if(c.presentation){s.table.piles[`${c.controller}:${c.zone}`]=s.table.piles[`${c.controller}:${c.zone}`].filter(i=>i!==id);delete s.table.cards[id];}
  else move(s,id,'graveyard');
  return true;
 },
 damage:(s,id,amount)=>{const c=s.table.cards[id];if(!c)return false;if(c.zone==='command'){s.table.health[c.controller]-=amount;return false;}if(c.zone!=='unit')throw Error('Damage requires a Unit or Command Station.');s.rules??=emptyAshenRules();s.rules.damage[id]=(s.rules.damage[id]||0)+amount;if(s.rules.damage[id]>=ashenStats(s,id).defense)return ashenAdapter.destroy(s,id);return false;},
 modify:(s,id,stats,keywords,duration)=>{s.rules??=emptyAshenRules();s.rules.modifiers.push({id,stats:{...stats},keywords:[...keywords],duration});},
 token:(s,p,definition)=>{s.rules??=emptyAshenRules();let id:string;do{id=`ashen-token-${++s.rules.serial}`;}while(s.table.cards[id]);const seat=player(p);s.table.cards[id]={instanceId:id,cardId:'token',name:definition.name,type:definition.type,owner:seat,controller:seat,zone:definition.zone,faceDown:false,rotated:true,counters:0,presentation:{name:definition.name,type:definition.type,subtype:'Unit — Brute Token',faction:'Brute',attack:definition.stats.attack,defense:definition.stats.defense,effectText:'Frenzied Brute token. Deployment Fatigue.'}};s.table.piles[`${p}:${definition.zone}`].push(id);return id;},
};
export function playProgram(state:Battlefield,id:string):EffectProgram{
 const card=state.table.cards[id],definition=bruteEffects[card?.cardId];
 if(!card||!definition||card.zone!=='hand')throw Error('This card is not in the assisted effect batch.');
 if(card.controller!==state.table.active)throw Error('Only the active player can deploy cards.');
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
 const original=state.table.cards[context.source];if(!original||original.controller!==Number(context.player))throw Error('You do not control the source.');
 if(original.controller!==state.table.active)throw Error('Assisted effects currently resolve during the active player’s sandbox turn.');
 const rule=bruteEffects[original.cardId];if(!rule)throw Error('This effect is not implemented.');
 if(deploy)program=playProgram(state,context.source);
 else {const canonical=rule.activated?.find(p=>p.id===program.id);if(!canonical||!['unit','support'].includes(original.zone))throw Error('Ability unavailable here.');program=canonical;}
 if(!deploy){const result=executeProgram(state,ashenAdapter,program,context);return logResolution(drainTriggers(result.state,result.events),program);}
 // Validate/pay on the original board, then deploy before resolving entry effects.
 const checked=executeProgram(state,ashenAdapter,{...program,steps:[]},context);
 let staged=checked.state;staged.rules??=emptyAshenRules();
 if(deploy){const zone=original.type==='Unit'?'unit':original.type==='Ley Font'?'ley':['Rune','Relic'].includes(original.type)?'support':'graveyard';move(staged,original.instanceId,zone);
  if(original.type==='Ley Font'){staged.rules.fontPlayed[original.controller]=true;staged.table.cards[original.instanceId].faceDown=!!rule.entersSpent;}
  if(original.type==='Unit')staged.table.cards[original.instanceId].rotated=!rule.keywords?.includes('Charge');
 }
 // Costs are removed from the resolution pass; its targets are revalidated.
 const resolution=executeProgram(staged,ashenAdapter,{...program,cost:undefined}, {...context,costCards:[]});
 const entered=ashenAdapter.entities(staged).find(e=>e.id===original.instanceId);
 const events=[...checked.events.flatMap(e=>e.kind==='cost-card'&&e.entity?.zone==='unit'?[{...e,kind:'destroyed'}]:[]),...(entered&&['unit','support','ley'].includes(entered.zone)?[{kind:'entered',source:context.source,player:context.player,entity:entered}]:[]),...resolution.events];
 return logResolution(drainTriggers(resolution.state,events),program);
}
function logResolution(state:Battlefield,program:EffectProgram){state.table.events.push(`Assisted sandbox: ${program.label}. Clash/combat and unimplemented observer effects remain manual.`);return state;}
export function resolveBurnEffect(state:Battlefield,id:string){const program=bruteEffects[state.table.cards[id]?.cardId]?.onBurn;if(!program)return state;const result=executeProgram(state,ashenAdapter,program,{player:String(state.table.cards[id].controller),source:id});return logResolution(drainTriggers(result.state,result.events),program);}
function drainTriggers(initial:Battlefield,events:EffectEvent[]):Battlefield{
 let state=initial;const queue=[...events];let budget=128;
 while(queue.length){if(--budget<0)throw Error('Trigger loop limit reached; action cancelled.');const event=queue.shift()!;
  const subscriptions=Object.values(state.table.cards).flatMap(c=>(bruteEffects[c.cardId]?.triggers||[]).map(trigger=>({source:c.instanceId,trigger})));
  for(const entry of matchingTriggers(state,ashenAdapter,event,subscriptions)){
   state.rules??=emptyAshenRules();state.rules.triggerUses??={};
   const key=`${state.rules.turn}:${entry.context.source}:${entry.triggerId}`;
   if(entry.limit&&(state.rules.triggerUses[key]||0)>=entry.limit)continue;
   state.rules.triggerUses[key]=(state.rules.triggerUses[key]||0)+1;
   const resolved=executeProgram(state,ashenAdapter,entry.program,entry.context);state=resolved.state;queue.push(...resolved.events);
   state.table.events.push(`Triggered: ${entry.program.label}.`);
  }
 }
 return state;
}
