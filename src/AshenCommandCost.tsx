import type {Battlefield} from './ashenBattlefieldState';
import {ashenActionCost} from './games/ashen/adapter';
import CostSymbols from './ResourceCost';
export default function AshenCommandCost({state,id,compact=false}:{state:Battlefield;id:string;compact?:boolean}){
 const card=state.table.cards[id],cost=ashenActionCost(state,id);if(!cost.isCommand||card?.zone!=='hand')return null;
 const label=cost.reduction?`Command active · −${cost.reduction} generic`:'Command · Plan or Refine to reduce cost';
 return <span className={compact?'ab-command-badge':'ab-command-cost'} aria-label={`${label}. Planned ${cost.planned}; Refined ${cost.refined}.`} title={`${label}. Planned ${cost.planned}; Refined ${cost.refined}. Colored essence requirements stay the same.`}><strong>{compact?`Command −${cost.reduction}`:label}</strong>{!compact&&<small>Plan {cost.planned} · Refine {cost.refined} this player turn</small>}<span>{!compact&&cost.reduction>0&&<><del><CostSymbols cost={cost.printed} label="Printed cost"/></del><span> → </span></>}<CostSymbols cost={cost.payable} label="Current cost"/></span></span>;
}
