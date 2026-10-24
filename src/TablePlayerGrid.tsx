import {Flag} from 'lucide-react';
import {currentTurnPlayer,roomProfile,sharedTableTitle,tableEliminated,tableGameReady,tableSources,tableWarnings,type TableRoomState} from './table/model';
export default function TablePlayerGrid({state,playerId,busy,onAdjust}:{state:TableRoomState;playerId:string;busy:boolean;onAdjust:(delta:number)=>void}){
 const settings=roomProfile(state),sources=tableSources(state),marker=sharedTableTitle(state),current=currentTurnPlayer(state);
 return <div className="ct-table ct-dashboard-grid" aria-label="All players">{state.players.map((p,index)=>{
  const mine=p.id===playerId,out=tableEliminated(p,state),holds=marker.holder===p.id;
  return <article key={p.id} className={`ct-player ct-color-${index}${mine?' ct-mine':''}${out?' ct-conceded':''}${current===p.id?' ct-taking-turn':''}`}>
   <header><h2>{p.name}</h2><span>{mine?'YOU':current===p.id?'CURRENT TURN':'READ ONLY'}</span></header>
   {holds&&<div className="ct-title-badge"><Flag size={15}/>{marker.label}</div>}
   <div className="ct-life"><strong>{p.life}</strong><span>{settings.health.label}</span></div>
   {mine?<div className="ct-tile-adjust" role="group" aria-label={`Your ${settings.health.label} controls`}><button disabled={busy||!tableGameReady(state)} aria-label={`Lose 1 ${settings.health.label}`} onClick={()=>onAdjust(-1)}>−</button><button disabled={busy||!tableGameReady(state)} aria-label={`Gain 1 ${settings.health.label}`} onClick={()=>onAdjust(1)}>+</button></div>:<small className="ct-tile-note">Updated by {p.name}</small>}
   <div className="ct-player-counters">{!state.profile&&<span>Poison <b>{p.poison}</b></span>}{Object.entries(p.counters).map(([key,n])=><span key={key}>{key} <b>{n}</b></span>)}{Object.entries(p.damage).filter(([,n])=>n>0).map(([key,n])=>{const source=sources.find(c=>c.key===key);return <span key={key} title={`${source?.owner} · ${source?.name}`}>{source?.name} · {source?.owner} <b>{n}{settings.sourceDamage.defeatAt!==null?`/${settings.sourceDamage.defeatAt}`:''}</b></span>;})}</div>
   {p.conceded&&<p className="ct-threshold">Eliminated · conceded</p>}{tableWarnings(p,state).map(w=><p className="ct-threshold" key={w}>Eliminated · {w}</p>)}
  </article>;
 })}</div>;
}
