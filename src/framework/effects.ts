/** Portable effects kernel. No game names, card catalogs, UI or player-count assumptions. */
import {validateEffectProgram} from './schema';
export type Entity={id:string;controller:string;zone:string;type:string;tags:string[];exhausted:boolean};
export type Selector={zones?:string[];types?:string[];tags?:string[];excludeTags?:string[];controller?:'self'|'other'|'any';excludeSource?:boolean};
export type Selection={filter:Selector;count:number;label:string};
export type Targets='source'|'targets'|Selector;
export type Amount=number|{count:Selector}|{result:'destroyed'};
export type TokenDefinition={name:string;type:string;tags:string[];stats:Record<string,number>;zone:string;keywords?:string[]};
export type EffectStep=
 |{op:'draw';count:Amount}
 |{op:'resource';resource:string;amount:Amount}
 |{op:'damage';targets:Targets;amount:Amount}
 |{op:'destroy';targets:Targets}
 |{op:'move';targets:Targets;zone:string}
 |{op:'counter';targets:Targets;counter:string;amount:number}
 |{op:'modify';targets:Targets;stats:Record<string,number>;keywords?:string[];duration:'turn'|'permanent'}
 |{op:'token';token:TokenDefinition;count:Amount}
 |{op:'if';condition:{kind:'destroyed';filter?:Selector}|{kind:'costCard';filter:Selector};then:EffectStep[]};
export type EffectProgram={version:1;id:string;label:string;targets?:Selection;cost?:{resources?:Record<string,number>;generic?:number;exhaust?:boolean;cards?:Selection;cardDestination?:string};steps:EffectStep[]};
export type EffectContext={player:string;source:string;targets?:string[];costCards?:string[]};
export type EffectEvent={kind:string;source:string;player:string;entity?:Entity;amount?:number;resource?:string};
export type EffectAdapter<S>={
 entities:(state:S)=>Entity[];
 resources:(state:S,player:string)=>Record<string,number>;
 adjustResource:(state:S,player:string,resource:string,delta:number)=>void;
 exhaust:(state:S,id:string)=>void;
 move:(state:S,id:string,destination:string)=>void;
 counter:(state:S,id:string,name:string,delta:number)=>void;
 draw:(state:S,player:string,count:number)=>void;
 destroy:(state:S,id:string)=>boolean;
 damage:(state:S,id:string,amount:number)=>boolean;
 modify:(state:S,id:string,stats:Record<string,number>,keywords:string[],duration:'turn'|'permanent')=>void;
 token:(state:S,player:string,definition:TokenDefinition)=>string;
};
export class EffectError extends Error{constructor(message:string){super(message);this.name='EffectError';}}
export function matches(entity:Entity,filter:Selector,context:EffectContext){return (!filter.zones||filter.zones.includes(entity.zone))&&(!filter.types||filter.types.includes(entity.type))&&(!filter.tags||filter.tags.every(t=>entity.tags.includes(t)))&&(!filter.excludeTags||filter.excludeTags.every(t=>!entity.tags.includes(t)))&&(!filter.excludeSource||entity.id!==context.source)&&(!filter.controller||filter.controller==='any'||(filter.controller==='self'?entity.controller===context.player:entity.controller!==context.player));}
export function candidates<S>(state:S,adapter:EffectAdapter<S>,selection:Selection,context:EffectContext){return adapter.entities(state).filter(e=>matches(e,selection.filter,context));}
export function payment(pool:Record<string,number>,specific:Record<string,number>={},generic=0):Record<string,number>{
 if(Object.values(pool).some(n=>!Number.isInteger(n)||n<0))throw new EffectError('Invalid resource pool.');
 const remaining={...pool},spent:Record<string,number>={};
 if(!Number.isInteger(generic)||generic<0||generic>999)throw new EffectError('Invalid generic cost.');
 for(const [resource,count] of Object.entries(specific)){
  if(!Number.isInteger(count)||count<0||count>999)throw new EffectError('Invalid resource cost.');
  if((remaining[resource]||0)<count)throw new EffectError(`Need ${count} ${resource}.`);
  remaining[resource]=(remaining[resource]||0)-count;spent[resource]=count;
 }
 // The adapter's insertion order defines a deterministic generic-payment policy.
 for(const resource of Object.keys(remaining)){const count=Math.min(generic,remaining[resource]);spent[resource]=(spent[resource]||0)+count;generic-=count;}
 if(generic)throw new EffectError('Not enough resources for the generic cost.');
 return spent;
}
function verifySelection<S>(state:S,adapter:EffectAdapter<S>,selection:Selection|undefined,ids:string[],context:EffectContext){
 if(!selection){if(ids.length)throw new EffectError('This program does not accept that selection.');return;}
 if(!Number.isInteger(selection.count)||selection.count<1||selection.count>50||ids.length!==selection.count||new Set(ids).size!==ids.length)throw new EffectError(selection.label);
 const valid=new Set(candidates(state,adapter,selection,context).map(e=>e.id));
 if(ids.some(id=>!valid.has(id)))throw new EffectError('Selection is no longer legal.');
}
/** Atomic: every cost and target is checked before cloning or paying anything. */
export function executeProgram<S>(original:S,adapter:EffectAdapter<S>,program:EffectProgram,context:EffectContext):{state:S;events:EffectEvent[]}{
 const errors=validateEffectProgram(program);if(errors.length)throw new EffectError(errors.join(' '));
 if(program.version!==1)throw new EffectError('Unsupported effects schema version.');
 const source=adapter.entities(original).find(e=>e.id===context.source);
 if(!source||source.controller!==context.player)throw new EffectError('You do not control the source.');
 const targets=context.targets||[],costCards=context.costCards||[];
 verifySelection(original,adapter,program.targets,targets,context);
 verifySelection(original,adapter,program.cost?.cards,costCards,context);
 if(program.cost?.exhaust&&source.exhausted)throw new EffectError('Source is already exhausted.');
 if(program.cost?.cards&&!program.cost.cardDestination)throw new EffectError('Missing cost destination.');
 const spent=payment(adapter.resources(original,context.player),program.cost?.resources,program.cost?.generic);
 const discarded=costCards.map(id=>adapter.entities(original).find(e=>e.id===id)!);
 const state=structuredClone(original),events:EffectEvent[]=[];
 let destroyed=0,budget=256;const destroyedEntities:Entity[]=[];
 const emit=(kind:string,entity?:Entity,amount?:number,resource?:string)=>events.push({kind,source:context.source,player:context.player,entity,amount,resource});
 for(const [r,n] of Object.entries(spent))if(n){adapter.adjustResource(state,context.player,r,-n);emit('resource-paid',undefined,n,r);}
 if(program.cost?.exhaust)adapter.exhaust(state,context.source);
 for(const id of costCards){adapter.move(state,id,program.cost!.cardDestination!);emit('cost-card',discarded.find(e=>e.id===id));}
 const amount=(value:Amount)=>{
  const n=typeof value==='number'?value:'count'in value?adapter.entities(state).filter(e=>matches(e,value.count,context)).length:destroyed;
  if(!Number.isFinite(n)||!Number.isInteger(n)||n<0||n>999)throw new EffectError('Invalid effect quantity.');return n;
 };
 const entities=(ref:Targets)=>adapter.entities(state).filter(e=>ref==='source'?e.id===context.source:ref==='targets'?targets.includes(e.id):matches(e,ref,context));
 const run=(steps:EffectStep[])=>{for(const step of steps){if(--budget<0)throw new EffectError('Effect execution budget exceeded.');
  if(step.op==='draw'){const n=amount(step.count);adapter.draw(state,context.player,n);emit('draw',undefined,n);}
  else if(step.op==='resource'){const n=amount(step.amount);adapter.adjustResource(state,context.player,step.resource,n);emit('resource',undefined,n,step.resource);}
  else if(step.op==='move'){for(const e of entities(step.targets)){adapter.move(state,e.id,step.zone);emit('moved',e);}}
  else if(step.op==='counter'){for(const e of entities(step.targets)){adapter.counter(state,e.id,step.counter,step.amount);emit('counter',e,step.amount,step.counter);}}
  else if(step.op==='token'){for(let i=0,n=amount(step.count);i<n;i++){if(--budget<0)throw new EffectError('Effect execution budget exceeded.');const id=adapter.token(state,context.player,step.token);emit('entered',adapter.entities(state).find(e=>e.id===id));}}
  else if(step.op==='if'){const condition=step.condition;const matching=condition.kind==='destroyed'?destroyedEntities.some(e=>!condition.filter||matches(e,condition.filter,context)):discarded.some(e=>matches(e,condition.filter,context));if(matching)run(step.then);}
  else if(step.op==='modify'){for(const e of entities(step.targets)){adapter.modify(state,e.id,step.stats,step.keywords||[],step.duration);emit('modified',e);}}
  else if(step.op==='damage'||step.op==='destroy'){const n=step.op==='damage'?amount(step.amount):0;for(const e of entities(step.targets)){if(--budget<0)throw new EffectError('Effect execution budget exceeded.');const died=step.op==='damage'?adapter.damage(state,e.id,n):adapter.destroy(state,e.id);emit(step.op,e,n);if(died){destroyed++;destroyedEntities.push(e);emit('destroyed',e);}}}
  else throw new EffectError('Unknown effect operation.');
 }};
 run(program.steps);emit('resolved');return {state,events};
}

/** A game's priority/timing plugin decides when these stack operations are legal. */
export type EffectStackEntry={program:EffectProgram;context:EffectContext};
export function resolveTop<S>(state:S,adapter:EffectAdapter<S>,stack:readonly EffectStackEntry[]){
 if(!stack.length)throw new EffectError('Effect stack is empty.');
 const top=stack[stack.length-1];return {...executeProgram(state,adapter,top.program,top.context),stack:stack.slice(0,-1)};
}
export type TriggerDefinition={id:string;event:string;sourceZones:string[];subject?:Selector;limitPerTurn?:number;program:EffectProgram};
/** Matching only; game plugins choose simultaneous-trigger order and priority. */
export function matchingTriggers<S>(state:S,adapter:EffectAdapter<S>,event:EffectEvent,subscriptions:{source:string;trigger:TriggerDefinition}[]){
 const entities=adapter.entities(state);
 return subscriptions.flatMap(({source,trigger})=>{const card=entities.find(e=>e.id===source),context={source,player:card?.controller||''};return card&&trigger.event===event.kind&&trigger.sourceZones.includes(card.zone)&&(!trigger.subject||(event.entity&&matches(event.entity,trigger.subject,context)))?[{program:trigger.program,context,triggerId:trigger.id,limit:trigger.limitPerTurn}]:[];});
}
