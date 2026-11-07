import type {Battlefield} from '../../../ashenBattlefieldState';
import {useRef} from 'react';

export default function AshenCombatSummary({state,onInspect}:{state:Battlefield;onInspect:(id:string)=>void}){
 const details=useRef<HTMLDetailsElement>(null);
 const combat=state.rules?.duel?.combat;if(!combat||!combat.attackers.length)return null;
 const name=(id:string)=>state.table.cards[id]?.name||combat.report?.fallen.find(c=>c.id===id)?.name||'Unit';
 const report=combat.report;
 const close=()=>{if(details.current)details.current.open=false;};
 return <details ref={details} className="ab-combat-summary" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();close();details.current?.querySelector('summary')?.focus();}}}><summary>{combat.stage==='finished'?'Combat result':`${combat.attackers.length} attacking · ${Object.values(combat.blockers).flat().length} blocking`}</summary><div>
  <header><strong>Skirmish</strong><button aria-label="Close combat result" onClick={close}>Close ✕</button></header>
  <p className="ab-combat-legend"><span>Orange → Station</span><span>Green → Blocked attacker</span></p>
  {combat.attackers.map(id=><p key={id}><button onClick={()=>{close();onInspect(id);}} disabled={!state.table.cards[id]}>{name(id)}</button><span>{combat.blockers[id]?.length?'blocked by '+combat.blockers[id].map(name).join(' → '):combat.blocked.includes(id)?'blocked · blocker left play':'→ enemy Station'}</span></p>)}
  {Object.values(combat.blockers).some(ids=>ids.length>1)&&<p>Blockers take damage in the order shown.</p>}
  {report&&<section aria-label="Resolved combat damage"><strong>Damage dealt</strong>{report.hits.length?report.hits.map((hit,i)=><p key={i}>{hit.sourceName} → {hit.targetName}: <b>{hit.amount}</b></p>):<p>No combat damage dealt.</p>}{report.fallen.length>0&&<p><strong>Destroyed:</strong> {report.fallen.map(c=>c.name).join(', ')}</p>}</section>}
 </div></details>;
}
