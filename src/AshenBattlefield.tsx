import {useEffect,useRef,useState,type CSSProperties,type DragEvent} from 'react';
import {Flame,RotateCcw,Eye,ChevronRight,Undo2,Swords} from 'lucide-react';
import AshenCardFrame from './AshenCardFrame';
import {RESOURCES,type Resource} from './ashenPresentation';
import {BATTLEFIELD_KEY,battlefieldDispatch,fontEssence,newBattlefield,readBattlefield,type Battlefield,type BattlefieldAction} from './ashenBattlefieldState';
import './ashenBattlefield.css';
import {bruteEffects,BRUTE_EFFECT_PACK} from './games/ashen/bruteEffects';
import {ashenData,ashenStats,effectChoices,playProgram,resolveAshenEffect,resolveBurnEffect} from './games/ashen/adapter';
import type {EffectProgram,EffectContext} from './framework';

const NAMES:Record<Resource,string>={untuned:'Untuned',oath:'Oath',fury:'Fury',ash:'Ash',veil:'Veil'};
type Flight={id:number;x:number;y:number;dx:number;dy:number;resource:Resource};
export default function AshenBattlefield(){
 const [state,setState]=useState<Battlefield>(()=>readBattlefield()||newBattlefield(true));
 const [seat,setSeat]=useState<0|1>(0),[selected,setSelected]=useState<string|null>(null);
 const [history,setHistory]=useState<Battlefield[]>([]),[notice,setNotice]=useState('Select a font and burn it to send essence into your Ley Basin.');
 const [flights,setFlights]=useState<Flight[]>([]),[pile,setPile]=useState<{seat:0|1;zone:string}|null>(null);
 const [expanded,setExpanded]=useState(false);
 const [fades,setFades]=useState<{seat:0|1;resources:Resource[]}[]>([]);
 const [assisted,setAssisted]=useState(false);
 const [effectFlow,setEffectFlow]=useState<{program:EffectProgram;context:EffectContext;deploy:boolean;step:number}|null>(null);
 const board=useRef<HTMLDivElement>(null),flightId=useRef(0);
 const st=state.table,opponent:0|1=seat===0?1:0;
 const card=selected?st.cards[selected]:undefined;
 const data=card?ashenData(state,card.instanceId):undefined;
 const effectDefinition=card?bruteEffects[card.cardId]:undefined;
 const visible=card&&(card.controller===seat||(card.zone!=='hand'&&card.zone!=='deck'&&!card.faceDown));
 useEffect(()=>{try{localStorage.setItem(BATTLEFIELD_KEY,JSON.stringify(state));}catch{setNotice('Browser storage unavailable. Keep this tab open or export the table.');}},[state]);
 useEffect(()=>{if(!expanded)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous;};},[expanded]);
 useEffect(()=>{const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){if(effectFlow)setEffectFlow(null);else if(pile)setPile(null);else setExpanded(false);}};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[pile,effectFlow]);
 const act=(action:BattlefieldAction)=>{
  try{let next=battlefieldDispatch(state,action);if(assisted&&action.type==='BURN')next=resolveBurnEffect(next,action.instanceId);if(assisted&&action.type==='END_TURN'){for(const zone of ['unit','support'])for(const id of next.table.piles[`${next.table.active}:${zone}`])next.table.cards[id].rotated=false;}setHistory(h=>[...h.slice(-29),state]);setState(next);setNotice(next.table.events.at(-1)||'Updated.');return true;}
  catch(e){setNotice(e instanceof Error?e.message:String(e));return false;}
 };
 const finishEffect=(program:EffectProgram,context:EffectContext,deploy:boolean)=>{try{const next=resolveAshenEffect(state,program,context,deploy);setHistory(h=>[...h.slice(-29),state]);setState(next);setEffectFlow(null);setNotice(next.table.events.at(-1)||'Effect resolved.');}catch(e){setEffectFlow(null);setNotice(e instanceof Error?e.message:String(e));}};
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
 const renderCard=(id:string,hand=false)=>{
  const c=st.cards[id],known=c.controller===seat||(c.zone!=='hand'&&!c.faceDown),face=known&&!c.faceDown;
  const d=ashenData(state,id),label=known?c.name:'Face-down card';
  return <div className="ab-card-wrap" key={id}>
   <button type="button" className={`ab-card ${c.controller!==seat&&!hand?'ab-opposing':''} ${c.rotated?'ab-fatigued':''} ${selected===id?'ab-selected':''}`} data-ashen-card={id} aria-label={`${label}${c.zone==='ley'&&c.faceDown?' · spent':''}`} title={label} draggable={c.controller===seat} onDragStart={e=>e.dataTransfer.setData('application/x-ashen-card',id)} onClick={()=>setSelected(id)} onContextMenu={e=>{e.preventDefault();setSelected(id);}}>
    <span className="ab-card-face">{face&&d?<AshenCardFrame card={d} size="mini"/>:<span className="ab-card-back"><b>AT</b><small>ASHEN THRONE</small></span>}</span>
    {c.counters>0&&<span className="ab-counter">+{c.counters}</span>}
    {c.zone==='unit'&&known&&<span className="ab-stat-chip">{ashenStats(state,id).attack}/{ashenStats(state,id).defense}{ashenStats(state,id).damage?` · ${ashenStats(state,id).damage} dmg`:''}</span>}
    {c.zone==='ley'&&c.faceDown&&<span className="ab-spent">SPENT</span>}
   </button>
   {c.type==='Ley Font'&&c.zone==='ley'&&c.controller===seat&&<button className="ab-font-burn" disabled={c.faceDown||c.rotated} aria-label={`Burn ${c.name}`} onClick={()=>burn(id)}><Flame size={10}/>{c.faceDown||c.rotated?'Spent':'Burn'}</button>}
  </div>;
 };
 const zone=(who:0|1,id:string,label:string)=>{
  const ids=st.piles[`${who}:${id}`];
  return <section className={`ab-zone ab-${id} ${selected&&card?.controller===seat?'ab-droppable':''}`} aria-label={`Player ${who+1} ${label}`} onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,who,id)}>
   <header><span>{label}</span><small>{ids.length} {id==='command'?'':'· unlimited'}</small></header>
   <div className="ab-card-row">{ids.map(id=>renderCard(id))}{!ids.length&&<span className="ab-zone-empty">{id==='unit'?'Muster your forces here':id==='ley'?'Your fonts gather here':id==='support'?'Runes & relics in play':'Command Station'}</span>}</div>
   {selected&&card?.controller===seat&&card.zone!==id&&<button className="ab-place" onClick={()=>move(selected,who,id)}>Place selected here</button>}
   {id==='command'&&<div className="ab-hp"><button aria-label={`Player ${who+1} lose 1 HP`} onClick={()=>act({type:'HEALTH',seat:who,delta:-1})}>−</button><strong>{st.health[who]} <small>HP</small></strong><button aria-label={`Player ${who+1} gain 1 HP`} onClick={()=>act({type:'HEALTH',seat:who,delta:1})}>+</button></div>}
  </section>;
 };
 const basin=(who:0|1)=><section className="ab-basin" data-basin={who} aria-label={`Player ${who+1} Ley Basin`}>
  <header><span>LEY BASIN</span><small>Essence fades at turn’s end</small></header>
  <div className="ab-vessel" aria-hidden="true"><span>✧</span></div>
  <div className="ab-essences">{RESOURCES.map(r=><div className={`ab-essence ab-${r} ${state.basins[who][r]>0?'ab-charged':''}`} key={r} title={NAMES[r]}>
   <img key={`${r}-${state.basins[who][r]}`} src={`/ashen/costs/${r}.png`} alt={NAMES[r]}/><output aria-label={`Player ${who+1} ${NAMES[r]} essence`}>{state.basins[who][r]}</output><small>{NAMES[r]}</small>
   {who===seat&&<span><button disabled={!state.basins[who][r]} aria-label={`Spend 1 ${NAMES[r]} essence`} onClick={()=>act({type:'ESSENCE',seat:who,resource:r,delta:-1})}>−</button><button aria-label={`Add 1 ${NAMES[r]} essence`} onClick={()=>act({type:'ESSENCE',seat:who,resource:r,delta:1})}>+</button></span>}
  </div>)}</div>
  {fades.filter(f=>f.seat===who).map(f=><span className="ab-dissolve" key={who} aria-hidden="true" onAnimationEnd={()=>setFades(all=>all.filter(i=>i.seat!==who))}>{f.resources.map(r=><img src={`/ashen/costs/${r}.png`} key={r} alt=""/>)}</span>)}
 </section>;
 const piles=(who:0|1)=><div className="ab-piles">
  <button className="ab-deck" aria-label={`Draw for Player ${who+1}`} disabled={who!==seat||!st.piles[`${who}:deck`].length} onClick={()=>act({type:'DRAW',seat:who})}><span className="ab-card-back"><b>AT</b><small>ASHEN THRONE</small></span><strong>{st.piles[`${who}:deck`].length}</strong><small>DECK · DRAW</small></button>
  {['graveyard','banished'].map(z=><button key={z} className="ab-pile-button" onClick={()=>setPile({seat:who,zone:z})} onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,who,z)}>{z==='graveyard'?'Discard':'Banished'} <b>{st.piles[`${who}:${z}`].length}</b></button>)}
 </div>;
 const half=(who:0|1)=><section className={`ab-half ${who!==seat?'ab-opponent':'ab-you'} ${who===0?'ab-brute':'ab-noble'}`} aria-label={`Player ${who+1} battlefield`}>
  <div className="ab-player"><span>{who===seat?'YOU':'OPPONENT'} · PLAYER {who+1}</span><strong>{who===0?'Clan of the Broken Fist':'The Crown’s Might'}</strong><em>{st.active===who?'Active player':''}</em></div>
  <div className="ab-half-grid">{zone(who,'command','Command Station')}{zone(who,'support','Runes & Relics')}{zone(who,'ley','Ley Fonts')}{piles(who)}{zone(who,'unit','Frontline')}{basin(who)}</div>
 </section>;
 return <div className={`ab-shell ${expanded?'ab-expanded':''}`}>
  <header className="ab-toolbar"><div><span className="eyebrow">ASHEN THRONE · COMMAND SIEGE</span><h2>The battlefield</h2><small>{state.preview?'Populated layout preview':'Playtest table'} · {assisted?'Brute effects sandbox · Clash/combat manual':'Manual effects & costs'}</small></div><div className="ab-tools">
   <button onClick={()=>setAssisted(a=>!a)} aria-pressed={assisted}>{assisted?'Brute effects: ON':'Brute effects: OFF'}</button><button onClick={()=>setExpanded(e=>!e)}>{expanded?'Exit full screen':'Expand table'}</button><button onClick={()=>replace(false)}>New table</button><button onClick={()=>replace(true)}>Layout preview</button><button onClick={()=>{setSeat(opponent);setSelected(null);setPile(null);}}><Eye size={14}/> View P{opponent+1}</button>
   <button disabled={!history.length} onClick={()=>{setState(history[history.length-1]);setHistory(h=>h.slice(0,-1));setFlights([]);setSelected(null);setNotice('Previous table restored.');}}><Undo2 size={14}/> Undo</button>
   <button onClick={()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='ashen-throne-table.json';a.click();URL.revokeObjectURL(url);}}>Export</button>
   <button onClick={()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(BRUTE_EFFECT_PACK,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='ashen-brute-effects-v1.json';a.click();URL.revokeObjectURL(url);}}>Export Brute rules</button>
  </div></header>
  <div className="ab-workspace"><div className="ab-table" ref={board}>
   <div className="ab-opponent-hand" aria-label={`Opponent hand · ${st.piles[`${opponent}:hand`].length} cards`}>{st.piles[`${opponent}:hand`].map(id=><span className="ab-card-back" key={id}><b>AT</b></span>)}</div>
   {half(opponent)}<div className="ab-center"><Swords size={18}/><span>THE SKIRMISH</span><small>Round {st.turn} · Player {st.active+1}</small><button onClick={()=>{setFades(([0,1] as const).map(who=>({seat:who,resources:RESOURCES.filter(r=>state.basins[who][r]>0)})));act({type:'END_TURN'});setSelected(null);}}>End turn <ChevronRight size={14}/></button></div>{half(seat)}
   {flights.map(f=><span key={f.id} className={`ab-essence-flight ab-${f.resource}`} style={{left:f.x,top:f.y,'--flight-x':`${f.dx}px`,'--flight-y':`${f.dy}px`} as CSSProperties} onAnimationEnd={()=>setFlights(all=>all.filter(i=>i.id!==f.id))}><img src={`/ashen/costs/${f.resource}.png`} alt=""/></span>)}
  </div><aside className="ab-inspector"><span className="eyebrow">CARD INSPECTOR</span>{visible&&data?<><AshenCardFrame card={data}/><h3>{data.name}</h3><p>{data.type} · Player {card!.controller+1}</p><p className="ab-rules">{data.effectText}</p></>:<div className="ab-inspect-empty"><Swords size={32}/><h3>{card?'Face-down card':'Command the field'}</h3><p>Select a card to inspect it. Drag it to an area, or use the placement buttons.</p></div>}
   {visible&&card&&<div className="ab-effect-coverage"><strong>{effectDefinition?`Brute batch · ${effectDefinition.coverage==='partial'?'partial effect coverage':'effect definitions available'}`:'Manual effect resolution'}</strong><p>{effectDefinition?.notes||'Combat, Clash responses, auras, and effects outside this batch remain manual.'}</p>{card.type==='Unit'&&<p>Current stats: {ashenStats(state,card.instanceId).attack}A / {ashenStats(state,card.instanceId).defense}D · {ashenStats(state,card.instanceId).damage} damage</p>}</div>}
   {card&&card.controller===seat&&<div className="ab-card-actions">
    {assisted&&effectDefinition&&card.zone==='hand'&&<button className="ab-burn" onClick={deployEffect}>Deploy with effects</button>}
    {assisted&&effectDefinition&&['unit','support'].includes(card.zone)&&effectDefinition.activated?.map(program=><button className="ab-burn" key={program.id} onClick={()=>beginEffect(program)}>{program.label}</button>)}
    {card.zone==='ley'&&card.type==='Ley Font'&&<button className="ab-burn" disabled={card.faceDown||card.rotated} onClick={()=>burn(card.instanceId)}><Flame size={16}/> Burn font · +1 {NAMES[fontEssence(card.cardId)]}</button>}
    {card.zone==='hand'&&<button onClick={()=>move(card.instanceId,seat,card.type==='Unit'?'unit':card.type==='Ley Font'?'ley':'support')}>{assisted?'Move manually':`Place ${card.type==='Ley Font'?'Ley Font':card.type==='Unit'?'on Frontline':'in support area'}`}</button>}
    <button onClick={()=>act({type:'ROTATE',instanceId:card.instanceId})}><RotateCcw size={14}/> {card.rotated?'Ready':'Fatigue'}</button>
    <button onClick={()=>act({type:'FLIP',instanceId:card.instanceId})}>{card.faceDown?'Turn face-up':'Turn face-down'}</button>
    <button onClick={()=>act({type:'COUNTER',instanceId:card.instanceId,delta:1})}>+ Counter</button><button disabled={!card.counters} onClick={()=>act({type:'COUNTER',instanceId:card.instanceId,delta:-1})}>− Counter</button>
    {card.zone!=='hand'&&<button onClick={()=>move(card.instanceId,seat,'hand')}>Return to hand</button>}
    <button disabled={card.zone==='graveyard'} onClick={()=>move(card.instanceId,seat,'graveyard')}>Send to discard</button>
   </div>}
   <details className="ab-history"><summary>Table history</summary>{st.events.slice(-15).map((e,i)=><p key={i}>{e}</p>)}</details>
  </aside></div>
  <section className="ab-hand" aria-label="Your hand"><header><strong>YOUR HAND <small>{st.piles[`${seat}:hand`].length} cards</small></strong><span>Player {seat+1} · {seat===0?'Brutes':'Nobles'}</span><button onClick={()=>act({type:'DRAW',seat})}>Draw card</button></header><div className="ab-hand-cards">{st.piles[`${seat}:hand`].map(id=>renderCard(id,true))}</div></section>
  <p className="ab-notice" role="status">{notice}</p><p className="ab-footnote">Saves in this browser. Manual controls bypass rules. Turn on Brute effects to use the first effect batch; combat, Clash timing, and unlisted effects still require manual resolution.</p>
  {assisted&&<p className="ab-effect-banner">Effects sandbox: use “Deploy with effects” for cards in the first Brute batch. Printed essence costs and deployment fatigue are applied. Manual moves bypass rules. Clash timing, combat, and unlisted effects are not automated.</p>}
  {effectFlow&&(()=>{const steps=effectChoices(state,effectFlow.program,effectFlow.context),choice=steps[effectFlow.step];return <div className="ab-modal-backdrop"><section className="ab-pile-dialog" role="dialog" aria-modal="true" aria-label={choice.selection.label}><header><h3>{choice.selection.label}</h3><button autoFocus onClick={()=>setEffectFlow(null)}>Cancel</button></header><p>Choose one. No costs are paid until all selections are complete.</p><div>{choice.entities.length?choice.entities.map(entity=><button key={entity.id} onClick={()=>{const context={...effectFlow.context,[choice.kind]:[entity.id]};if(effectFlow.step+1<steps.length)setEffectFlow({...effectFlow,context,step:effectFlow.step+1});else finishEffect(effectFlow.program,context,effectFlow.deploy);}}>{st.cards[entity.id]?.name} · Player {Number(entity.controller)+1}</button>):<p>No legal choices. Cancel to return to the table.</p>}</div></section></div>;})()}
  {pile&&<div className="ab-modal-backdrop" onClick={()=>setPile(null)}><section className="ab-pile-dialog" role="dialog" aria-modal="true" aria-label={`Player ${pile.seat+1} ${pile.zone}`} onClick={e=>e.stopPropagation()}><header><h3>Player {pile.seat+1} · {pile.zone==='graveyard'?'Discard':'Banished'}</h3><button autoFocus onClick={()=>setPile(null)}>Close</button></header><div>{st.piles[`${pile.seat}:${pile.zone}`].length?st.piles[`${pile.seat}:${pile.zone}`].map(id=><button key={id} onClick={()=>{setSelected(id);setPile(null);}}>{st.cards[id].name}</button>):<p>No cards here.</p>}</div></section></div>}
 </div>;
}
