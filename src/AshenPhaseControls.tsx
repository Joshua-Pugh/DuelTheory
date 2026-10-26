import {ashenOpeningPlayer} from './games/ashen/duel';
import {assertAshenPhaseAdvance} from './games/ashen/duel';
import PhaseSelector from './duelUi/PhaseSelector';
import type {Battlefield} from './ashenBattlefieldState';
export default function AshenPhaseControls({state,seat,attackIds,blockAttack,onNext,onAdvance,onPass,onSeat,onSelectAll,onAttack,onClearBlockers,onCombat,onOrder,onConfirmOrder}:{state:Battlefield;seat:0|1;attackIds:string[];blockAttack:string|null;onNext:()=>void;onAdvance?:(phase:'combat'|'main2'|'end')=>void;onPass:()=>void;onSeat?:((seat:0|1)=>void);onSelectAll:()=>void;onAttack:()=>void;onClearBlockers:()=>void;onCombat:()=>void;onOrder:(index:number)=>void;onConfirmOrder:()=>void}){
 const d=state.rules!.duel!,active=state.table.active===seat,locked=!!(ashenOpeningPlayer(state)!==null||state.rules?.pending||d.stack.length||d.jobs.length||d.priority||d.responseWindow||d.ordering||d.callPermission||d.winner!==undefined),combat=d.phase==='combat',stage=d.combat?.stage;
 const canGo=(phase:'combat'|'main2'|'end')=>{if(!active||locked)return false;try{assertAshenPhaseAdvance(state,phase);return true;}catch{return false;}};
 const go=(phase:'combat'|'main2'|'end')=>onAdvance?onAdvance(phase):onNext();
 const steps=combat?[{id:'attack',label:'ATK',title:'Declare Siege · attacking Units gain Fatigue',active:stage==='attack',disabled:true,onSelect:()=>{}},{id:'block',label:'BLK',title:'Establish Defense · assign blockers',active:stage==='block',disabled:true,onSelect:()=>{}},{id:'damage',label:'DMG',title:'Damage Exchange and Damage Application',active:stage==='damage',disabled:locked||active||stage!=='block',onSelect:onCombat},{id:'main2',label:'M2',title:'Second main phase',disabled:!canGo('main2'),onSelect:()=>go('main2')},{id:'end',label:'EP',title:'End Phase · finish required combat first',disabled:!canGo('end'),onSelect:()=>go('end')}]:[
 {id:'start',label:'ST',title:'Start Phase · start effects, ready, then draw',active:d.phase==='start',disabled:true,onSelect:()=>{}},
 {id:'main1',label:'M1',title:'First main phase',active:d.phase==='main1',disabled:true,onSelect:()=>{}},
 {id:'combat',label:'SP',title:'Enter the Skirmish Phase',disabled:!canGo('combat'),onSelect:()=>go('combat')},
 {id:'main2',label:'M2',title:'Main Phase II · skip unneeded earlier steps',active:d.phase==='main2',disabled:!canGo('main2'),onSelect:()=>go('main2')},
 {id:'end',label:'EP',title:'End turn · resolve end effects',active:d.phase==='end',disabled:!canGo('end'),onSelect:()=>go('end')}];
 return <div className="ab-phase-controls"><PhaseSelector steps={steps}/>
 {d.ordering?<div className="ab-step-actions"><span>Order attack triggers</span>{d.stack.map((entry,i)=><button disabled={!active} key={i} onClick={()=>onOrder(i)}>Resolve first: {entry.program.label}</button>)}<button disabled={!active} onClick={onConfirmOrder}>Confirm trigger order</button></div>:d.priority?<div className="ab-step-actions"><span>Clash · Player {Number(d.priority.holder)+1} responds · {d.stack.length} pending</span>{d.priority.holder===String(seat)?<button onClick={onPass}>No response · continue</button>:onSeat?<button onClick={()=>onSeat(Number(d.priority!.holder) as 0|1)}>Play Player {Number(d.priority.holder)+1}</button>:<span role="status">Waiting for Player {Number(d.priority.holder)+1} to respond.</span>}</div>:!state.rules?.pending&&<div className="ab-step-actions">
 {!active&&stage!=='block'&&onSeat&&<button onClick={()=>onSeat(state.table.active)}>Play Player {state.table.active+1}</button>}
 {combat&&stage==='attack'&&<><span>Declare Siege · Select Ready Units · {attackIds.length} selected</span><button disabled={!active||locked} onClick={onSelectAll}>Select all Ready</button><button disabled={!active||locked} onClick={onAttack}>{attackIds.length?'Attack with selected Units':'Skip attacks'}</button></>}
 {combat&&stage==='block'&&<><span>Establish Defense · Choose attacker, then a blocker{blockAttack?` · ${state.table.cards[blockAttack]?.name}`:''}</span>{active&&onSeat&&<button onClick={()=>onSeat(state.table.active===0?1:0)}>Play defender</button>}<button disabled={active||locked} onClick={onClearBlockers}>Clear blockers</button><button disabled={active||locked} onClick={onCombat}>Confirm blockers</button></>}
 {(!combat||stage==='finished')&&<button disabled={!active||locked} onClick={onNext}>{d.phase==='main2'?'End turn':stage==='finished'?'Second main phase':'Enter Skirmish →'}</button>}
 </div>}</div>;
}

