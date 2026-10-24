import IncomingSourceDamage from './IncomingSourceDamage';
import {useState} from 'react';
import CompactCounterControls,{type DamageSelection} from './CompactCounterControls';
import {Flag} from 'lucide-react';
import {currentTurnPlayer,roomProfile,sharedTableTitle,tableEliminated,tableWarnings,type RoomCommand,type TableRoomState} from './table/model';
export default function TablePlayerGrid({state,playerId,busy,onAdjust}:{state:TableRoomState;playerId:string;busy:boolean;onAdjust:(command:Extract<RoomCommand,{type:'adjust'}>)=>void|boolean|Promise<void|boolean>}){
 const [damageSelection,setDamageSelection]=useState<DamageSelection|null>(null);
 const settings=roomProfile(state),marker=sharedTableTitle(state),current=currentTurnPlayer(state);
 return <><div className="ct-table ct-dashboard-grid" aria-label="All players">{state.players.map((p,index)=>{
  const mine=p.id===playerId,out=tableEliminated(p,state),holds=marker.holder===p.id;
  return <article key={p.id} className={`ct-player ct-color-${index}${mine?' ct-mine':''}${out?' ct-conceded':''}${current===p.id?' ct-taking-turn':''}`}>
   <header><h2>{p.name}</h2><span>{mine?'YOU':current===p.id?'CURRENT TURN':'READ ONLY'}</span></header>
   {holds&&<div className="ct-title-badge"><Flag size={15}/>{marker.label}</div>}
   <div className="ct-life"><strong>{p.life}</strong><span>{settings.health.label}</span></div>
   {mine?<CompactCounterControls state={state} playerId={playerId} busy={busy} onAdjust={onAdjust} onDamageSelection={setDamageSelection}/>:<small className="ct-tile-note">Updated by {p.name}</small>}
   <div className="ct-player-counters">{!state.profile&&<span>Poison <b>{p.poison}</b></span>}{Object.entries(p.counters).map(([key,n])=><span key={key}>{key} <b>{n}</b></span>)}</div>
   {p.conceded&&<p className="ct-threshold">Eliminated · conceded</p>}{tableWarnings(p,state).map(w=><p className="ct-threshold" key={w}>Eliminated · {w}</p>)}
  </article>;
 })}</div><IncomingSourceDamage state={state} playerId={playerId} selected={damageSelection} busy={busy} onAdjust={onAdjust}/></>;
}
