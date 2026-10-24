import type {Battlefield} from './ashenBattlefieldState';
import {ashenData,ashenStats} from './games/ashen/adapter';
const delta=(n:number)=>n>=0?`+${n}`:String(n);
export default function AshenStatBreakdown({state,id}:{state:Battlefield;id:string}){
 const c=state.table.cards[id],data=ashenData(state,id);if(c?.zone!=='unit'||!data)return null;const stats=ashenStats(state,id);
 return <section className="ab-stat-breakdown" aria-label="Stat bonus sources"><strong>Attack / Defense</strong><p>Printed: {data.attack||0}A / {data.defense||0}D</p>{stats.bonuses.length?stats.bonuses.map((bonus,i)=><p key={i}>{bonus.label}: {delta(bonus.attack)}A / {delta(bonus.defense)}D</p>):<p>No stat bonuses.</p>}<b>Current: {stats.attack}A / {stats.defense}D</b></section>;
}
