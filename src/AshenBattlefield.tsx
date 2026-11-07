import {useBlockDrag} from './games/ashen/arena/useBlockDrag';
import AshenCombatConnections from './games/ashen/arena/AshenCombatConnections';
import AshenCombatFeedback from './games/ashen/arena/AshenCombatFeedback';
import AshenCombatSummary from './games/ashen/arena/AshenCombatSummary';
import './games/ashen/arena/ashenCombat.css';
import AshenBattlefieldCard from './games/ashen/arena/AshenBattlefieldCard';
import {combatCardView} from './games/ashen/arena/combatView';
import {useArenaDisplay} from './games/ashen/arena/useArenaDisplay';
import AshenClashQueue from './games/ashen/arena/AshenClashQueue';
import AshenOpeningHands from './AshenOpeningHands';
import {useDuelViewport} from './duelUi/useDuelViewport';
import CardBack from './duelUi/CardBack';
import AshenCardInspector,{AshenCardReading} from './games/ashen/arena/AshenCardInspector';
import AshenEffectNotices from './AshenEffectNotices';
import AshenCardAnimations from './AshenCardAnimations';
import CardActionMenu,{type CardMenuAction} from './duelUi/CardActionMenu';
import ResourcePool from './duelUi/ResourcePool';
import AshenPhaseControls from './AshenPhaseControls';
import type {AshenCommand} from './matches/ashenCommands';
import {createPortal} from 'react-dom';
import AshenReference from './AshenReference';
import {ashenGuidance,ashenPhaseName} from './ashenGuidance';
import {useEffect,useRef,useState,type CSSProperties,type DragEvent,type ReactNode} from 'react';
import {Eye,ChevronRight,Undo2} from 'lucide-react';
import AshenCardFrame from './AshenCardFrame';
import AshenEffectDecision from './AshenEffectDecision';
import {RESOURCES,type Resource} from './ashenPresentation';
import {BATTLEFIELD_KEY,ashenTurnNumber,battlefieldDispatch,fontEssence,newBattlefield,readBattlefield,type Battlefield,type BattlefieldAction} from './ashenBattlefieldState';
import './ashenBattlefield.css';
import './ashenDialogs.css';
import './games/ashen/arena/ashenArena.css';
import {ashenEffects,ASHEN_EFFECT_PACK} from './games/ashen/effectPacks';
import {ashenData,effectChoices,playProgram,resolveAshenEffect,resolveBurnEffect,availableAshenAbilities,pendingAshenChoices,resumeAshenEffect} from './games/ashen/adapter';
import {readyAshenFonts,burnAllAshenFonts,inspectAshenAttacker,inspectAshenBlocker,removeAshenBlocker,setAshenResponseMode,chooseAshenOpening,advanceAshenTo,inspectAshenAction,confirmAshenTriggerOrder,orderAshenTrigger,newBruteDuel,submitAshenAction,resumeBruteDuel,burnInBruteDuel,nextAshenPhase,passAshenPriority,declareAshenAttackers,assignAshenBlocker,clearAshenBlockers,resolveAshenCombat,korgathCallChoices,chooseKorgathForCall} from './games/ashen/duel';
import type {EffectProgram,EffectContext} from './framework';

const NAMES:Record<Resource,string>={untuned:'Untuned',oath:'Oath',fury:'Fury',ash:'Ash',veil:'Veil'};
import './games/ashen/arena/ashenPlaymat.css';
import {useAshenArenaAudio} from './games/ashen/arena/arenaAudio';

type Flight={id:number;x:number;y:number;dx:number;dy:number;resource:Resource};
export default function AshenBattlefield({remote,initialState,onAgain,onExit,learning=true,mobile=false,practice,skirmish=false,playmat=false}:{playmat?:boolean;skirmish?:boolean;practice?:{panel:ReactNode;onChange:(s:Battlefield)=>void};remote?:{choosing?:(value:boolean)=>void;state:Battlefield;seat:0|1;send:(c:AshenCommand)=>void};learning?:boolean;mobile?:boolean;initialState?:Battlefield;onAgain?:()=>void;onExit?:()=>void}={}){
 const [localState,setState]=useState<Battlefield>(()=>initialState||readBattlefield()||newBattlefield(true));
 const state=remote?.state??localState;
 const {muted,toggleSound,unlockSound}=useAshenArenaAudio(state);
 const [localSeat,setLocalSeat]=useState<0|1>(initialState?.table.active||0),[selected,setSelected]=useState<string|null>(null);
 const seat=remote?.seat??localSeat,setSeat=(next:0|1)=>{if(!remote)setLocalSeat(next);};
 const [history,setHistory]=useState<Battlefield[]>([]),[notice,setNotice]=useState(playmat?'Burn Fonts to play a card, or enter Skirmish.':'Play a Ley Font, then Burn it to gain Essence.');
 const [flights,setFlights]=useState<Flight[]>([]),[pile,setPile]=useState<{seat:0|1;zone:string}|null>(null);
 const [attackIds,setAttackIds]=useState<string[]>([]),[blockAttack,setBlockAttack]=useState<string|null>(null);
 const [pendingIds,setPendingIds]=useState<string[]>([]);
 const [expanded,setExpanded]=useState(false),[menuOpen,setMenuOpen]=useState(false);
 const [hovered,setHovered]=useState<string|null>(null),[reference,setReference]=useState<'rules'|'keywords'|null>(null),[viewerOpen,setViewerOpen]=useState(false);
 const [fades,setFades]=useState<{seat:0|1;resources:Resource[]}[]>([]);
 const [assisted,setAssisted]=useState(!!state.rules?.duel);
 const [effectFlow,setEffectFlow]=useState<{program:EffectProgram;context:EffectContext;deploy:boolean;step:number}|null>(null);
 useEffect(()=>{remote?.choosing?.(!!effectFlow);},[Boolean(effectFlow),remote?.choosing]);
 useEffect(()=>{practice?.onChange(state);},[state,practice?.onChange]);
 const arena=useRef<HTMLDivElement>(null),board=useRef<HTMLDivElement>(null),flightId=useRef(0);
 const [learningMode,setLearningMode]=useState(learning);
 const guided=state.rules?.duel;
 const fullscreen=Boolean(guided)||expanded;
 useDuelViewport(fullscreen&&mobile);
 const display=useArenaDisplay(arena,fullscreen);
 const [mobileHelp,setMobileHelp]=useState(false);
 const [phone,setPhone]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(max-width:1100px), (pointer:coarse)').matches);
 useEffect(()=>{const media=window.matchMedia('(max-width:1100px), (pointer:coarse)');const update=()=>setPhone(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 const pending=pendingAshenChoices(state),decision=state.rules?.pending?.flow.steps[0];
 const st=state.table,opponent:0|1=seat===0?1:0;
 const card=selected?st.cards[selected]:undefined;
 const effectDefinition=card?ashenEffects[card.cardId]:undefined;
 const visible=card&&(card.controller===seat||(card.zone!=='hand'&&card.zone!=='deck'&&!card.faceDown));
 useEffect(()=>{if(remote||practice||skirmish)return;try{localStorage.setItem(BATTLEFIELD_KEY,JSON.stringify(state));}catch{setNotice('Browser storage unavailable. Keep this tab open or export the table.');}},[state,!!practice,skirmish]);
 useEffect(()=>{if(!fullscreen)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous;};},[fullscreen]);
 useEffect(()=>{const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){if(reference)setReference(null);else if(menuOpen)setMenuOpen(false);else if(viewerOpen)setViewerOpen(false);else if(effectFlow)setEffectFlow(null);else if(pile)setPile(null);else if(!guided)setExpanded(false);}};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[pile,effectFlow,reference,viewerOpen,guided,menuOpen]);
 useEffect(()=>{
  setAttackIds(ids=>{const next=ids.filter(id=>state.rules?.duel?.combat?.stage==='attack'&&state.table.cards[id]?.zone==='unit'&&state.table.cards[id].controller===state.table.active&&!state.table.cards[id].rotated&&!state.table.cards[id].faceDown);return next.length===ids.length?ids:next;});
  setBlockAttack(id=>id&&state.rules?.duel?.combat?.stage==='block'&&state.rules.duel.combat.attackers.includes(id)&&state.table.cards[id]?.zone==='unit'?id:null);
 },[state]);
 useEffect(()=>{const combat=state.rules?.duel?.combat;if(combat?.stage==='finished')setNotice('Combat resolved. Review the result, then continue to your second main phase.');else if(combat?.stage==='attack')setNotice('Tap highlighted Units to choose your attackers.');else if(combat?.stage==='block')setNotice('Choose an attacker, then a highlighted blocker.');},[state.rules?.duel?.combat?.stage]);
 const choicePlayer=state.rules?.pending?.flow.context.player;
 const completeChoice=(ids:string[])=>{if(choicePlayer!==undefined&&choicePlayer!==String(seat)){setNotice(`Player ${Number(choicePlayer)+1} must make this effect choice.`);return;}if(remote){remote.send({type:'choice',ids});setPendingIds([]);return;}try{const next=guided?resumeBruteDuel(state,ids):resumeAshenEffect(state,ids);setState(next);setPendingIds([]);setNotice(next.table.events.at(-1)||'Effect resolved.');}catch(e){setNotice(e instanceof Error?e.message:String(e));}};
 const runGuided=(fn:(s:Battlefield)=>Battlefield,command?:AshenCommand)=>{if(remote){if(command)remote.send(command);return !!command;}try{const next=fn(state);setHistory(h=>[...h.slice(-29),state]);setState(next);setNotice(next.table.events.at(-1)||'Updated.');return true;}catch(e){setNotice(e instanceof Error?e.message:String(e));return false;}};
 const act=(action:BattlefieldAction)=>{
  try{if(guided){if(action.type==='BURN'){return runGuided(s=>burnInBruteDuel(s,action.instanceId,seat),{type:'burn',id:action.instanceId});}throw Error('Use the card actions and phase buttons to play this duel.');}let next=battlefieldDispatch(state,action);if(assisted&&action.type==='BURN')next=resolveBurnEffect(next,action.instanceId);if(assisted&&action.type==='END_TURN'){for(const zone of ['unit','support'])for(const id of next.table.piles[`${next.table.active}:${zone}`])next.table.cards[id].rotated=false;}setHistory(h=>[...h.slice(-29),state]);setState(next);setNotice(next.table.events.at(-1)||'Updated.');return true;}
  catch(e){setNotice(e instanceof Error?e.message:String(e));return false;}
 };

 const finishEffect=(program:EffectProgram,context:EffectContext,deploy:boolean)=>{if(remote){remote.send({type:'play',source:context.source,context,ability:deploy?undefined:program.id});setEffectFlow(null);return;}try{const next=guided?submitAshenAction(state,context.source,context,deploy?undefined:program.id):resolveAshenEffect(state,program,context,deploy);setHistory(h=>[...h.slice(-29),state]);setState(next);setEffectFlow(null);setNotice(next.table.events.at(-1)||'Effect resolved.');}catch(e){setEffectFlow(null);setNotice(e instanceof Error?e.message:String(e));}};
 const beginEffect=(program:EffectProgram,deploy=false)=>{if(!selected)return;const context={player:String(seat),source:selected};const choices=effectChoices(state,program,context);if(choices.length)setEffectFlow({program,context,deploy,step:0});else finishEffect(program,context,deploy);};
 const deployEffect=()=>{if(!selected)return;try{beginEffect(playProgram(state,selected),true);}catch(e){setNotice(e instanceof Error?e.message:String(e));}};
 const replace=(preview:boolean)=>{setHistory(h=>[...h.slice(-29),state]);setState(newBattlefield(preview));setSelected(null);setPile(null);setFlights([]);setNotice(preview?'Populated layout preview loaded.':'New shuffled table. Opening hands dealt; card effects and costs are manual.');};
 const move=(id:string,to:0|1,zone:string)=>{if(act({type:'MOVE',instanceId:id,seat:to,zone}))setSelected(id);};
 const drop=(e:DragEvent,to:0|1,zone:string)=>{e.preventDefault();const id=e.dataTransfer.getData('application/x-ashen-card');if(st.cards[id])move(id,to,zone);};
 const burn=(id:string)=>{
  const c=st.cards[id];
  const from=board.current?.querySelector(`[data-ashen-card="${id}"]`)?.getBoundingClientRect();
  const to=board.current?.querySelector(`[data-basin="${c.controller}"]`)?.getBoundingClientRect();
  const area=board.current?.getBoundingClientRect();
  if(!act({type:'BURN',instanceId:id}))return;
  if(from&&to&&area){const x=from.left+from.width/2-area.left,y=from.top+from.height/2-area.top;
   setFlights(f=>[...f,{id:++flightId.current,x,y,dx:to.left+to.width/2-area.left-x,dy:to.top+to.height/2-area.top-y,resource:fontEssence(c.cardId)}]);}
 };
 const clickCard=(id:string)=>{setSelected(id);setMenuOpen(true);};
 const effectSteps=effectFlow?effectChoices(state,effectFlow.program,effectFlow.context):[];
 const actionChoice=effectFlow?effectSteps[effectFlow.step]:undefined;
 const fieldZones=['unit','command','support','ley'];
 const onField=(ids:{id:string}[])=>ids.length>0&&ids.every(({id})=>fieldZones.includes(st.cards[id]?.zone));
 const fieldAction=actionChoice&&onField(actionChoice.entities)?actionChoice:undefined;
 const fieldPending=pending?.context.player===String(seat)&&onField(pending.entities)?pending:undefined;
 const fieldChoice=fieldAction||fieldPending;
 const pickActionCard=(id:string)=>{
  if(!effectFlow||!actionChoice)return;
  const {kind,selection}=actionChoice;
  const previous=effectFlow.context[kind]||[];
  const ids=previous.includes(id)?previous.filter(value=>value!==id):[...previous,id];
  const context={...effectFlow.context,[kind]:ids};
  if(ids.length<selection.count)setEffectFlow({...effectFlow,context});
  else if(effectFlow.step+1<effectSteps.length)setEffectFlow({...effectFlow,context,step:effectFlow.step+1});
  else finishEffect(effectFlow.program,context,effectFlow.deploy);
 };
 const pickPendingCard=(id:string)=>{
  const ids=pendingIds.includes(id)?pendingIds.filter(value=>value!==id):[...pendingIds,id];
  if(ids.length===pending?.selection.count)completeChoice(ids);
  else setPendingIds(ids);
 };
 const burnable=guided&&!fieldChoice?readyAshenFonts(state,seat):[];
 const blockDrag=useBlockDrag(state,seat,playmat&&!fieldChoice,(attacker,blocker)=>{runGuided(s=>assignAshenBlocker(s,attacker,blocker),{type:'block',attacker,blocker});},setNotice);
 const renderCard=(id:string,hand=false)=>{
  const legalTarget=!!fieldChoice?.entities.some(entity=>entity.id===id);
  const picked=fieldAction?effectFlow?.context[fieldAction.kind]?.includes(id):pendingIds.includes(id);
  const combat=fieldChoice
   ? {attacking:false,blocking:false,...(legalTarget?{intent:'effect-target' as const,selected:picked,label:picked?'Selected':'Choose target'}:{})}
   : combatCardView(state,id,seat,attackIds,blockAttack);
  const selectAttack=()=>setAttackIds(ids=>ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);
  const choose=()=>{
   if(fieldChoice){if(legalTarget){if(fieldAction)pickActionCard(id);else pickPendingCard(id);}return;}
   if(combat.intent==='attack'){selectAttack();return;}
   if(combat.intent==='target'){setBlockAttack(id);setNotice('Now choose a highlighted blocker. Tap Read to inspect a card.');return;}
   if(combat.intent==='block'){
    const attacker=combat.blockTarget??blockAttack;
    if(attacker)runGuided(s=>assignAshenBlocker(s,attacker,id),{type:'block',attacker,blocker:id});
    return;
   }
   if(combat.intent==='unblock'){runGuided(s=>removeAshenBlocker(s,id),{type:'unblock',blocker:id});return;}
   if(playmat&&burnable.includes(id)&&/^Basic Ley Font/.test(ashenData(state,id)?.subtype||'')){burn(id);return;}
   if(combat.reason)setNotice(combat.reason);clickCard(id);
  };
  return <AshenBattlefieldCard key={id} state={state} id={id} seat={seat} hand={hand} showKeywords={playmat} dragBlocker={blockDrag.eligible(id)} dragTarget={blockDrag.validTarget(id)} selected={selected===id} combat={combat} onClick={choose} onActions={()=>clickCard(id)} onRead={()=>{setSelected(id);setViewerOpen(true);}} onHover={setHovered} onDrag={e=>e.dataTransfer.setData('application/x-ashen-card',id)}/>;
 };
 const zone=(who:0|1,id:string,label:string)=>{
  const pile=st.piles[`${who}:${id}`];
  const ids=id==='ley'?[...pile].sort((a,b)=>Number(st.cards[a].faceDown)-Number(st.cards[b].faceDown)):pile;
  const groups=new Map<string,string[]>();
  for(const cardId of ids){
   const font=st.cards[cardId];
   const key=playmat&&id==='ley'?`${font.faceDown}:${font.rotated}`:cardId;
   const group=groups.get(key);
   if(group)group.push(cardId);
   else groups.set(key,[cardId]);
  }
  return <section className={`ab-zone ab-${id} ${selected&&card?.controller===seat?'ab-droppable':''}`} aria-label={`Player ${who+1} ${label}`} onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,who,id)}>
   <header><span>{label}</span><small>{ids.length} {id==='command'?'':'cards'}</small>{id==='ley'&&who===seat&&burnable.length>0&&<button type="button" title="Burn every Ready Font" className="ab-burn-all" onClick={()=>runGuided(s=>burnAllAshenFonts(s,seat),{type:'burnAll'})}>Burn all ({burnable.length})</button>}</header>
   <div className="ab-card-row">{[...groups.entries()].map(([key,cards])=>cards.length>1?<div className="ab-font-cascade" key={key}>{cards.map(id=>renderCard(id))}</div>:renderCard(cards[0]))}{!ids.length&&<span className="ab-zone-empty">{id==='unit'?'Muster your forces here':id==='ley'?'Your fonts gather here':id==='support'?'Runes & relics in play':'Command Station'}</span>}</div>
   {!guided&&selected&&card?.controller===seat&&card.zone!==id&&<button className="ab-place" onClick={()=>move(selected,who,id)}>Place selected here</button>}
   {id==='command'&&<div className="ab-hp"><button aria-label={`Player ${who+1} lose 1 HP`} disabled={!!guided} onClick={()=>act({type:'HEALTH',seat:who,delta:-1})}>−</button><strong key={st.health[who]} className="ab-hp-value">{st.health[who]} <small>HP</small></strong><button aria-label={`Player ${who+1} gain 1 HP`} disabled={!!guided} onClick={()=>act({type:'HEALTH',seat:who,delta:1})}>+</button></div>}
  </section>;
 };
 const basin=(who:0|1)=><section className="ab-basin" data-basin={who} aria-label={`Player ${who+1} Ley Basin`}>
  <header><span>LEY BASIN</span><small>Essence fades at turn’s end</small></header>
  <ResourcePool label={`Player ${who+1} Ley Basin`} resources={RESOURCES.map(r=>({id:r,label:NAMES[r],icon:`/ashen/costs/${r}.png`,amount:state.basins[who][r]}))}/>
  {!guided&&who===seat&&<details className="ab-manual-essence"><summary>Adjust</summary>{RESOURCES.map(r=><span key={r}>{NAMES[r]}<button disabled={!state.basins[who][r]} onClick={()=>act({type:'ESSENCE',seat:who,resource:r,delta:-1})}>−</button><button onClick={()=>act({type:'ESSENCE',seat:who,resource:r,delta:1})}>+</button></span>)}</details>}
  {fades.filter(f=>f.seat===who).map(f=><span className="ab-dissolve" key={who} aria-hidden="true" onAnimationEnd={()=>setFades(all=>all.filter(i=>i.seat!==who))}>{f.resources.map(r=><img src={`/ashen/costs/${r}.png`} key={r} alt=""/>)}</span>)}
 </section>;
 const piles=(who:0|1)=><div className="ab-piles">
  <button data-ashen-deck={who} className="ab-deck" aria-label={`Draw for Player ${who+1}`} disabled={!!guided||who!==seat||!st.piles[`${who}:deck`].length} onClick={()=>act({type:'DRAW',seat:who})}><span className="ab-card-back"><CardBack/></span><strong>{st.piles[`${who}:deck`].length}</strong><small>DECK · DRAW</small></button>
  {['graveyard','banished'].map(z=><button key={z} data-ashen-pile={`${who}:${z}`} className="ab-pile-button" onClick={()=>setPile({seat:who,zone:z})} onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,who,z)}><span>{z==='graveyard'?'Ossuary':'Banished'}</span><span className="ab-pile-thumb">{(()=>{const top=st.piles[`${who}:${z}`].at(-1),data=top?ashenData(state,top):undefined;return data&&top&&(!st.cards[top].faceDown||st.cards[top].controller===seat)?<AshenCardFrame card={data} size="mini"/>:<span aria-hidden="true">◇</span>;})()}</span><b>{st.piles[`${who}:${z}`].length}</b></button>)}
 </div>;
 const half=(who:0|1)=><section className={`ab-half ${who!==seat?'ab-opponent':'ab-you'} ${ashenData(state,st.piles[`${who}:command`][0])?.faction==='Brute'?'ab-brute':'ab-noble'}`} aria-label={`Player ${who+1} battlefield`}>
  <div className="ab-player"><span>{who===seat?'YOU':'OPPONENT'} · PLAYER {who+1}</span><strong>{ashenData(state,st.piles[`${who}:command`][0])?.faction==='Brute'?'Clan of the Broken Fist':'The Crown’s Might'}</strong><small className="ab-command-marks">Plan {state.rules?.nobleMarks?.[who]?.planned||0} · Refine {state.rules?.nobleMarks?.[who]?.refined||0}</small><b className="ab-player-hp">{st.health[who]} HP</b><em>{st.active===who?'Active player':''}</em>{guided&&basin(who)}</div>
  <div className="ab-half-grid">{zone(who,'command','Command Station')}{zone(who,'support','Runes & Relics')}{zone(who,'ley','Ley Fonts')}{piles(who)}{zone(who,'unit','Frontline')}{!guided&&basin(who)}</div>
 </section>;
 const cardActions:CardMenuAction[]=[{id:'view',label:'View card',run:()=>setViewerOpen(true)}];
 if(menuOpen&&card&&visible&&card.controller===seat){
  if(assisted&&effectDefinition&&card.zone==='hand'){
   const check=guided?inspectAshenAction(state,card.instanceId,seat):{allowed:st.active===seat,reason:'Only the active player can play cards.'};
   cardActions.push({id:'deploy',label:card.type==='Ley Font'?'Play Ley Font':`Play ${card.type}`,disabled:!check.allowed,reason:check.allowed?undefined:check.reason,run:deployEffect});
  }
  if(assisted&&['unit','support','ley'].includes(card.zone))for(const program of availableAshenAbilities(state,card.instanceId)){
   const check=guided?inspectAshenAction(state,card.instanceId,seat,program.id):{allowed:!(program.cost?.exhaust&&(card.rotated||card.faceDown)),reason:'This card is fatigued.'};
   cardActions.push({id:program.id,label:program.label,disabled:!check.allowed,reason:check.allowed?undefined:check.reason,run:()=>beginEffect(program)});
  }
  if(card.type==='Ley Font'&&card.zone==='ley'){
   let reason='';try{if(guided)burnInBruteDuel(state,card.instanceId,seat);else if(card.faceDown||card.rotated)throw Error('This Font is spent.');}catch(e){reason=e instanceof Error?e.message:String(e);}
   cardActions.push({id:'burn',label:`Burn font · +1 ${NAMES[fontEssence(card.cardId)]}`,disabled:!!reason,reason:reason||undefined,run:()=>burn(card.instanceId)});
  }
  if(guided&&seat===st.active&&inspectAshenAttacker(state,card.instanceId).allowed)cardActions.push({id:'select-attacker',label:attackIds.includes(card.instanceId)?'Remove from attackers':'Select as attacker',run:()=>setAttackIds(ids=>ids.includes(card.instanceId)?ids.filter(id=>id!==card.instanceId):[...ids,card.instanceId])});
  if(guided?.combat?.stage==='block'&&!guided.priority&&seat!==st.active&&card.zone==='unit'&&blockAttack){const check=inspectAshenBlocker(state,blockAttack,card.instanceId),allowed=check.allowed;cardActions.push({id:'block',label:`Block ${st.cards[blockAttack]?.name}`,disabled:!allowed,reason:allowed?undefined:check.reason,run:()=>runGuided(s=>assignAshenBlocker(s,blockAttack,card.instanceId),{type:'block',attacker:blockAttack,blocker:card.instanceId})});}
  if(!guided){
   if(card.zone==='hand')cardActions.push({id:'place',label:'Place manually',run:()=>move(card.instanceId,seat,card.type==='Unit'?'unit':card.type==='Ley Font'?'ley':'support')});
   cardActions.push({id:'ready',label:card.rotated?'Ready':'Fatigue',run:()=>act({type:'ROTATE',instanceId:card.instanceId})},{id:'flip',label:card.faceDown?'Turn face-up':'Turn face-down',run:()=>act({type:'FLIP',instanceId:card.instanceId})},{id:'counter',label:'+ Counter',run:()=>act({type:'COUNTER',instanceId:card.instanceId,delta:1})},{id:'uncounter',label:'− Counter',disabled:!card.counters,run:()=>act({type:'COUNTER',instanceId:card.instanceId,delta:-1})});
   if(card.zone!=='hand')cardActions.push({id:'hand',label:'Return to hand',run:()=>move(card.instanceId,seat,'hand')});
   cardActions.push({id:'ossuary',label:'Send to Ossuary',disabled:card.zone==='graveyard',run:()=>move(card.instanceId,seat,'graveyard')});
   if(['ashen-brute-drum-of-the-pit','ashen-brute-warband-of-bloodfire'].includes(card.cardId)){const counter=card.cardId==='ashen-brute-drum-of-the-pit'?'momentum':'fury';for(const delta of [-1,1])cardActions.push({id:`named-${delta}`,label:`${delta>0?'+':'−'} ${counter}`,disabled:delta<0&&!state.rules?.counters?.[card.instanceId]?.[counter],run:()=>act({type:'NAMED_COUNTER',instanceId:card.instanceId,counter,delta})});}
  }
 }
 if(menuOpen&&card&&guided?.combat?.stage==='block'&&seat!==st.active&&card.controller===st.active&&guided.combat.attackers.includes(card.instanceId))cardActions.push({id:'block-target',label:'Choose this attacker to block',run:()=>setBlockAttack(card.instanceId)});
 const toolbarActions=<div className="ab-tools">
   <button disabled={!!remote} onClick={()=>{if(onAgain){onAgain();return;}setState(newBruteDuel());setAssisted(true);setSelected(null);setAttackIds([]);setHistory([]);}}>{skirmish?'Reset skirmish':practice?'Reset lesson':'New AT duel'}</button>{(onExit||guided)&&<button onClick={()=>onExit?onExit():replace(true)}>{skirmish?'Exit skirmish':practice?'Exit practice':'Exit AT duel'}</button>}{!guided&&<><button disabled={!!guided} onClick={()=>setAssisted(a=>!a)} aria-pressed={assisted}>{assisted?'AT effects: ON':'AT effects: OFF'}</button><button onClick={()=>setExpanded(e=>!e)}>{expanded?'Exit full screen':'Expand table'}</button><button onClick={()=>replace(false)}>New table</button><button onClick={()=>replace(true)}>Layout preview</button></>}<button disabled={!!remote} onClick={()=>{setSeat(opponent);setSelected(null);setHovered(null);setPile(null);}}><Eye size={14}/> View P{opponent+1}</button>
   <button disabled={!!remote||!history.length} onClick={()=>{setState(history[history.length-1]);setHistory(h=>h.slice(0,-1));setFlights([]);setSelected(null);setNotice('Previous table restored.');}}><Undo2 size={14}/> Undo</button>
   {!guided&&<><button onClick={()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='ashen-throne-table.json';a.click();URL.revokeObjectURL(url);}}>Export</button>
   <button onClick={()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(ASHEN_EFFECT_PACK,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='ashen-prototype-effects-v1.json';a.click();URL.revokeObjectURL(url);}}>Export AT rules</button></>}{guided&&!practice&&<button aria-pressed={mobile?mobileHelp:learningMode} onClick={()=>mobile?setMobileHelp(v=>!v):setLearningMode(v=>!v)}>{mobile?'Help':learningMode?'Guided: ON':'Guided: OFF'}</button>}{guided&&<button onClick={toggleSound}>Sound {muted?'off':'on'}</button>}<button onClick={()=>setReference('rules')}>Rules</button><button onClick={()=>setReference('keywords')}>Keywords</button>{guided&&<label className="ab-own-response"><input type="checkbox" checked={!!guided.holdResponses?.[seat]} onChange={e=>runGuided(s=>setAshenResponseMode(s,seat,e.target.checked),{type:'responseMode',hold:e.target.checked})}/> Full control<small>Pause for your own cards and responses that need Essence first.</small></label>}{guided&&display.canFullscreen&&<button onClick={()=>void display.enterFullscreen()}>{display.fullscreen?'Exit fullscreen':'Enter fullscreen'}</button>}<button className="ab-viewer-toggle" onClick={()=>setViewerOpen(open=>!open)}>Card viewer</button>
  </div>;
 const battlefield=<div ref={arena} onPointerDownCapture={guided?unlockSound:undefined} onKeyDownCapture={guided?unlockSound:undefined} className={`ab-shell ab-arena ${playmat?'ab-playmat':''} ${fullscreen?'ab-expanded':''} ${practice?'ab-practice':''} ${guided?'ab-duel':''} ${practice||guided&&learningMode?'ab-learning-mode':''} ${viewerOpen?'ab-viewer-open':''} ${mobile?'ab-mobile-duel':''} ${phone&&!mobile?'ab-browser-phone':''}`} data-remote={!!remote} role={guided?'region':undefined} aria-label={practice?'Ashen Throne practice battlefield':guided?'Ashen Throne duel room':undefined}>
  {guided||mobile?<header className="ab-compact-toolbar"><strong>{skirmish?'Ashen Throne · Skirmish':practice?'AT · Practice':'Ashen Throne'}</strong><details className="ab-settings-menu" onKeyDown={event=>{if(event.key==='Escape'){event.currentTarget.open=false;event.currentTarget.querySelector('summary')?.focus();}}}>
   <summary aria-label="Duel settings">⚙</summary><div className="ab-mobile-menu-panel" onClick={event=>{if((event.target as HTMLElement).closest('button')){const details=event.currentTarget.closest('details');if(details)details.open=false;}}}>{toolbarActions}</div>
  </details></header>:  <header className="ab-toolbar"><div><span className="eyebrow">{practice?'ASHEN THRONE · PRACTICE':'ASHEN THRONE · COMMAND SIEGE'}</span><h2>The battlefield</h2><small>{state.preview?'Populated layout preview':'Playtest table'} · {guided?'AT duel · Command Siege rules':assisted?'AT effects sandbox':'Manual effects & costs'}</small></div>{toolbarActions}</header>}
  {practice?<section className="ab-practice-panel">{practice.panel}</section>:guided&&learningMode&&(!mobile||mobileHelp)&&<section className="ab-learning" aria-label="Duel guide" aria-live="polite"><strong>{ashenGuidance(state).title}</strong><span>{ashenGuidance(state).text}</span></section>}
  <div className="ab-workspace"><div className="ab-table" ref={board} {...blockDrag.handlers}>
   {guided&&<><AshenCombatConnections state={state} selected={attackIds} board={board} seat={seat} playmat={playmat} drag={blockDrag.drag}/><AshenCombatFeedback state={state} board={board}/></>}
   <div className="ab-opponent-hand" aria-label={`Opponent hand · ${st.piles[`${opponent}:hand`].length} cards`}>{st.piles[`${opponent}:hand`].map(id=><span className="ab-card-back" data-ashen-card={id} key={id}><CardBack/></span>)}</div>
   {half(opponent)}<div className="ab-center"><small className="ab-turn">Turn {ashenTurnNumber(state)} · Player {st.active+1}{guided?` · ${ashenPhaseName(guided.phase)}`:''}</small><AshenCombatSummary state={state} onInspect={id=>{setSelected(id);setViewerOpen(true);}}/>{fieldChoice&&<div className="ab-field-choice" role="group" aria-label="Choose cards on the battlefield"><strong>{fieldChoice.selection.label}</strong><span>{fieldChoice.selection.min===0?`Choose up to ${fieldChoice.selection.count}.`:`Choose ${fieldChoice.selection.count}.`} Tap highlighted cards.</span>{fieldAction&&<button onClick={()=>setEffectFlow(null)}>Cancel</button>}{fieldPending&&fieldPending.selection.min!==undefined&&fieldPending.selection.min<fieldPending.selection.count&&<button disabled={pendingIds.length<fieldPending.selection.min} onClick={()=>completeChoice(pendingIds)}>Finish selection ({pendingIds.length})</button>}{fieldPending?.selection.optional&&<button onClick={()=>completeChoice([])}>Skip</button>}</div>}<AshenClashQueue state={state} onInspect={playmat?id=>{setSelected(id);setViewerOpen(true);}:clickCard}/>{guided?!fieldChoice&&<AshenPhaseControls state={state} seat={seat} attackIds={attackIds} blockAttack={blockAttack} dragBlocks={playmat} onSeat={remote?undefined:setSeat} onAdvance={phase=>{if(phase==='end')setFades(([0,1] as const).map(who=>({seat:who,resources:RESOURCES.filter(r=>state.basins[who][r]>0)})));runGuided(s=>advanceAshenTo(s,phase),{type:'phase',phase});}} onNext={()=>{if(guided.phase==='main2')setFades(([0,1] as const).map(who=>({seat:who,resources:RESOURCES.filter(r=>state.basins[who][r]>0)})));runGuided(nextAshenPhase,{type:'next'});}} onPass={()=>runGuided(s=>passAshenPriority(s,seat),{type:'pass'})} onSelectAll={()=>setAttackIds(st.piles[`${st.active}:unit`].filter(id=>inspectAshenAttacker(state,id).allowed))} onAttack={()=>{if(runGuided(s=>declareAshenAttackers(s,attackIds),{type:'attack',ids:attackIds}))setAttackIds([]);}} onClearBlockers={()=>runGuided(clearAshenBlockers,{type:'clearBlockers'})} onCombat={()=>runGuided(resolveAshenCombat,{type:'combat'})} onOrder={index=>runGuided(s=>orderAshenTrigger(s,index),{type:'order',index})} onConfirmOrder={()=>runGuided(confirmAshenTriggerOrder,{type:'confirmOrder'})}/>:<button onClick={()=>{act({type:'END_TURN'});setSelected(null);}}>End turn <ChevronRight size={14}/></button>}</div>{half(seat)}
   {flights.map(f=><span key={f.id} className={`ab-essence-flight ab-${f.resource}`} style={{left:f.x,top:f.y,'--flight-x':`${f.dx}px`,'--flight-y':`${f.dy}px`} as CSSProperties} onAnimationEnd={()=>setFlights(all=>all.filter(i=>i.id!==f.id))}><img src={`/ashen/costs/${f.resource}.png`} alt=""/></span>)}
  </div><AshenCardInspector state={state} id={hovered||selected||undefined} seat={seat} onClose={()=>setViewerOpen(false)}/></div>
  <section className="ab-hand" aria-label="Your hand"><header><strong>YOUR HAND <small>{st.piles[`${seat}:hand`].length} cards</small></strong><span>Player {seat+1} · {ashenData(state,st.piles[`${seat}:command`][0])?.faction}</span><button disabled={!!guided} onClick={()=>act({type:'DRAW',seat})}>Draw card</button></header><div className="ab-hand-cards">{st.piles[`${seat}:hand`].map(id=>renderCard(id,true))}</div></section>
  {viewerOpen&&<button className="ab-viewer-scrim" aria-label="Close card viewer" onClick={()=>setViewerOpen(false)}/>}
  <p className="ab-notice" role="status">{display.displayNotice||notice}</p><p className="ab-footnote">{skirmish?'Skirmish preview':'Your duel is saved on this device.'}</p>
  {assisted&&!guided&&<p className="ab-effect-banner">Effects sandbox: click a card and choose its play action for cards in the first AT prototype. Printed essence costs and deployment fatigue are applied. Manual moves bypass rules. Clash timing, combat, and unlisted effects are not automated.</p>}
  {guided&&<AshenOpeningHands state={state} seat={seat} onSeat={remote?undefined:setSeat} onChoice={choice=>{if(runGuided(s=>chooseAshenOpening(s,seat,choice),{type:'opening',choice})){setHistory([]);setSelected(null);setHovered(null);setMenuOpen(false);}}}/>}
  <AshenEffectNotices events={st.events}/>
  <AshenCardAnimations key={`motions-${seat}`} state={state} seat={seat} board={board}/>
  {menuOpen&&card&&<CardActionMenu details={<div className="ab-action-reading"><AshenCardReading state={state} id={card.instanceId} seat={seat}/></div>} title={visible?card.name:'Face-down card'} actions={cardActions} onClose={()=>setMenuOpen(false)}/>}
  {reference&&<AshenReference kind={reference} onClose={()=>setReference(null)}/>}
  {guided?.winner!==undefined&&<div className="ab-modal-backdrop"><section className="ab-pile-dialog" role="dialog" aria-modal="true" aria-label="Duel result"><h3>{guided.winner==='draw'?'Duel drawn':`Player ${guided.winner+1} wins`}</h3><button disabled={!!remote} onClick={()=>{if(onAgain){onAgain();return;}setState(newBruteDuel());setSelected(null);setHistory([]);}}>Play again</button><button onClick={()=>onExit?onExit():replace(true)}>Exit duel</button></section></div>}
  {guided?.callPermission==='choose'&&(!remote||st.active===seat)&&<div className="ab-modal-backdrop"><section className="ab-pile-dialog" role="dialog" aria-modal="true" aria-label="Korgath’s Call"><h3>Play Korgath from hand or Ossuary</h3><p>Play him from your hand or Ossuary for free. He enters with Charge and +3 Attack this turn.</p>{korgathCallChoices(state).map(id=><button key={id} onClick={()=>runGuided(s=>chooseKorgathForCall(s,id),{type:'call',id})}>{st.cards[id].name} · {st.cards[id].zone==='graveyard'?'Ossuary':st.cards[id].zone}</button>)}<button onClick={()=>runGuided(s=>chooseKorgathForCall(s,null),{type:'call',id:null})}>No · skip playing Korgath</button></section></div>}
  {choicePlayer!==undefined&&choicePlayer!==String(seat)&&<div className="ab-choice-wait" role="status"><strong>Player {Number(choicePlayer)+1} chooses for {st.cards[state.rules!.pending!.flow.context.source]?.name||state.rules!.pending!.label}.</strong>{!remote&&<button onClick={()=>setSeat(Number(choicePlayer) as 0|1)}>Play Player {Number(choicePlayer)+1}</button>}</div>}
  {choicePlayer===String(seat)&&decision&&(decision.op==='plan'||decision.op==='mode')&&<AshenEffectDecision key={`${state.rules?.turn}:${state.rules?.pending?.flow.context.source}:${state.rules?.pending?.flow.budget}`} state={state} onChoose={completeChoice}/>}
  {pending&&!fieldPending&&pending.context.player===String(seat)&&<div className="ab-modal-backdrop"><section className="ab-pile-dialog ab-effect-choice" role="dialog" aria-modal="true" aria-label={pending.selection.label}><header><h3>{pending.selection.label}</h3><small>Player {Number(pending.context.player)+1} · {st.cards[pending.context.source]?.name||state.rules?.pending?.label}</small></header><p><strong>{state.rules?.pending?.label}</strong><br/>Choose {pending.selection.min===0?'up to ':''}{pending.selection.count} card{pending.selection.count===1?'':'s'} to continue.</p>{state.rules?.pending?.flow.events.some(e=>e.kind==='drawn')&&<p className="ab-drawn-summary">Just drawn: {state.rules.pending.flow.events.filter(e=>e.kind==='drawn').map(e=>st.cards[e.entity!.id]?.name).join(', ')}</p>}<div>{pending.entities.map(entity=>{const d=ashenData(state,entity.id);return <button className="ab-choice-card" aria-pressed={pendingIds.includes(entity.id)} key={entity.id} onClick={()=>pickPendingCard(entity.id)}>{d&&<AshenCardFrame card={d} size="mini"/>}<strong>{st.cards[entity.id]?.name||guided?.stack.find(e=>e.key===entity.id)?.program.label||entity.type}</strong><small>Player {Number(entity.controller)+1}{st.cards[entity.id]?.zone==='command'?` · Command Station · ${st.health[Number(entity.controller)]} HP`:''}</small></button>;})}</div>{pending.selection.min!==undefined&&pending.selection.min<pending.selection.count&&<button disabled={pendingIds.length<pending.selection.min} onClick={()=>completeChoice(pendingIds)}>Finish selection ({pendingIds.length})</button>}{pending.selection.optional&&<button onClick={()=>completeChoice([])}>{state.rules?.pending?.flow.steps[0].op==='choose'&&state.rules.pending.flow.steps[0].shuffle?'Finish search without selecting · shuffle deck':'No · skip optional effect'}</button>}{!pending.entities.length&&!pending.selection.optional&&<p>No legal cards remain.</p>}{history.length>0&&<button onClick={()=>{setState(history[history.length-1]);setHistory(h=>h.slice(0,-1));setPendingIds([]);setNotice('Effect undone.');}}>Undo effect · restore previous table</button>}</section></div>}
  {effectFlow&&!fieldAction&&(()=>{const choice=actionChoice;if(!choice)return null;return <div className="ab-modal-backdrop"><section className="ab-pile-dialog" role="dialog" aria-modal="true" aria-label={choice.selection.label}><header><h3>{choice.selection.label}</h3><button autoFocus onClick={()=>setEffectFlow(null)}>Cancel</button></header><p>Choose {choice.selection.count} card{choice.selection.count===1?'':'s'}. No costs are paid until all selections are complete.</p><div>{choice.entities.length?choice.entities.map(entity=><button key={entity.id} onClick={()=>pickActionCard(entity.id)}>{effectFlow.context[choice.kind]?.includes(entity.id)?'✓ ':''}{st.cards[entity.id]?.name} · Player {Number(entity.controller)+1}</button>):<p>No legal choices. Cancel to return to the table.</p>}</div></section></div>;})()}
  {pile&&<div className="ab-modal-backdrop" onClick={()=>setPile(null)}><section className="ab-pile-dialog" role="dialog" aria-modal="true" aria-label={`Player ${pile.seat+1} ${pile.zone==='graveyard'?'Ossuary':pile.zone}`} onClick={e=>e.stopPropagation()}><header><h3>Player {pile.seat+1} · {pile.zone==='graveyard'?'Ossuary':'Banished'}</h3><button autoFocus onClick={()=>setPile(null)}>Close</button></header><div>{st.piles[`${pile.seat}:${pile.zone}`].length?st.piles[`${pile.seat}:${pile.zone}`].map(id=><button key={id} onClick={()=>{setPile(null);clickCard(id);}}>{playmat&&(st.cards[id].controller===seat||!st.cards[id].faceDown)&&ashenData(state,id)&&<AshenCardFrame card={ashenData(state,id)!} size="mini"/>}{st.cards[id].controller===seat||!st.cards[id].faceDown?st.cards[id].name:'Face-down card'}</button>):<p>No cards here.</p>}</div></section></div>}
 </div>;
 return guided?createPortal(battlefield,document.body):battlefield;
}
