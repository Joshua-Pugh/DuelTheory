import AshenKeywordIcons from './AshenKeywordIcons';
import {Eye} from 'lucide-react';
import type {DragEvent} from 'react';
import type {Battlefield} from '../../../ashenBattlefieldState';
import {ashenFaceVisible} from '../../../ashenBattlefieldState';
import AshenCardFrame from '../../../AshenCardFrame';
import AshenCommandCost from '../../../AshenCommandCost';
import CardBack from '../../../duelUi/CardBack';
import {ashenData,ashenStats} from '../adapter';
import type {CombatCardView} from './combatView';

type Props={state:Battlefield;id:string;seat:0|1;hand:boolean;showKeywords?:boolean;dragBlocker?:boolean;dragTarget?:boolean;selected:boolean;combat:CombatCardView;onClick:()=>void;onActions:()=>void;onRead:()=>void;onHover:(id:string|null)=>void;onDrag:(event:DragEvent)=>void};
/** Card rendering only. Controller callbacks and engine inspections own all gameplay. */
export default function AshenBattlefieldCard({state,id,seat,hand,showKeywords,dragBlocker,dragTarget,selected,combat,onClick,onActions,onRead,onHover,onDrag}:Props){
 const c=state.table.cards[id],known=c.controller===seat||(c.zone!=='hand'&&!c.faceDown),face=ashenFaceVisible(c,seat),data=ashenData(state,id);
 const stats=c.zone==='unit'&&known?ashenStats(state,id):undefined;
 const spent=c.zone==='ley'&&c.faceDown,fatigued=['unit','support'].includes(c.zone)&&c.rotated;
 const label=known?c.name:'Face-down card',remaining=stats?Math.max(0,stats.defense-stats.damage):0;
 const status=spent?'Spent':fatigued?'Fatigued':!hand&&['unit','support','ley'].includes(c.zone)?'Ready':'';
 return <div className="ab-card-wrap">
  <button type="button" className={['ab-card',dragBlocker?'ab-drag-blocker':'',dragTarget?'ab-drag-target':'',c.controller!==seat&&!hand?'ab-opposing':'',fatigued?'ab-fatigued':'',spent?'ab-font-spent':'',selected||combat.selected?'ab-selected':'',combat.intent?'ab-combat-'+combat.intent:'',combat.attacking?'ab-attacking':'',combat.blocking?'ab-blocking':'',stats?.damage?'ab-damaged':''].filter(Boolean).join(' ')}
   data-ashen-card={id} data-combat-action={combat.intent} aria-label={`${label}${spent?' · spent':''}`} aria-pressed={combat.intent==='attack'||combat.intent==='target'||combat.intent==='effect-target'?!!combat.selected:undefined} aria-description={[combat.label,combat.reason,status,stats?.keywords.filter(k=>['Ranged','Soar','Siege'].includes(k)).join(', '),stats?`${stats.attack} Attack, ${remaining} of ${stats.defense} Defense remaining`:null].filter(Boolean).join('. ')} title={[label,combat.label||combat.reason,status].filter(Boolean).join(' · ')} draggable={!state.rules?.duel&&c.controller===seat} onDragStart={onDrag} onMouseEnter={()=>onHover(id)} onMouseLeave={()=>onHover(null)} onFocus={()=>onHover(id)} onBlur={()=>onHover(null)} onClick={onClick} onContextMenu={e=>{e.preventDefault();onActions();}}>
   <span className="ab-card-face">{face&&data?<AshenCardFrame card={data} size="mini"/>:<span className="ab-card-back"><CardBack/></span>}</span>
   {fatigued&&<span className="ab-fatigue-counter" aria-label="1 Fatigue counter">F</span>}
   {c.counters>0&&<span className="ab-counter">+{c.counters}</span>}
   {Object.entries(state.rules?.counters?.[id]||{}).filter(([,n])=>n>0).map(([name,n])=><span className="ab-counter" key={name}>{name}: {n}</span>)}
   {stats&&<span className="ab-stat-chip" title={`${stats.attack} Attack · ${remaining} of ${stats.defense} Defense remaining`}>{stats.attack}/{remaining}{stats.damage>0&&<small> · {stats.damage} dmg</small>}</span>}
   {showKeywords&&stats&&<AshenKeywordIcons keywords={stats.keywords}/>}
   {spent&&<span className="ab-spent">Spent</span>}
   {!hand&&!spent&&status&&<span className="ab-readiness">{status}{fatigued&&stats?.keywords.includes('Standfast')?' · Standfast':''}</span>}
   {(combat.label||combat.attacking||combat.blocking)&&<span className="ab-combat-tag">{combat.label||(combat.blocking?'Blocking':'Attacking')}</span>}
  </button>
  {known&&combat.intent!=='effect-target'&&(combat.intent||combat.reason||combat.attacking||combat.blocking)&&<button className="ab-combat-read" aria-label={`Read ${label}`} title="Read card" onClick={onRead}><Eye size={15}/></button>}
  {hand&&c.controller===seat&&<AshenCommandCost state={state} id={id} compact/>}
 </div>;
}
