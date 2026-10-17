/** Portable effects kernel. No game names, card catalogs, UI or player-count assumptions. */
import {validateEffectProgram} from './schema';
export type Entity={id:string;controller:string;zone:string;type:string;tags:string[];exhausted:boolean;stats?:Record<string,number>};
export type Selector={zones?:string[];types?:string[];tags?:string[];excludeTags?:string[];controller?:'self'|'other'|'any'|'target';excludeSource?:boolean;onlySource?:boolean};
export type Selection={filter:Selector;count:number;optional?:boolean;label:string};
export type Targets='source'|'targets'|Selector;
export type Amount=number|{count:Selector;multiplier?:number}|{result:'destroyed'}|{stat:string;of:'source'|'costCard'|'chosen'};
export type TokenDefinition={name:string;type:string;tags:string[];stats:Record<string,number>;zone:string;keywords?:string[]};
export type EffectStep=
 |{op:'choose';selection:Selection;destination:string;reveal?:boolean;shuffle?:string;event?:string}
 |{op:'select';selection:Selection}
 |{op:'heal';targets:Targets;amount:Amount}
 |{op:'attach';targets:Targets}
 |{op:'randomMove';filter:Selector;count:number;destination:string}
 |{op:'draw';count:Amount}
 |{op:'resource';resource:string;amount:Amount}
 |{op:'damage';targets:Targets;amount:Amount}
 |{op:'destroy';targets:Targets}
 |{op:'move';targets:Targets;zone:string}
 |{op:'counter';targets:Targets;counter:string;amount:number}
 |{op:'modify';targets:Targets;stats:Record<string,Amount>;keywords?:string[];duration:'turn'|'permanent'}
 |{op:'token';token:TokenDefinition;count:Amount}
 |{op:'if';condition:{kind:'destroyed';filter?:Selector}|{kind:'costCard'|'chosen';filter:Selector}|{kind:'count';filter:Selector;atLeast:number};then:EffectStep[];otherwise?:EffectStep[]};
export type EffectProgram={version:1;id:string;label:string;targets?:Selection;cost?:{resources?:Record<string,number>;generic?:number;exhaust?:boolean;counters?:Record<string,number>;cards?:Selection;cardDestination?:string};steps:EffectStep[]};
export type EffectContext={player:string;source:string;targets?:string[];costCards?:string[];targetControllers?:string[];sourceStats?:Record<string,number>};
export type EffectEvent={kind:string;source:string;player:string;entity?:Entity;amount?:number;resource?:string;observers?:Entity[]};
export type EffectAdapter<S>={
 entities:(state:S)=>Entity[];
 attach?:(state:S,source:string,target:string)=>void;
 stats?:(state:S,id:string)=>Record<string,number>;
 random?:(state:S)=>number;
 shuffle?:(state:S,player:string,zone:string)=>void;
 counters?:(state:S,id:string)=>Record<string,number>;
 resources:(state:S,player:string)=>Record<string,number>;
 adjustResource:(state:S,player:string,resource:string,delta:number)=>void;
 exhaust:(state:S,id:string)=>void;
 move:(state:S,id:string,destination:string)=>void;
 counter:(state:S,id:string,name:string,delta:number)=>void;
 draw:(state:S,player:string,count:number)=>void;
 destroy:(state:S,id:string)=>boolean;
 heal?:(state:S,id:string,amount:number)=>void;
 damage:(state:S,id:string,amount:number)=>boolean;
 modify:(state:S,id:string,stats:Record<string,number>,keywords:string[],duration:'turn'|'permanent')=>void;
 token:(state:S,player:string,definition:TokenDefinition)=>string;
};
export class EffectError extends Error{constructor(message:string){super(message);this.name='EffectError';}}
export function matches(entity:Entity,filter:Selector,context:EffectContext){return (!filter.zones||filter.zones.includes(entity.zone))&&(!filter.types||filter.types.includes(entity.type))&&(!filter.tags||filter.tags.every(t=>entity.tags.includes(t)))&&(!filter.excludeTags||filter.excludeTags.every(t=>!entity.tags.includes(t)))&&(!filter.excludeSource||entity.id!==context.source)&&(!filter.onlySource||entity.id===context.source)&&(!filter.controller||filter.controller==='any'||(filter.controller==='target'?!!context.targetControllers?.includes(entity.controller):filter.controller==='self'?entity.controller===context.player:entity.controller!==context.player));}
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
 if(!Number.isInteger(selection.count)||selection.count<1||selection.count>999||(ids.length!==selection.count&&!(selection.optional&&ids.length===0))||new Set(ids).size!==ids.length)throw new EffectError(selection.label);
 const valid=new Set(candidates(state,adapter,selection,context).map(e=>e.id));
 if(ids.some(id=>!valid.has(id)))throw new EffectError('Selection is no longer legal.');
}
export type EffectContinuation={context:EffectContext;steps:EffectStep[];events:EffectEvent[];destroyed:Entity[];discarded:Entity[];chosen:Entity[];values:Record<string,Record<string,number>>;budget:number};
export type EffectResult<S>={state:S;events:EffectEvent[];pending?:EffectContinuation};
/** Atomic: every cost and target is checked before cloning or paying anything. */
export function executeProgram<S>(original:S,adapter:EffectAdapter<S>,program:EffectProgram,context:EffectContext):EffectResult<S>{
 const errors=validateEffectProgram(program);if(errors.length)throw new EffectError(errors.join(' '));
 if(program.version!==1)throw new EffectError('Unsupported effects schema version.');
 const source=adapter.entities(original).find(e=>e.id===context.source);
 if(!source||source.controller!==context.player)throw new EffectError('You do not control the source.');
 const targets=context.targets||[],costCards=context.costCards||[];
 verifySelection(original,adapter,program.targets,targets,context);
 verifySelection(original,adapter,program.cost?.cards,costCards,context);
 if(program.cost?.exhaust&&source.exhausted)throw new EffectError('Source is already exhausted.');
 if(program.cost?.cards&&!program.cost.cardDestination)throw new EffectError('Missing cost destination.');
 for(const [name,n] of Object.entries(program.cost?.counters||{}))if((adapter.counters?.(original,context.source)[name]||0)<n)throw new EffectError(`Need ${n} ${name} counters.`);
 context={...context,targetControllers:adapter.entities(original).filter(e=>targets.includes(e.id)).map(e=>e.controller)};
 const spent=payment(adapter.resources(original,context.player),program.cost?.resources,program.cost?.generic);
 const discarded=costCards.map(id=>adapter.entities(original).find(e=>e.id===id)!);
 const state=structuredClone(original),events:EffectEvent[]=[];
 const emit=(kind:string,entity?:Entity,amount?:number,resource?:string)=>events.push({kind,source:context.source,player:context.player,entity,amount,resource});
 for(const [r,n] of Object.entries(spent))if(n){adapter.adjustResource(state,context.player,r,-n);emit('resource-paid',undefined,n,r);}
 for(const [name,n] of Object.entries(program.cost?.counters||{}))adapter.counter(state,context.source,name,-n);
 if(program.cost?.exhaust)adapter.exhaust(state,context.source);
 for(const id of costCards){adapter.move(state,id,program.cost!.cardDestination!);emit('cost-card',discarded.find(e=>e.id===id));events[events.length-1].observers=structuredClone(adapter.entities(original));}
 return continueProgram(state,adapter,{context,steps:program.steps,events,destroyed:[],discarded,chosen:[],values:{source:context.sourceStats||adapter.stats?.(original,context.source)||{},costCard:costCards.length?(adapter.stats?.(original,costCards[0])||{}):{}},budget:256});
}
/** Resumes only trusted, engine-produced continuations. The game owns storage/authorization. */
export function continueProgram<S>(original:S,adapter:EffectAdapter<S>,continuation:EffectContinuation,choice?:string[]):EffectResult<S>{
 const state=structuredClone(original),flow=structuredClone(continuation),{context,events}=flow;
 let targets=context.targets||[];const destroyedEntities=flow.destroyed,discarded=flow.discarded;
 const emit=(kind:string,entity?:Entity,amount?:number,resource?:string)=>events.push({kind,source:context.source,player:context.player,entity,amount,resource});
 if(choice){
  const step=flow.steps.shift();if(step?.op!=='choose'&&step?.op!=='select')throw new EffectError('No effect choice is pending.');
  verifySelection(state,adapter,step.selection,choice,context);
  flow.chosen=choice.map(id=>structuredClone(adapter.entities(state).find(e=>e.id===id)!));flow.values.chosen=choice.length?(adapter.stats?.(state,choice[0])||{}):{};
  if(step.op==='select'){context.targets=[...choice];targets=[...choice];context.targetControllers=flow.chosen.map(e=>e.controller);}
  const observers=structuredClone(adapter.entities(state));if(step.op==='choose')for(const e of flow.chosen){if(step.reveal)emit('revealed',e);adapter.move(state,e.id,step.destination);emit(step.event||'moved',e);events[events.length-1].observers=observers;}
  if(step.op==='choose'&&step.shuffle){if(!adapter.shuffle)throw new EffectError('Game adapter does not support shuffling.');adapter.shuffle(state,context.player,step.shuffle);emit('shuffled');}
 }
 const amount=(value:Amount)=>{
  const n=typeof value==='number'?value:'count'in value?adapter.entities(state).filter(e=>matches(e,value.count,context)).length*(value.multiplier??1):'stat'in value?(flow.values[value.of]?.[value.stat]||0):destroyedEntities.length;
  if(!Number.isFinite(n)||!Number.isInteger(n)||n<0||n>999)throw new EffectError('Invalid effect quantity.');return n;
 };
 const entities=(ref:Targets)=>structuredClone(adapter.entities(state)).filter(e=>ref==='source'?e.id===context.source:ref==='targets'?targets.includes(e.id):matches(e,ref,context));
 while(flow.steps.length){const step=flow.steps.shift()!;if(--flow.budget<0)throw new EffectError('Effect execution budget exceeded.');
  if(step.op==='choose'||step.op==='select'){
   const available=candidates(state,adapter,step.selection,context);
   if(!available.length){flow.chosen=[];flow.values.chosen={};if(step.op==='choose'&&step.shuffle){if(!adapter.shuffle)throw new EffectError('Game adapter does not support shuffling.');adapter.shuffle(state,context.player,step.shuffle);emit('shuffled');}continue;}
   flow.steps.unshift({...step,selection:{...step.selection,count:Math.min(step.selection.count,available.length)}});return {state,events,pending:flow};
  }
  else if(step.op==='heal'){if(!adapter.heal)throw new EffectError('Game does not support healing.');for(const e of entities(step.targets)){adapter.heal(state,e.id,amount(step.amount));emit('healed',e);}}
  else if(step.op==='attach'){if(!adapter.attach)throw new EffectError('Game adapter does not support attachments.');for(const e of entities(step.targets)){adapter.attach(state,context.source,e.id);emit('attached',e);}}
  else if(step.op==='randomMove'){
   if(!adapter.random)throw new EffectError('Game adapter does not support random choices.');
   const available=structuredClone(adapter.entities(state)).filter(e=>matches(e,step.filter,context));
   for(let n=0;n<step.count&&available.length;n++){const random=adapter.random(state);if(!Number.isFinite(random)||random<0||random>=1)throw new EffectError('Invalid random value.');const e=available.splice(Math.floor(random*available.length),1)[0];adapter.move(state,e.id,step.destination);emit('random-moved',e);}
  }
  else if(step.op==='draw'){const n=amount(step.count),before=new Map(adapter.entities(state).map(e=>[e.id,e.zone]));adapter.draw(state,context.player,n);for(const e of adapter.entities(state))if(before.get(e.id)!==e.zone)emit('drawn',e);emit('draw',undefined,n);}
  else if(step.op==='resource'){const n=amount(step.amount);adapter.adjustResource(state,context.player,step.resource,n);emit('resource',undefined,n,step.resource);}
  else if(step.op==='move'){for(const e of entities(step.targets)){adapter.move(state,e.id,step.zone);emit('moved',e);}}
  else if(step.op==='counter'){for(const e of entities(step.targets)){adapter.counter(state,e.id,step.counter,step.amount);emit('counter',e,step.amount,step.counter);}}
  else if(step.op==='token'){for(let i=0,n=amount(step.count);i<n;i++){if(--flow.budget<0)throw new EffectError('Effect execution budget exceeded.');const id=adapter.token(state,context.player,step.token);emit('entered',adapter.entities(state).find(e=>e.id===id));}}
  else if(step.op==='if'){const condition=step.condition;const matching=condition.kind==='destroyed'?destroyedEntities.some(e=>!condition.filter||matches(e,condition.filter,context)):condition.kind==='count'?adapter.entities(state).filter(e=>matches(e,condition.filter,context)).length>=condition.atLeast:(condition.kind==='chosen'?flow.chosen:discarded).some(e=>matches(e,condition.filter,context));flow.steps.unshift(...(matching?step.then:step.otherwise||[]));}
  else if(step.op==='modify'){for(const e of entities(step.targets)){adapter.modify(state,e.id,Object.fromEntries(Object.entries(step.stats).map(([key,value])=>[key,typeof value==='number'?value:amount(value)])),step.keywords||[],step.duration);emit('modified',e);}}
  else if(step.op==='damage'||step.op==='destroy'){const n=step.op==='damage'?amount(step.amount):0,observers=structuredClone(adapter.entities(state));for(const e of entities(step.targets)){if(--flow.budget<0)throw new EffectError('Effect execution budget exceeded.');const died=step.op==='damage'?adapter.damage(state,e.id,n):adapter.destroy(state,e.id);emit(step.op,e,n);if(died){destroyedEntities.push(e);emit('destroyed',e);events[events.length-1].observers=observers;}}}
  else throw new EffectError('Unknown effect operation.');
 }
 emit('resolved');return {state,events};
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
 return subscriptions.flatMap(({source,trigger})=>{const card=(event.kind==='destroyed'&&event.observers?event.observers.find(e=>e.id===source):entities.find(e=>e.id===source)),context={source,player:card?.controller||'',sourceStats:card?.stats};return card&&trigger.event===event.kind&&trigger.sourceZones.includes(card.zone)&&(!trigger.subject||(event.entity&&matches(event.entity,trigger.subject,context)))?[{program:trigger.program,context,triggerId:trigger.id,limit:trigger.limitPerTurn}]:[];});
}
