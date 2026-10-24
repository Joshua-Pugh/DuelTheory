import {continueProgram,candidates,matches,executeProgram,openPriority,passPriority,type Priority,type EffectProgram,type EffectContext,type EffectEvent,type EffectStackEntry} from '../../framework';
import {newBattlefield,emptyBasin,fontEssence,type Battlefield} from '../../ashenBattlefieldState';
import type {AshenFaction} from '../../ashenDecks';
import {ashenAdapter,ashenStats,availableAshenAbilities,playProgram,moveAshenCard,drainTriggers,completeOrPause,resumeAshenEffect,hasAshenChoices} from './adapter';
import {ashenEffects} from './effectPacks';

export type Phase='start'|'main1'|'combat'|'main2'|'end';
export type ClashEntry=EffectStackEntry&{kind:'action'|'ability'|'trigger';bonus?:boolean;key?:string};
type Job={kind:'program';program:EffectProgram;context:EffectContext}|{kind:'ready'|'draw'|'main'|'newTurn'|'endCleanup'}|{kind:'combatDamage';first?:boolean};
export type AshenDuel={phase:Phase;stack:ClashEntry[];priority:Priority|null;responseWindow?:boolean;ordering?:boolean;jobs:Job[];sacrificed:[number,number];combat?:{stage:'attack'|'block'|'damage'|'finished';attackers:string[];blockers:Record<string,string[]>;blocked:string[]};winner?:0|1|'draw';first:0|1;callPermission?:string;damagePackets?:{source:string;target:string;amount:number}[]};
const duel=(s:Battlefield)=>{const d=s.rules?.duel;if(!d)throw Error('Start a Brute duel first.');return d;};
const active=(s:Battlefield)=>String(s.table.active);
const fieldEvent=(s:Battlefield,id:string,kind:string):EffectEvent=>({kind,source:id,player:String(s.table.cards[id].controller),entity:ashenAdapter.entities(s).find(e=>e.id===id),observers:ashenAdapter.entities(s)});
const program=(id:string,label:string,steps:EffectProgram['steps']):EffectProgram=>({version:1,id,label,steps});
const alive=(s:Battlefield,id:string)=>s.table.cards[id]?.zone==='unit';
export function newBruteDuel(random:()=>number=Math.random){const s=newBattlefield(false,random,true);s.table.definition.zones.push({id:'clash',label:'The Clash',slots:0});s.table.piles['0:clash']=[];s.table.piles['1:clash']=[];s.table.active=random()<.5?0:1;s.rules!.duel={phase:'main1',stack:[],priority:null,jobs:[],sacrificed:[0,0],first:s.table.active};s.table.events=[`Brute duel: Player ${s.table.active+1} goes first; first draw skipped.`];return s;}
export function newAshenDuel(decks:[AshenFaction,AshenFaction],seed:number,first:0|1){let value=seed>>>0;const random=()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};const s=newBattlefield(false,random,decks);s.table.definition.zones.push({id:'clash',label:'The Clash',slots:0});s.table.piles['0:clash']=[];s.table.piles['1:clash']=[];s.table.active=first;s.rules!.duel={phase:'main1',stack:[],priority:null,jobs:[],sacrificed:[0,0],first};s.table.events=[`${decks[0]} versus ${decks[1]}. Coin toss: Player ${first+1} goes first; first draw skipped.`];return s;}
export function checkAshenVictory(s:Battlefield){const d=duel(s);if(s.table.health[0]<=0||s.table.health[1]<=0)d.winner=s.table.health[0]<=0&&s.table.health[1]<=0?'draw':s.table.health[0]<=0?1:0;else if(!s.table.piles['0:deck'].length&&!s.table.piles['1:deck'].length)d.winner=s.table.health[0]===s.table.health[1]?'draw':s.table.health[0]>s.table.health[1]?0:1;return s;}
function requireIdle(s:Battlefield){if(s.rules?.pending||duel(s).stack.length||duel(s).jobs.length||duel(s).callPermission||duel(s).responseWindow||duel(s).ordering)throw Error('Finish the current Clash or choice first.');if(duel(s).winner!==undefined)throw Error('This duel is over.');}
function reactive(s:Battlefield,id:string,p?:EffectProgram){const c=s.table.cards[id];return p?!!p.cost&&!['rig-outfit','lance-outfit'].includes(p.id):c?.type==='Tactic';}
function ensureTiming(s:Battlefield,id:string,context:EffectContext,ability?:EffectProgram){const d=duel(s),c=s.table.cards[id];if(d.winner!==undefined||s.rules?.pending||d.ordering)throw Error('Resolve the current choice first.');if(!c||String(c.controller)!==context.player)throw Error('You do not control this card.');if(d.priority){if(d.priority.holder!==context.player)throw Error('Another player has priority.');if(!reactive(s,id,ability))throw Error('Only Tactics and reactive abilities may join the Clash.');}else if((context.player!==active(s)&&!(d.phase==='combat'&&d.combat?.stage==='block'&&reactive(s,id,ability)))||!['main1','main2','combat'].includes(d.phase)||(!reactive(s,id,ability)&&!['main1','main2'].includes(d.phase)))throw Error('This action is not legal in this phase.');}
function prepareAshenAction(s:Battlefield,id:string,context:EffectContext,abilityId?:string){
 const d=duel(s),card=s.table.cards[id];let p:EffectProgram;
 const ability=abilityId?availableAshenAbilities(s,id).find(p=>p.id===abilityId):undefined;
 if(abilityId&&!ability)throw Error('Ability is unavailable.');ensureTiming(s,id,context,ability);
 if(ability){if(!['unit','support','ley'].includes(card.zone))throw Error('Ability source is not in play.');p=ability;}else{
  if(card.zone!=='hand'&&!(d.callPermission===id&&card.zone==='graveyard'))throw Error('Play cards from your hand.');
  if(card.type==='Ley Font'&&s.rules?.fontPlayed[card.controller])throw Error('One Ley Font per turn.');
  const temp=structuredClone(s);if(card.zone==='graveyard')moveAshenCard(temp,id,'hand');p=playProgram(temp,id);
  if(d.callPermission===id)p={...p,cost:{}};
 }
 if(nextCallBlocked(s,id))throw Error('Finish Korgath’s Call before another action.');
 const useKey=`${s.rules!.turn}:${id}:${p.id}`;if(p.oncePerTurn&&s.rules!.abilityUses?.[useKey])throw Error('This ability has already been used this turn.');
 return {card,ability,p};
}
/** Validate timing, candidates and payment without applying any effect or changing the table. */
export function inspectAshenAction(s:Battlefield,id:string,who:0|1,abilityId?:string){
 try{const context:EffectContext={source:id,player:String(who)};const {p}=prepareAshenAction(s,id,context,abilityId);
  context.targets=p.targets?candidates(s,ashenAdapter,p.targets,context).map(e=>e.id).slice(0,p.targets.count):[];
  context.costCards=p.cost?.cards?candidates(s,ashenAdapter,p.cost.cards,context).map(e=>e.id).slice(0,p.cost.cards.count):[];
  executeProgram(s,ashenAdapter,{...p,steps:[]},context);return {allowed:true,reason:''};
 }catch(e){return {allowed:false,reason:e instanceof Error?e.message:String(e)};}
}
export function submitAshenAction(original:Battlefield,id:string,context:EffectContext,abilityId?:string):Battlefield{
 let s=structuredClone(original);const {card,ability,p}=prepareAshenAction(s,id,context,abilityId);
 const clean:EffectContext={source:id,player:context.player,targets:context.targets||[],costCards:context.costCards||[],sourceStats:ashenAdapter.stats!(s,id)};
 const useKey=`${s.rules!.turn}:${id}:${p.id}`;
 const paid=executeProgram(s,ashenAdapter,{...p,steps:[]},clean);if(p.oncePerTurn){paid.state.rules!.abilityUses??={};paid.state.rules!.abilityUses[useKey]=1;}s=paid.state;const next=duel(s);
 if(!ability){if(card.type==='Ley Font')s.rules!.fontPlayed[card.controller]=true;moveAshenCard(s,id,'clash');}
 next.stack.push({kind:ability?'ability':'action',program:{...p,cost:undefined},context:{...clean,costCards:[]},bonus:next.callPermission===id});
 if(next.callPermission===id)delete next.callPermission;
 s=drainTriggers(s,paid.events.filter(e=>e.kind!=='resolved'));duel(s).priority=openPriority(['0','1'],context.player);
 s.table.events.push(`Clash: ${card.name}${ability?' — '+p.label:''}. Costs paid.`);return settleAshenDuel(s);
}
export function ashenResponseOptions(s:Battlefield,who:string){
 const options:{source:string;label:string}[]=[];
 const affordable=structuredClone(s);
 for(const c of Object.values(s.table.cards).filter(c=>String(c.controller)===who&&c.zone==='ley'&&!c.faceDown&&!c.rotated)){
  affordable.basins[c.controller][fontEssence(c.cardId)]++;
  const effect=ashenEffects[c.cardId]?.onBurn;
  if(effect&&s.table.piles[`${who}:unit`].some(id=>!s.table.cards[id].faceDown)&&hasAshenChoices(s,effect.steps,{source:c.instanceId,player:who}))options.push({source:c.instanceId,label:`Burn ${c.name}: ${effect.label}`});
 }

 for(const c of Object.values(s.table.cards).filter(c=>String(c.controller)===who)){
  const programs=c.zone==='hand'&&c.type==='Tactic'?[playProgram({...s,table:{...s.table,active:c.controller}},c.instanceId)]:['unit','support','ley'].includes(c.zone)?availableAshenAbilities(s,c.instanceId).filter(p=>reactive(s,c.instanceId,p)):[];
  for(const p of programs){try{if(p.oncePerTurn&&s.rules?.abilityUses?.[`${s.rules.turn}:${c.instanceId}:${p.id}`])continue;
   const context={source:c.instanceId,player:who};if(!hasAshenChoices(s,p.steps,context))continue;const targets=p.targets?candidates(s,ashenAdapter,p.targets,context).map(e=>e.id).slice(0,p.targets.count):[];
   const costs=p.cost?.cards?candidates(s,ashenAdapter,p.cost.cards,context).map(e=>e.id).slice(0,p.cost.cards.count):[];
   executeProgram(affordable,ashenAdapter,{...p,steps:[]},{...context,targets,costCards:costs});options.push({source:c.instanceId,label:`${c.name}: ${p.label}`});
  }catch{/* Unaffordable or without legal choices. */}}
 }
 return options;
}
function canReact(s:Battlefield,who:string){return ashenResponseOptions(s,who).length>0;}
export function passAshenPriority(original:Battlefield,who:0|1){const s=structuredClone(original),d=duel(s);if(s.rules?.pending||d.ordering)throw Error('Finish the current selection first.');if(!d.priority)throw Error('No Clash response is pending.');const pass=passPriority(d.priority,String(who));d.priority=pass.done?null:pass.priority;if(pass.done){if(d.stack.length)resolveTopEntry(s);else d.responseWindow=false;}return settleAshenDuel(s);}
function nextCallBlocked(s:Battlefield,id:string){const permission=duel(s).callPermission;return !!permission&&permission!==id;}
export function korgathCallChoices(s:Battlefield){const d=duel(s);if(d.callPermission!=='choose')return [];return Object.values(s.table.cards).filter(c=>c.controller===s.table.active&&c.cardId==='ashen-brute-korgath-lord-of-ruin'&&['hand','graveyard'].includes(c.zone)).map(c=>c.instanceId);}
export function chooseKorgathForCall(original:Battlefield,id:string|null){const s=structuredClone(original);if(duel(s).callPermission!=='choose')throw Error('No Korgath play permission.');if(id===null){delete duel(s).callPermission;return settleAshenDuel(s);}if(!korgathCallChoices(s).includes(id))throw Error('Choose Korgath from your hand or Ossuary.');duel(s).callPermission=id;return submitAshenAction(s,id,{player:active(s),source:id});}
function resolveTopEntry(s:Battlefield){const d=duel(s),entry=d.stack.pop();if(!entry)return;const id=entry.context.source,c=s.table.cards[id];
 if(entry.kind==='action'){
  const zone=c.type==='Unit'?'unit':c.type==='Ley Font'?'ley':['Rune','Relic'].includes(c.type)?'support':'graveyard';moveAshenCard(s,id,zone);
  if(c.type==='Unit'){s.table.cards[id].rotated=!ashenStats(s,id).keywords.includes('Charge');if(entry.bonus){ashenAdapter.modify(s,id,{attack:3},['Charge'],'turn');s.table.cards[id].rotated=false;}}
  if(c.type==='Ley Font')s.table.cards[id].faceDown=!!ashenEffects[c.cardId]?.entersSpent;
  if(['unit','support','ley'].includes(zone)){
   if(entry.program.steps.length)d.stack.push({...entry,kind:'trigger',program:{...entry.program,cost:undefined}});
   const next=drainTriggers(s,[fieldEvent(s,id,'entered')]);Object.assign(s,next);return;
  }
 }
 if(c?.cardId==='ashen-brute-korgath-s-call'&&entry.kind==='action'){if(d.sacrificed[c.controller]>=3)s.table.health[c.controller]+=5;d.callPermission='choose';return;}
 // Illegal targets can disappear during Clash; resolve as much as possible.
 const p={...entry.program,targets:undefined,cost:undefined},ctx={...entry.context,costCards:[]};
 const valid=(ctx.targets||[]).filter(t=>{const e=ashenAdapter.entities(s).find(e=>e.id===t);return !!e&&(!ashenAdapter.canTarget||ashenAdapter.canTarget(s,e,ctx))&&(!entry.program.targets||matches(e,entry.program.targets.filter,ctx));});
 const context={...ctx,targets:valid,targetControllers:valid.map(id=>ashenAdapter.entities(s).find(e=>e.id===id)!.controller)};
 const resolved=continueProgram(s,ashenAdapter,{context,steps:p.steps,events:[],destroyed:[],discarded:[],chosen:[],values:{source:ctx.sourceStats||ashenAdapter.stats!(s,id)},budget:256});
 Object.assign(s,completeOrPause(resolved,entry.program.label));
}
export function resumeBruteDuel(original:Battlefield,ids:string[]){
 const pending=original.rules?.pending;
 if(pending?.flow.steps[0]?.op==='select'&&!pending.flow.events.length){
  const staged=structuredClone(original);delete staged.rules!.pending;
  const selected=continueProgram(staged,ashenAdapter,{...pending.flow,steps:[pending.flow.steps[0]],events:[]},ids);
  const p:EffectProgram={version:1,id:'selected-trigger',label:pending.label,steps:pending.flow.steps.slice(1),targets:{filter:{},count:ids.length,label:'Selected targets'}};
  const context={...pending.flow.context,targets:ids,sourceStats:pending.flow.values.source};
  duel(selected.state).stack.push({kind:'trigger',program:p,context});duel(selected.state).priority=openPriority(['0','1'],context.player);return settleAshenDuel(selected.state);
 }
 return settleAshenDuel(resumeAshenEffect(original,ids));
}
export function burnInBruteDuel(original:Battlefield,id:string,who:0|1){let s=structuredClone(original);const d=duel(s),c=s.table.cards[id];if(d.winner!==undefined||s.rules?.pending||d.ordering||d.callPermission||c?.controller!==who||c.zone!=='ley'||c.faceDown||c.rotated)throw Error('This Font cannot be burned.');if(d.priority?d.priority.holder!==String(who):s.table.active!==who)throw Error('You do not have priority.');s.table.cards[id].faceDown=true;s.basins[who][fontEssence(c.cardId)]++;const p=ashenEffects[c.cardId]?.onBurn;if(p){d.stack.push({kind:'ability',program:p,context:{player:String(who),source:id}});d.priority=openPriority(['0','1'],String(who));}return settleAshenDuel(s);}
export function nextAshenPhase(original:Battlefield){let s=structuredClone(original);requireIdle(s);const d=duel(s);
 if(d.phase==='main1'){d.phase='combat';d.combat={stage:'attack',attackers:[],blockers:{},blocked:[]};}
 else if(d.phase==='combat'){if(d.combat?.stage!=='finished')throw Error('Finish or skip the Skirmish first.');d.phase='main2';}
 else if(d.phase==='main2'){d.phase='end';const marks=s.rules!.nobleMarks?.[s.table.active]||{};if(marks.planned&&marks.refined){const source=s.table.piles[`${s.table.active}:command`].find(id=>s.table.cards[id].cardId==='ashen-noble-the-crown-s-bastion');if(source)d.jobs.push({kind:'program',context:{source,player:active(s)},program:program('bastion-end','Bastion: end-turn Fortify',[{op:'select',selection:{filter:{zones:['unit'],types:['Unit'],tags:['Noble'],controller:'self'},count:1,label:'Bastion: choose a Noble'}},{op:'fortify',targets:'targets',amount:1}])});}d.jobs.push({kind:'endCleanup'},{kind:'newTurn'});}
 else throw Error('Finish the current phase.');return settleAshenDuel(s);
}
export function settleAshenDuel(initial:Battlefield):Battlefield{
 let s=initial,budget=512;
 while(budget--){const d=duel(s);for(const entry of d.stack)entry.key??=`clash-${++s.rules!.serial}`;checkAshenVictory(s);if(d.winner!==undefined||s.rules?.pending||d.callPermission==='choose'||d.ordering)return s;
  if(d.stack.length||d.responseWindow){if(d.stack.at(-1)?.program.steps[0]?.op==='select'){resolveTopEntry(s);continue;}if(!d.priority)d.priority=openPriority(['0','1'],d.stack.at(-1)?.context.player||active(s));if(canReact(s,d.priority.holder))return s;const pass=passPriority(d.priority,d.priority.holder);d.priority=pass.done?null:pass.priority;if(pass.done){if(d.stack.length)resolveTopEntry(s);else d.responseWindow=false;}continue;}
  d.priority=null;const job=d.jobs.shift();if(!job)return s;
  if(job.kind==='program'){d.stack.push({kind:'trigger',program:job.program,context:job.context});d.priority=openPriority(['0','1'],job.context.player);}
  else if(job.kind==='ready'){
   for(const zone of ['unit','support','ley'])for(const id of s.table.piles[`${s.table.active}:${zone}`]){const c=s.table.cards[id],was=c.rotated||c.faceDown;c.rotated=false;if(zone==='ley')c.faceDown=false;const p=was?ashenEffects[c.cardId]?.onReady:undefined;if(p)d.jobs.unshift({kind:'program',program:p,context:{player:active(s),source:id}});}
  }else if(job.kind==='draw'){const before=new Set(s.table.piles[`${s.table.active}:hand`]);ashenAdapter.draw(s,active(s),1);s=drainTriggers(s,ashenAdapter.entities(s).filter(e=>e.zone==='hand'&&e.controller===active(s)&&!before.has(e.id)).map(entity=>({kind:'drawn',source:s.table.piles[`${s.table.active}:command`][0],player:active(s),entity})));}
  else if(job.kind==='main')d.phase='main1';
  else if(job.kind==='newTurn'){
   s.rules!.lastNobleMarks??={};s.rules!.lastNobleMarks[s.table.active]=structuredClone(s.rules!.nobleMarks?.[s.table.active]||{});s.rules!.nobleMarks={};s.rules!.abilityUses={};s.rules!.nextPlanFortify={};s.table.active=s.table.active===0?1:0;s.rules!.turn++;s.table.turn=s.rules!.turn;d.phase='start';s.rules!.fontPlayed=[false,false];s.rules!.triggerUses={};d.sacrificed=[0,0];delete d.combat;
   const starts=Object.values(s.table.cards).filter(c=>c.controller===s.table.active&&['unit','support','ley','command'].includes(c.zone)).flatMap(c=>{const p=ashenEffects[c.cardId]?.onStart;return p?[{kind:'program' as const,program:p,context:{player:active(s),source:c.instanceId}}]:[];});d.jobs.push(...starts,{kind:'ready'},{kind:'draw'},{kind:'main'});
  }else if(job.kind==='endCleanup'){
   s.rules!.damage={};s.rules!.modifiers=s.rules!.modifiers.filter(m=>m.duration==='permanent');s.basins=[emptyBasin(),emptyBasin()];
   const excess=s.table.piles[`${s.table.active}:hand`].length-7;if(excess>0){const source=s.table.piles[`${s.table.active}:command`][0],p=program('end-discard','Send excess hand cards to your Ossuary',[{op:'choose',selection:{filter:{zones:['hand'],controller:'self'},count:excess,label:'End Phase: send excess hand cards to your Ossuary until seven remain'},destination:'graveyard'}]);s=completeOrPause(executeProgram(s,ashenAdapter,p,{player:active(s),source}),'End Phase Ossuary selection');}
  }else if(job.kind==='combatDamage')s=applyCombatDamage(s,job.first??true);
 }
 throw Error('Duel resolution limit reached.');
}

export function canBlockAshen(s:Battlefield,attacker:string,blocker:string){if(!alive(s,attacker)||!alive(s,blocker))return false;const a=s.table.cards[attacker],b=s.table.cards[blocker],ak=ashenStats(s,attacker).keywords,bk=ashenStats(s,blocker).keywords;if(a.controller===b.controller||b.faceDown||(b.rotated&&!bk.includes('Standfast'))||ak.includes('Evade'))return false;if(ak.includes('Ranged')&&!bk.includes('Ranged'))return false;if(ak.includes('Soar')&&!bk.some(k=>['Soar','Ranged'].includes(k)))return false;if(bk.includes('Siege')&&ak.some(k=>['Soar','Ranged'].includes(k)))return false;return true;}
export function declareAshenAttackers(original:Battlefield,ids:string[]){let s=structuredClone(original);requireIdle(s);const d=duel(s),combat=d.combat;if(d.phase!=='combat'||combat?.stage!=='attack')throw Error('Not the attacker declaration step.');if(new Set(ids).size!==ids.length||ids.some(id=>!alive(s,id)||s.table.cards[id].controller!==s.table.active||s.table.cards[id].rotated||s.table.cards[id].faceDown))throw Error('Choose distinct Ready friendly Units.');const mandatory=s.table.piles[`${s.table.active}:unit`].filter(id=>!s.table.cards[id].rotated&&ashenStats(s,id).keywords.includes('Reckless'));if(mandatory.some(id=>!ids.includes(id)))throw Error('Reckless Units must attack if able.');combat.attackers=[...ids];combat.stage=ids.length?'block':'finished';
 const originals=[...ids];for(const id of originals)s.table.cards[id].rotated=true;
 for(const id of originals){const c=s.table.cards[id],slug=c.cardId,ctx={player:active(s),source:id};
  const add=(p:EffectProgram,context:EffectContext=ctx)=>duel(s).stack.push({kind:'trigger',program:p,context});
  if(Object.entries(s.rules?.attachments||{}).some(([relic,target])=>target===id&&s.table.cards[relic]?.zone==='support'&&s.table.cards[relic].cardId==='ashen-noble-ashenfield-lance'))add(program('lance-siege','Ashenfield Lance: gain Siege',[{op:'modify',targets:'source',stats:{},keywords:['Siege'],duration:'turn'}]));
  if(slug==='ashen-brute-raging-mauler')add(program('rage-attack','Rage: +2 Attack per other attacking Brute',[{op:'modify',targets:'source',stats:{attack:{count:{zones:['unit'],tags:['Brute','Attacking'],controller:'self',excludeSource:true},multiplier:2}},duration:'turn'}]));
  if(slug==='ashen-brute-skyclaw-raider')add(program('skyclaw-attack','Skyclaw Raider attack bonus',[{op:'if',condition:{kind:'count',filter:{zones:['unit'],tags:['Brute','Attacking'],controller:'self',excludeSource:true},atLeast:1},then:[{op:'modify',targets:'source',stats:{attack:1},duration:'turn'}]}]));
  for(const keep of Object.values(s.table.cards).filter(x=>x.controller===c.controller&&x.zone==='command'&&x.cardId==='ashen-brute-the-broken-fist-keep'))add({...program('keep-attack','The Broken Fist Keep: +1 Attack',[{op:'modify',targets:'targets',stats:{attack:1},duration:'turn'}]),targets:{filter:{zones:['unit'],controller:'self'},count:1,label:'Attacking Brute'}},{player:active(s),source:keep.instanceId,targets:[id]});
  for(const drum of Object.values(s.table.cards).filter(x=>x.controller===c.controller&&x.zone==='support'&&x.cardId==='ashen-brute-drum-of-the-pit'))add(program('drum-attack','Drum of the Pit gains Momentum',[{op:'counter',targets:'source',counter:'momentum',amount:1}]),{player:active(s),source:drum.instanceId});
  const n=slug==='ashen-brute-skarn-the-unchained'?2:slug==='ashen-brute-battlefield-howler'?1:0;
  if(n)add(program('attacking-brutes','Create exhausted and attacking Brutes',[{op:'token',token:{name:'Frenzied Brute',type:'Unit',tags:['Brute','Token','Attacking'],stats:{attack:1,defense:1},zone:'unit'},count:n}]));
 }
 duel(s).ordering=duel(s).stack.some(e=>e.program.id==='rage-attack')&&duel(s).stack.some(e=>e.program.id==='attacking-brutes');duel(s).responseWindow=ids.length>0;if(ids.length)duel(s).priority=openPriority(['0','1'],active(s));
 s.table.events.push(`Declared Siege with ${combat.attackers.length} Units.`);return settleAshenDuel(s);}
export function orderAshenTrigger(original:Battlefield,index:number){const s=structuredClone(original),d=duel(s);if(!Number.isInteger(index)||index<0||index>=d.stack.length||d.stack.some(e=>e.kind!=='trigger'||e.context.player!==active(s))||!d.ordering)throw Error('Order simultaneous friendly triggers before responses.');const [entry]=d.stack.splice(index,1);d.stack.push(entry);return s;}
export function confirmAshenTriggerOrder(original:Battlefield){const s=structuredClone(original);if(!duel(s).ordering)throw Error('No trigger order to confirm.');duel(s).ordering=false;return settleAshenDuel(s);}
export function assignAshenBlocker(original:Battlefield,attacker:string,blocker:string){const s=structuredClone(original);requireIdle(s);const c=duel(s).combat;if(c?.stage!=='block'||!c.attackers.includes(attacker)||!canBlockAshen(s,attacker,blocker))throw Error('Illegal blocker.');for(const ids of Object.values(c.blockers))if(ids.includes(blocker))throw Error('A Unit cannot block multiple attackers.');(c.blockers[attacker]??=[]).push(blocker);if(!c.blocked.includes(attacker))c.blocked.push(attacker);return s;}
export function clearAshenBlockers(original:Battlefield){const s=structuredClone(original);requireIdle(s);const c=duel(s).combat;if(c?.stage!=='block')throw Error('Not blocking.');c.blockers={};c.blocked=[];return s;}
export function resolveAshenCombat(original:Battlefield){let s=structuredClone(original);requireIdle(s);const d=duel(s),c=d.combat;if(c?.stage!=='block')throw Error('Assign blockers first.');c.stage='damage';
 for(const [a,blockers] of Object.entries(c.blockers))for(const b of blockers)if(alive(s,a)&&alive(s,b)&&s.table.cards[b].cardId==='ashen-brute-crude-spearthrower'&&ashenStats(s,a).keywords.includes('Soar')){const p=program('spear-block','Crude Spearthrower deals pre-combat damage',[{op:'damage',targets:'targets',amount:1}]);duel(s).stack.push({kind:'trigger',program:{...p,targets:{filter:{zones:['unit']},count:1,label:'Blocked Soar Unit'}},context:{player:String(s.table.cards[b].controller),source:b,targets:[a]}});}
 duel(s).jobs.push({kind:'combatDamage'});duel(s).responseWindow=true;duel(s).priority=openPriority(['0','1'],String(s.table.active===0?1:0));return settleAshenDuel(s);}
function applyCombatDamage(s:Battlefield,first:boolean){const d=duel(s),c=d.combat!;
 const wave=()=>{const packets:{source:string;target:string;amount:number}[]=[];
  for(const a of c.attackers.filter(id=>alive(s,id))){const ak=ashenStats(s,a),bs=(c.blockers[a]||[]).filter(id=>alive(s,id));
   if((ak.keywords.includes('Duelist’s Edge')||ak.keywords.includes("Duelist's Edge"))===first){let remaining=Math.max(0,ak.attack);for(const b of bs){const n=Math.min(remaining,Math.max(0,ashenStats(s,b).defense-ashenStats(s,b).damage));packets.push({source:a,target:b,amount:n});remaining-=n;}
    if(!c.blocked.includes(a)||ak.keywords.includes('Pierce')){if(!bs.length&&!c.blocked.includes(a))remaining=Math.max(0,ak.attack);if(remaining)packets.push({source:a,target:s.table.piles[`${s.table.active===0?1:0}:command`][0],amount:remaining*(ak.keywords.includes('Siege')||ak.keywords.includes('DoubleStation')?2:1)});}
   }
   for(const b of bs){const bk=ashenStats(s,b);if((bk.keywords.includes('Duelist’s Edge')||bk.keywords.includes("Duelist's Edge"))===first)packets.push({source:b,target:a,amount:Math.max(0,bk.attack)});}
  }
  const observers=ashenAdapter.entities(s),stationEvents:EffectEvent[]=[];for(const p of packets){const target=s.table.cards[p.target];if(!target)continue;if(target.zone==='command'){s.table.health[target.controller]-=p.amount;if(p.amount>0)stationEvents.push({kind:'dealt-station',source:p.source,player:String(s.table.cards[p.source].controller),entity:observers.find(e=>e.id===p.source),target:observers.find(e=>e.id===p.target),amount:p.amount,observers});}else{s.rules!.damage[p.target]=(s.rules!.damage[p.target]||0)+p.amount;}}
  const dead=observers.filter(e=>e.zone==='unit'&&(s.rules!.damage[e.id]||0)>=ashenStats(s,e.id).defense),events:EffectEvent[]=[...stationEvents];for(const e of dead)if(ashenAdapter.destroy(s,e.id))events.push({kind:'destroyed',source:e.id,player:e.controller,entity:e,observers});s=drainTriggers(s,events);
 };
 wave();if(first)duel(s).jobs.unshift({kind:'combatDamage',first:false});else{duel(s).combat!.stage='finished';s.table.events.push('Skirmish damage resolved.');}return s;}
