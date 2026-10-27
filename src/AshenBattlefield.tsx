import AshenOpeningHands from './AshenOpeningHands';
import {useDuelViewport} from './duelUi/useDuelViewport';
import CardBack from './duelUi/CardBack';
import AshenStatBreakdown from './AshenStatBreakdown';
import AshenCommandCost from './AshenCommandCost';
import AshenEffectNotices from './AshenEffectNotices';
import AshenCardAnimations from './AshenCardAnimations';
import CardActionMenu,{type CardMenuAction} from './duelUi/CardActionMenu';
import ResourcePool from './duelUi/ResourcePool';
import AshenPhaseControls from './AshenPhaseControls';
import RulesText from './RulesText';
import type {AshenCommand} from './matches/ashenCommands';
import {createPortal} from 'react-dom';
import AshenReference from './AshenReference';
import {ashenGuidance,ashenPhaseName} from './ashenGuidance';
import {useEffect,useRef,useState,type CSSProperties,type DragEvent} from 'react';
import {Eye,ChevronRight,Undo2,Swords} from 'lucide-react';
import AshenCardFrame from './AshenCardFrame';
import AshenEffectDecision from './AshenEffectDecision';
import {RESOURCES,rulesForCard,type Resource} from './ashenPresentation';
import {BATTLEFIELD_KEY,ashenTurnNumber,battlefieldDispatch,fontEssence,newBattlefield,readBattlefield,type Battlefield,type BattlefieldAction} from './ashenBattlefieldState';
import './ashenBattlefield.css';
import './ashenDuelRoom.css';
import {ashenEffects,ASHEN_EFFECT_PACK} from './games/ashen/effectPacks';
import {ashenData,ashenStats,effectChoices,playProgram,resolveAshenEffect,resolveBurnEffect,availableAshenAbilities,pendingAshenChoices,resumeAshenEffect} from './games/ashen/adapter';
import {chooseAshenOpening,advanceAshenTo,inspectAshenAction,canBlockAshen,confirmAshenTriggerOrder,orderAshenTrigger,newBruteDuel,submitAshenAction,resumeBruteDuel,burnInBruteDuel,nextAshenPhase,passAshenPriority,declareAshenAttackers,assignAshenBlocker,clearAshenBlockers,resolveAshenCombat,korgathCallChoices,chooseKorgathForCall} from './games/ashen/duel';
import type {EffectProgram,EffectContext} from './framework';

const NAMES:Record<Resource,string>={untuned:'Untuned',oath:'Oath',fury:'Fury',ash:'Ash',veil:'Veil'};
type Flight={id:number;x:number;y:number;dx:number;dy:number;resource:Resource};
export default function AshenBattlefield({remote,initialState,onAgain,onExit,learning=true,mobile=false}:{remote?:{choosing?:(value:boolean)=>void;state:Battlefield;seat:0|1;send:(c:AshenCommand)=>void};learning?:boolean;mobile?:boolean;initialState?:Battlefield;onAgain?:()=>void;onExit?:()=>void}={}){
 const [localState,setState]=useState<Battlefield>(()=>initialState||readBattlefield()||newBattlefield(true));
 const state=remote?.state??localState;
 const [localSeat,setLocalSeat]=useState<0|1>(initialState?.table.active||0),[selected,setSelected]=useState<string|null>(null);
 const seat=remote?.seat??localSeat,setSeat=(next:0|1)=>{if(!remote)setLocalSeat(next);};
 const [history,setHistory]=useState<Battlefield[]>([]),[notice,setNotice]=useState('Select a font and burn it to send essence into your Ley Basin.');
 const [flights,setFlights]=useState<Flight[]>([]),[pile,setPile]=useState<{seat:0|1;zone:string}|null>(null);
 const [attackIds,setAttackIds]=useState<string[]>([]),[blockAttack,setBlockAttack]=useState<string|null>(null);
 const [pendingIds,setPendingIds]=useState<string[]>([]);
 const [expanded,setExpanded]=useState(false),[menuOpen,setMenuOpen]=useState(false);
 const [hovered,setHovered]=useState<string|null>(null),[reference,setReference]=useState<'rules'|'keywords'|'walkthrough'|null>(null),[viewerOpen,setViewerOpen]=useState(false);
 const [fades,setFades]=useState<{seat:0|1;resources:Resource[]}[]>([]);
 const [assisted,setAssisted]=useState(!!state.rules?.duel);
 const [effectFlow,setEffectFlow]=useState<{program:EffectProgram;context:EffectContext;deploy:boolean;step:number}|null>(null);
 useEffect(()=>{remote?.choosing?.(!!effectFlow);},[Boolean(effectFlow),remote?.choosing]);
 const board=useRef<HTMLDivElement>(null),flightId=useRef(0);
 const [learningMode,setLearningMode]=useState(learning);
 const guided=state.rules?.duel;
 const fullscreen=Boolean(guided)||expanded;
 useDuelViewport(fullscreen&&mobile);
 const [mobileHelp,setMobileHelp]=useState(false);
 const pending=pendingAshenChoices(state),decision=state.rules?.pending?.flow.steps[0];
 const st=state.table,opponent:0|1=seat===0?1:0;
 const card=selected?st.cards[selected]:undefined;
 const viewCard=st.cards[hovered||selected||''];
 const viewData=viewCard?ashenData(state,viewCard.instanceId):undefined;
 const viewVisible=viewCard&&(viewCard.controller===seat||(!['hand','deck'].includes(viewCard.zone)&&!viewCard.faceDown));
 const effectDefinition=card?ashenEffects[card.cardId]:undefined;
 const visible=card&&(card.controller===seat||(card.zone!=='hand'&&card.zone!=='deck'&&!card.faceDown));
 useEffect(()=>{if(remote)return;try{localStorage.setItem(BATTLEFIELD_KEY,JSON.stringify(state));}catch{setNotice('Browser storage unavailable. Keep this tab open or export the table.');}},[state]);
 useEffect(()=>{if(!fullscreen)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous;};},[fullscreen]);
 useEffect(()=>{const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){if(reference)setReference(null);else if(menuOpen)setMenuOpen(false);else if(viewerOpen)setViewerOpen(false);else if(effectFlow)setEffectFlow(null);else if(pile)setPile(null);else if(!guided)setExpanded(false);}};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[pile,effectFlow,reference,viewerOpen,guided,menuOpen]);
 const choicePlayer=state.rules?.pending?.flow.context.player;
 const completeChoice=(ids:string[])=>{if(choicePlayer!==undefined&&choicePlayer!==String(seat)){setNotice(`Player ${Number(choicePlayer)+1} must make this effect choice.`);return;}if(remote){remote.send({type:'choice',ids});setPendingIds([]);return;}try{const next=guided?resumeBruteDuel(state,ids):resumeAshenEffect(state,ids);setState(next);setPendingIds([]);setNotice(next.table.events.at(-1)||'Effect resolved.');}catch(e){setNotice(e instanceof Error?e.message:String(e));}};
 const runGuided=(fn:(s:Battlefield)=>Battlefield,command?:AshenCommand)=>{if(remote){if(command)remote.send(command);return !!command;}try{const next=fn(state);setHistory(h=>[...h.slice(-29),state]);setState(next);setNotice(next.table.events.at(-1)||'Updated.');return true;}catch(e){setNotice(e instanceof Error?e.message:String(e));return false;}};
 const act=(action:BattlefieldAction)=>{
  try{if(guided){if(action.type==='BURN'){return runGuided(s=>burnInBruteDuel(s,action.instanceId,seat),{type:'burn',id:action.instanceId});}throw Error('Manual controls are disabled in a AT duel. Use the phase and card controls.');}let next=battlefieldDispatch(state,action);if(assisted&&action.type==='BURN')next=resolveBurnEffect(next,action.instanceId);if(assisted&&action.type==='END_TURN'){for(const zone of ['unit','support'])for(const id of next.table.piles[`${next.table.active}:${zone}`])next.table.cards[id].rotated=false;}setHistory(h=>[...h.slice(-29),state]);setState(next);setNotice(next.table.events.at(-1)||'Updated.');return true;}
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
 const renderCard=(id:string,hand=false)=>{
  const c=st.cards[id],known=c.controller===seat||(c.zone!=='hand'&&!c.faceDown),face=known&&!c.faceDown;
  const d=ashenData(state,id),label=known?c.name:'Face-down card';
  return <div className="ab-card-wrap" key={id}>
   <button type="button" className={`ab-card ${c.controller!==seat&&!hand?'ab-opposing':''} ${c.rotated?'ab-fatigued':''} ${c.zone==='ley'&&c.faceDown?'ab-font-spent':''} ${selected===id||attackIds.includes(id)?'ab-selected':''}`} data-ashen-card={id} aria-label={`${label}${c.zone==='ley'&&c.faceDown?' · spent':''}`} title={label} draggable={!guided&&c.controller===seat} onDragStart={e=>e.dataTransfer.setData('application/x-ashen-card',id)} onMouseEnter={()=>setHovered(id)} onMouseLeave={()=>setHovered(null)} onFocus={()=>setHovered(id)} onBlur={()=>setHovered(null)} onClick={()=>clickCard(id)} onContextMenu={e=>{e.preventDefault();clickCard(id);}}>
    <span className="ab-card-face">{face&&d?<AshenCardFrame card={d} size="mini"/>:<span className="ab-card-back"><CardBack/></span>}</span>
    {['unit','support'].includes(c.zone)&&c.rotated&&<span className="ab-fatigue-counter" aria-label="1 Fatigue counter">F</span>}{c.counters>0&&<span className="ab-counter">+{c.counters}</span>}{Object.entries(state.rules?.counters?.[id]||{}).filter(([,n])=>n>0).map(([name,n])=><span className="ab-counter" key={name}>{name}: {n}</span>)}
    {c.zone==='unit'&&known&&<span className="ab-stat-chip">{ashenStats(state,id).attack}/{ashenStats(state,id).defense}{ashenStats(state,id).damage?` · ${ashenStats(state,id).damage} dmg`:''}</span>}
    {c.zone==='ley'&&c.faceDown&&<span className="ab-spent">Spent</span>}
   </button>

   {hand&&c.controller===seat&&<AshenCommandCost state={state} id={id} compact/>}
  </div>;
 };
 const zone=(who:0|1,id:string,label:string)=>{
  const ids=st.piles[`${who}:${id}`];
  return <section className={`ab-zone ab-${id} ${selected&&card?.controller===seat?'ab-droppable':''}`} aria-label={`Player ${who+1} ${label}`} onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,who,id)}>
   <header><span>{label}</span><small>{ids.length} {id==='command'?'':'· unlimited'}</small></header>
   <div className="ab-card-row">{ids.map(id=>renderCard(id))}{!ids.length&&<span className="ab-zone-empty">{id==='unit'?'Muster your forces here':id==='ley'?'Your fonts gather here':id==='support'?'Runes & relics in play':'Command Station'}</span>}</div>
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
  <div className="ab-player"><span>{who===seat?'YOU':'OPPONENT'} · PLAYER {who+1}</span><strong>{ashenData(state,st.piles[`${who}:command`][0])?.faction==='Brute'?'Clan of the Broken Fist':'The Crown’s Might'}</strong><small className="ab-command-marks">Plan {state.rules?.nobleMarks?.[who]?.planned||0} · Refine {state.rules?.nobleMarks?.[who]?.refined||0}</small><b className="ab-player-hp">{st.health[who]} HP</b><em>{st.active===who?'Active player':''}</em></div>
  <div className="ab-half-grid">{zone(who,'command','Command Station')}{zone(who,'support','Runes & Relics')}{zone(who,'ley','Ley Fonts')}{piles(who)}{zone(who,'unit','Frontline')}{basin(who)}</div>
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
  if(guided?.phase==='combat'&&guided.combat?.stage==='attack'&&!guided.priority&&seat===st.active&&card.zone==='unit'&&!card.rotated&&!card.faceDown)cardActions.push({id:'select-attacker',label:attackIds.includes(card.instanceId)?'Remove from attackers':'Select as attacker',run:()=>setAttackIds(ids=>ids.includes(card.instanceId)?ids.filter(id=>id!==card.instanceId):[...ids,card.instanceId])});
  if(guided?.combat?.stage==='block'&&!guided.priority&&seat!==st.active&&card.zone==='unit'&&blockAttack){const allowed=canBlockAshen(state,blockAttack,card.instanceId);cardActions.push({id:'block',label:`Block ${st.cards[blockAttack]?.name}`,disabled:!allowed,reason:allowed?undefined:'This Unit cannot block that attacker.',run:()=>runGuided(s=>assignAshenBlocker(s,blockAttack,card.instanceId),{type:'block',attacker:blockAttack,blocker:card.instanceId})});}
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
   <button disabled={!!remote} onClick={()=>{if(onAgain){onAgain();return;}setState(newBruteDuel());setAssisted(true);setSelected(null);setAttackIds([]);setHistory([]);}}>New AT duel</button>{(onExit||guided)&&<button onClick={()=>onExit?onExit():replace(true)}>Exit AT duel</button>}{!guided&&<><button disabled={!!guided} onClick={()=>setAssisted(a=>!a)} aria-pressed={assisted}>{assisted?'AT effects: ON':'AT effects: OFF'}</button><button onClick={()=>setExpanded(e=>!e)}>{expanded?'Exit full screen':'Expand table'}</button><button onClick={()=>replace(false)}>New table</button><button onClick={()=>replace(true)}>Layout preview</button></>}<button disabled={!!remote} onClick={()=>{setSeat(opponent);setSelected(null);setHovered(null);setPile(null);}}><Eye size={14}/> View P{opponent+1}</button>
   <button disabled={!!remote||!history.length} onClick={()=>{setState(history[history.length-1]);setHistory(h=>h.slice(0,-1));setFlights([]);setSelected(null);setNotice('Previous table restored.');}}><Undo2 size={14}/> Undo</button>
   {!guided&&<><button onClick={()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='ashen-throne-table.json';a.click();URL.revokeObjectURL(url);}}>Export</button>
   <button onClick={()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(ASHEN_EFFECT_PACK,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='ashen-prototype-effects-v1.json';a.click();URL.revokeObjectURL(url);}}>Export AT rules</button></>}{guided&&<button aria-pressed={mobile?mobileHelp:learningMode} onClick={()=>mobile?setMobileHelp(v=>!v):setLearningMode(v=>!v)}>{mobile?'Help':learningMode?'Guided: ON':'Guided: OFF'}</button>}<button onClick={()=>setReference('walkthrough')}>Walkthrough</button><button onClick={()=>setReference('rules')}>Rules</button><button onClick={()=>setReference('keywords')}>Keywords</button><button className="ab-viewer-toggle" onClick={()=>setViewerOpen(open=>!open)}>Card viewer</button>
  </div>;
 const battlefield=<div className={`ab-shell ${fullscreen?'ab-expanded':''} ${guided?'ab-duel':''} ${guided&&learningMode?'ab-learning-mode':''} ${viewerOpen?'ab-viewer-open':''} ${mobile?'ab-mobile-duel':''}`} data-remote={!!remote} role={guided?'region':undefined} aria-label={guided?'Ashen Throne duel room':undefined}>
  {mobile?<details className="ab-mobile-menu" onKeyDown={event=>{if(event.key==='Escape'){event.currentTarget.open=false;event.currentTarget.querySelector('summary')?.focus();}}}>
   <summary aria-label="Duel menu">☰</summary><div className="ab-mobile-menu-panel" onClick={event=>{if((event.target as HTMLElement).closest('button')){const details=event.currentTarget.closest('details');if(details)details.open=false;}}}>{toolbarActions}</div>
  </details>:  <header className="ab-toolbar"><div><span className="eyebrow">ASHEN THRONE · COMMAND SIEGE</span><h2>The battlefield</h2><small>{state.preview?'Populated layout preview':'Playtest table'} · {guided?'AT duel · Command Siege rules':assisted?'AT effects sandbox':'Manual effects & costs'}</small></div>{toolbarActions}</header>}
  {guided&&learningMode&&(!mobile||mobileHelp)&&<section className="ab-learning" aria-label="Duel guide" aria-live="polite"><strong>{ashenGuidance(state).title}</strong><span>{ashenGuidance(state).text}</span></section>}
  <div className="ab-workspace"><div className="ab-table" ref={board}>
   <div className="ab-opponent-hand" aria-label={`Opponent hand · ${st.piles[`${opponent}:hand`].length} cards`}>{st.piles[`${opponent}:hand`].map(id=><span className="ab-card-back" data-ashen-card={id} key={id}><CardBack/></span>)}</div>
   {half(opponent)}<div className="ab-center"><small>Turn {ashenTurnNumber(state)} · Player {st.active+1}{guided?` · ${ashenPhaseName(guided.phase)}`:''}</small>{guided?<AshenPhaseControls state={state} seat={seat} attackIds={attackIds} blockAttack={blockAttack} onSeat={remote?undefined:setSeat} onAdvance={phase=>{if(phase==='end')setFades(([0,1] as const).map(who=>({seat:who,resources:RESOURCES.filter(r=>state.basins[who][r]>0)})));runGuided(s=>advanceAshenTo(s,phase),{type:'phase',phase});}} onNext={()=>{if(guided.phase==='main2')setFades(([0,1] as const).map(who=>({seat:who,resources:RESOURCES.filter(r=>state.basins[who][r]>0)})));runGuided(nextAshenPhase,{type:'next'});}} onPass={()=>runGuided(s=>passAshenPriority(s,seat),{type:'pass'})} onSelectAll={()=>setAttackIds(st.piles[`${st.active}:unit`].filter(id=>!st.cards[id].rotated&&!st.cards[id].faceDown))} onAttack={()=>{if(runGuided(s=>declareAshenAttackers(s,attackIds),{type:'attack',ids:attackIds}))setAttackIds([]);}} onClearBlockers={()=>runGuided(clearAshenBlockers,{type:'clearBlockers'})} onCombat={()=>runGuided(resolveAshenCombat,{type:'combat'})} onOrder={index=>runGuided(s=>orderAshenTrigger(s,index),{type:'order',index})} onConfirmOrder={()=>runGuided(confirmAshenTriggerOrder,{type:'confirmOrder'})}/>:<button onClick={()=>{act({type:'END_TURN'});setSelected(null);}}>End turn <ChevronRight size={14}/></button>}</div>{half(seat)}
   {flights.map(f=><span key={f.id} className={`ab-essence-flight ab-${f.resource}`} style={{left:f.x,top:f.y,'--flight-x':`${f.dx}px`,'--flight-y':`${f.dy}px`} as CSSProperties} onAnimationEnd={()=>setFlights(all=>all.filter(i=>i.id!==f.id))}><img src={`/ashen/costs/${f.resource}.png`} alt=""/></span>)}
  </div><aside className="ab-inspector" aria-label="Card viewer"><button className="ab-viewer-close" onClick={()=>setViewerOpen(false)}>Close card viewer ✕</button><span className="eyebrow">CARD VIEWER</span>{viewVisible&&viewData?<><div className="ab-view-art"><AshenCardFrame card={viewData}/></div><h3>{viewData.name}</h3><p>{viewData.type} · Player {viewCard!.controller+1}</p><AshenCommandCost state={state} id={viewCard!.instanceId}/><AshenStatBreakdown state={state} id={viewCard!.instanceId}/><p className="ab-rules"><RulesText text={rulesForCard(viewData).text}/></p></>:<div className="ab-inspect-empty"><Swords size={32}/><h3>{viewCard?'Face-down card':'Card viewer'}</h3><p>Hover over a card to read it. Click or tap for actions. On phones, choose View card to read the full text.</p></div>}
   {viewVisible&&viewCard&&<div className="ab-effect-coverage"><strong>{ashenEffects[viewCard.cardId]?'Automatic effects available':'Resolve this card manually'}</strong>{viewCard.type==='Unit'&&<p>Keywords: {ashenStats(state,viewCard.instanceId).keywords.join(', ')||'none'} · {ashenStats(state,viewCard.instanceId).attack}A / {ashenStats(state,viewCard.instanceId).defense}D · {ashenStats(state,viewCard.instanceId).damage} damage</p>}</div>}
   <details className="ab-history"><summary>Table history</summary>{st.events.slice(-15).map((e,i)=><p key={i}>{e.replace(/graveyard/gi,'Ossuary').replace(/\bDiscard\b/g,'Send to Ossuary')}</p>)}</details>
  </aside></div>
  <section className="ab-hand" aria-label="Your hand"><header><strong>YOUR HAND <small>{st.piles[`${seat}:hand`].length} cards</small></strong><span>Player {seat+1} · {ashenData(state,st.piles[`${seat}:command`][0])?.faction}</span><button disabled={!!guided} onClick={()=>act({type:'DRAW',seat})}>Draw card</button></header><div className="ab-hand-cards">{st.piles[`${seat}:hand`].map(id=>renderCard(id,true))}</div></section>
  {viewerOpen&&<button className="ab-viewer-scrim" aria-label="Close card viewer" onClick={()=>setViewerOpen(false)}/>}
  <p className="ab-notice" role="status">{notice}</p><p className="ab-footnote">Saves in this browser. Manual controls bypass rules. Start a New AT duel for phases, Clash responses and combat. Manual table controls bypass rules.</p>
  {assisted&&!guided&&<p className="ab-effect-banner">Effects sandbox: click a card and choose its play action for cards in the first AT prototype. Printed essence costs and deployment fatigue are applied. Manual moves bypass rules. Clash timing, combat, and unlisted effects are not automated.</p>}
  {guided&&<AshenOpeningHands state={state} seat={seat} onSeat={remote?undefined:setSeat} onChoice={choice=>{if(runGuided(s=>chooseAshenOpening(s,seat,choice),{type:'opening',choice})){setHistory([]);setSelected(null);setHovered(null);setMenuOpen(false);}}}/>}
  <AshenEffectNotices events={st.events}/>
  <AshenCardAnimations key={`motions-${seat}`} state={state} seat={seat} board={board}/>
  {menuOpen&&card&&<CardActionMenu details={<AshenCommandCost state={state} id={card.instanceId}/>} title={visible?card.name:'Face-down card'} actions={cardActions} onClose={()=>setMenuOpen(false)}/>}
  {reference&&<AshenReference kind={reference} onClose={()=>setReference(null)}/>}
  {guided?.winner!==undefined&&<div className="ab-modal-backdrop"><section className="ab-pile-dialog" role="dialog" aria-modal="true" aria-label="Duel result"><h3>{guided.winner==='draw'?'Duel drawn':`Player ${guided.winner+1} wins`}</h3><button disabled={!!remote} onClick={()=>{if(onAgain){onAgain();return;}setState(newBruteDuel());setSelected(null);setHistory([]);}}>Play again</button><button onClick={()=>onExit?onExit():replace(true)}>Exit duel</button></section></div>}
  {guided?.callPermission==='choose'&&(!remote||st.active===seat)&&<div className="ab-modal-backdrop"><section className="ab-pile-dialog" role="dialog" aria-modal="true" aria-label="Korgath’s Call"><h3>Play Korgath from hand or Ossuary</h3><p>Play him from your hand or Ossuary for free. He enters with Charge and +3 Attack this turn.</p>{korgathCallChoices(state).map(id=><button key={id} onClick={()=>runGuided(s=>chooseKorgathForCall(s,id),{type:'call',id})}>{st.cards[id].name} · {st.cards[id].zone==='graveyard'?'Ossuary':st.cards[id].zone}</button>)}<button onClick={()=>runGuided(s=>chooseKorgathForCall(s,null),{type:'call',id:null})}>No · skip playing Korgath</button></section></div>}
  {choicePlayer!==undefined&&choicePlayer!==String(seat)&&<div className="ab-choice-wait" role="status"><strong>Player {Number(choicePlayer)+1} chooses for {st.cards[state.rules!.pending!.flow.context.source]?.name||state.rules!.pending!.label}.</strong>{!remote&&<button onClick={()=>setSeat(Number(choicePlayer) as 0|1)}>Play Player {Number(choicePlayer)+1}</button>}</div>}
  {choicePlayer===String(seat)&&decision&&(decision.op==='plan'||decision.op==='mode')&&<AshenEffectDecision key={`${state.rules?.turn}:${state.rules?.pending?.flow.context.source}:${state.rules?.pending?.flow.budget}`} state={state} onChoose={completeChoice}/>}
  {pending&&pending.context.player===String(seat)&&<div className="ab-modal-backdrop"><section className="ab-pile-dialog ab-effect-choice" role="dialog" aria-modal="true" aria-label={pending.selection.label}><header><h3>{pending.selection.label}</h3><small>Player {Number(pending.context.player)+1} · {st.cards[pending.context.source]?.name||state.rules?.pending?.label}</small></header><p><strong>{state.rules?.pending?.label}</strong><br/>Choose {pending.selection.count} card{pending.selection.count===1?'':'s'} to continue.</p>{state.rules?.pending?.flow.events.some(e=>e.kind==='drawn')&&<p className="ab-drawn-summary">Just drawn: {state.rules.pending.flow.events.filter(e=>e.kind==='drawn').map(e=>st.cards[e.entity!.id]?.name).join(', ')}</p>}<div>{pending.entities.map(entity=>{const d=ashenData(state,entity.id);return <button className="ab-choice-card" aria-pressed={pendingIds.includes(entity.id)} key={entity.id} onClick={()=>{const ids=pendingIds.includes(entity.id)?pendingIds.filter(id=>id!==entity.id):[...pendingIds,entity.id];if(ids.length===pending.selection.count)completeChoice(ids);else setPendingIds(ids);}}>{d&&<AshenCardFrame card={d} size="mini"/>}<strong>{st.cards[entity.id]?.name||guided?.stack.find(e=>e.key===entity.id)?.program.label||entity.type}</strong><small>Player {Number(entity.controller)+1}{st.cards[entity.id]?.zone==='command'?` · Command Station · ${st.health[Number(entity.controller)]} HP`:''}</small></button>;})}</div>{pending.selection.min!==undefined&&pending.selection.min<pending.selection.count&&<button disabled={pendingIds.length<pending.selection.min} onClick={()=>completeChoice(pendingIds)}>Finish selection ({pendingIds.length})</button>}{pending.selection.optional&&<button onClick={()=>completeChoice([])}>{state.rules?.pending?.flow.steps[0].op==='choose'&&state.rules.pending.flow.steps[0].shuffle?'Finish search without selecting · shuffle deck':'No · skip optional effect'}</button>}{!pending.entities.length&&!pending.selection.optional&&<p>No legal cards remain.</p>}{history.length>0&&<button onClick={()=>{setState(history[history.length-1]);setHistory(h=>h.slice(0,-1));setPendingIds([]);setNotice('Effect undone.');}}>Undo effect · restore previous table</button>}</section></div>}
  {effectFlow&&(()=>{const steps=effectChoices(state,effectFlow.program,effectFlow.context),choice=steps[effectFlow.step];return <div className="ab-modal-backdrop"><section className="ab-pile-dialog" role="dialog" aria-modal="true" aria-label={choice.selection.label}><header><h3>{choice.selection.label}</h3><button autoFocus onClick={()=>setEffectFlow(null)}>Cancel</button></header><p>Choose {choice.selection.count} card{choice.selection.count===1?'':'s'}. No costs are paid until all selections are complete.</p><div>{choice.entities.length?choice.entities.map(entity=><button key={entity.id} onClick={()=>{const previous=effectFlow.context[choice.kind]||[];const ids=previous.includes(entity.id)?previous.filter(id=>id!==entity.id):[...previous,entity.id];const context={...effectFlow.context,[choice.kind]:ids};if(ids.length<choice.selection.count){setEffectFlow({...effectFlow,context});return;}if(effectFlow.step+1<steps.length)setEffectFlow({...effectFlow,context,step:effectFlow.step+1});else finishEffect(effectFlow.program,context,effectFlow.deploy);}}>{effectFlow.context[choice.kind]?.includes(entity.id)?'✓ ':''}{st.cards[entity.id]?.name} · Player {Number(entity.controller)+1}</button>):<p>No legal choices. Cancel to return to the table.</p>}</div></section></div>;})()}
  {pile&&<div className="ab-modal-backdrop" onClick={()=>setPile(null)}><section className="ab-pile-dialog" role="dialog" aria-modal="true" aria-label={`Player ${pile.seat+1} ${pile.zone==='graveyard'?'Ossuary':pile.zone}`} onClick={e=>e.stopPropagation()}><header><h3>Player {pile.seat+1} · {pile.zone==='graveyard'?'Ossuary':'Banished'}</h3><button autoFocus onClick={()=>setPile(null)}>Close</button></header><div>{st.piles[`${pile.seat}:${pile.zone}`].length?st.piles[`${pile.seat}:${pile.zone}`].map(id=><button key={id} onClick={()=>{setPile(null);clickCard(id);}}>{st.cards[id].controller===seat||!st.cards[id].faceDown?st.cards[id].name:'Face-down card'}</button>):<p>No cards here.</p>}</div></section></div>}
 </div>;
 return guided?createPortal(battlefield,document.body):battlefield;
}
