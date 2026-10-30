import {useEffect,useState,type CSSProperties} from 'react';
import type {TableRoomState,RoomCommand} from './table/model';
import './tableDice.css';

const rotations=['rotateX(0deg) rotateY(0deg)','rotateX(0deg) rotateY(-90deg)','rotateX(-90deg) rotateY(0deg)','rotateX(90deg) rotateY(0deg)','rotateX(0deg) rotateY(90deg)','rotateX(0deg) rotateY(180deg)'];
const pips=[[5],[1,9],[1,5,9],[1,3,7,9],[1,3,5,7,9],[1,3,4,6,7,9]];
function Die({value}:{value?:number}){
 const [moving,setMoving]=useState(false);
 useEffect(()=>{if(!value){setMoving(false);return;}setMoving(true);const timer=setTimeout(()=>setMoving(false),850);return()=>clearTimeout(timer);},[value]);
 return <span className="dt-table-die" role="img" aria-label={value?`Rolled ${value}`:'Not rolled'}>
  <span className={`dt-table-die-cube${moving?' is-rolling':''}`} style={{'--die-rest':rotations[(value??1)-1]} as CSSProperties} aria-hidden="true">
   {pips.map((positions,i)=><span key={i} className={`dt-table-die-face dt-table-die-face-${i+1}`}>{positions.map(position=><i key={position} style={{gridArea:`${Math.ceil(position/3)} / ${(position-1)%3+1}`}}/>)}</span>)}
  </span>{!value&&<span className="dt-table-die-wait" aria-hidden="true">?</span>}
 </span>;
}
export default function TableFirstPlayerDice({state,playerId,busy,onChange}:{state:TableRoomState;playerId:string;busy:boolean;onChange:(command:RoomCommand)=>void}){
 const roll=state.firstPlayer;if(!roll)return null;
 const canRoll=!roll.winner&&roll.eligible.includes(playerId)&&!Object.hasOwn(roll.rolls,playerId);
 return <section className={`ct-first-dice${roll.winner?' ct-first-dice-complete':''}`} aria-label="First-player dice">
  <div className="ct-roll-results">{state.players.map(p=><div key={p.id} className={p.id===roll.winner?'ct-roll-winner':''}>
   <Die value={roll.rolls[p.id]}/><strong>{p.name}</strong><small>{roll.rolls[p.id]?`${roll.rolls[p.id]}${p.id===roll.winner?' · goes first':''}`:roll.eligible.includes(p.id)?'Waiting to roll':'Outside this tie-break'}</small>
  </div>)}</div>
  {!roll.winner&&<button className="ct-primary" disabled={busy||!canRoll} onClick={()=>onChange({type:'roll',round:roll.round})}>{busy?'Rolling…':canRoll?'Roll die · d6':'Waiting for other players'}</button>}
  <span className="ct-dice-announcement" role="status">{roll.winner?(state.players.some(p=>p.id===roll.winner)?`${state.players.find(p=>p.id===roll.winner)?.name} goes first.`:'Opening roll complete.'):Object.entries(roll.rolls).map(([id,n])=>`${state.players.find(p=>p.id===id)?.name} rolled ${n}.`).join(' ')}</span>
 </section>;
}

