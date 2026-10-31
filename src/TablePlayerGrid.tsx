import IncomingSourceDamage from './IncomingSourceDamage';
import TablePlayerBackground from './TablePlayerBackground';
import {TABLE_THEMES} from './table/appearance';
import type {RoomSeat} from './table/client';
import {useState,type CSSProperties} from 'react';
import CompactCounterControls,{type DamageSelection} from './CompactCounterControls';
import HoldAdjustButton from './HoldAdjustButton';
import {compactTrackers,trackerCommand} from './table/compactTrackers';
import {Flag} from 'lucide-react';
import {currentTurnPlayer,roomProfile,sharedTableTitle,tableEliminated,tableWarnings,tableGameReady,type RoomCommand,type TableRoomState} from './table/model';
export default function TablePlayerGrid({seat,state,playerId,busy,onAdjust,previewBackground}:{seat?:RoomSeat;state:TableRoomState;playerId:string;busy:boolean;onAdjust:(command:Extract<RoomCommand,{type:'adjust'}>)=>void|boolean|Promise<void|boolean>;previewBackground?:string|null}){
 const [damageSelection,setDamageSelection]=useState<DamageSelection|null>(null),[expanded,setExpanded]=useState<string|null>(null);
 const settings=roomProfile(state),marker=sharedTableTitle(state),current=currentTurnPlayer(state);
 const players=[...state.players].sort((a,b)=>Number(b.id===playerId)-Number(a.id===playerId));
 return <div className="ct-table ct-dashboard-grid ct-focused-grid" aria-label="All players">{players.map(p=>{
  const mine=p.id===playerId,out=tableEliminated(p,state),holds=marker.holder===p.id,trackers=compactTrackers(state,p.id).filter(t=>t.field!=='damage');
  return <article key={p.id} style={{'--seat':p.accent,'--player-surface':TABLE_THEMES[p.theme??state.theme??'forge'].background} as CSSProperties} className={`ct-player${mine?' ct-mine':' ct-opponent'}${out?' ct-conceded':''}${p.backgroundVersion?' ct-has-background':''}${current===p.id?' ct-taking-turn':''}`}>
   {mine&&previewBackground?<img className="ct-panel-background" src={previewBackground} alt=""/>:seat&&<TablePlayerBackground seat={seat} playerId={p.id} version={p.backgroundVersion}/>}<header><h2>{p.name}</h2><span>{mine?'YOU':current===p.id?'CURRENT TURN':'READ ONLY'}</span></header>
   {holds&&<div className="ct-title-badge"><Flag size={15}/>{marker.label}</div>}
   {mine?<div className="ct-direct-trackers">{trackers.map(t=>{
    const step=(direction:number,n:number)=>{const amount=Math.min(n,direction<0?t.value-t.min:t.max-t.value);return amount>0?onAdjust(trackerCommand(t,direction*amount,false)):false;};
    return <div className={`ct-direct-tracker${t.field==='life'?' ct-primary-tracker':''}`} key={t.id} role="group" aria-label={`Your ${t.label} controls`}><span>{t.label}</span><div><HoldAdjustButton label={`${t.field==='life'?'Lose':'Remove'} 1 ${t.label}`} disabled={!tableGameReady(state)||t.value<=t.min} busy={busy} onStep={n=>step(-1,n)}>−</HoldAdjustButton><output aria-label={`${t.label} total`}>{t.value}</output><HoldAdjustButton label={`${t.field==='life'?'Gain':'Add'} 1 ${t.label}`} disabled={!tableGameReady(state)||!t.canAdd||t.value>=t.max} busy={busy} onStep={n=>step(1,n)}>+</HoldAdjustButton></div></div>;
   })}<small className="ct-hold-hint">Tap for 1 · hold for repeated changes of 10</small></div>:<><div className="ct-life"><strong>{p.life}</strong><span>{settings.health.label}</span></div><button aria-expanded={expanded===p.id} onClick={()=>setExpanded(expanded===p.id?null:p.id)}>Inspect {p.name}</button>{expanded===p.id&&<div className="ct-opponent-details">{trackers.filter(t=>t.field!=='life').map(t=><p key={t.id}>{t.label}: <strong>{t.value}</strong></p>)}{Object.entries(p.damage).filter(([,v])=>v>0).map(([key,n])=><p key={key}>{state.players.find(x=>x.id===key.split(':')[0])?.name??'Source'} · received {n}</p>)}<small>Only {p.name} can change these totals.</small></div>}</>}
   {p.conceded&&<p className="ct-threshold">Eliminated · conceded</p>}{tableWarnings(p,state).map(w=><p className="ct-threshold" key={w}>Eliminated · {w}</p>)}
   {mine&&settings.sourceDamage.enabled&&<details className="ct-player-options"><summary>Commander / source damage & other amounts</summary><CompactCounterControls state={state} playerId={playerId} busy={busy} onAdjust={onAdjust} onDamageSelection={setDamageSelection}/><IncomingSourceDamage state={state} playerId={playerId} selected={damageSelection} busy={busy} onAdjust={onAdjust}/></details>}
  </article>;
 })}</div>;
}
