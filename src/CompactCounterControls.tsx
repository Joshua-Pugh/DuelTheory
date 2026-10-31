import {useEffect,useState} from 'react';
import HoldAdjustButton from './HoldAdjustButton';
import {compactTrackers,trackerCommand} from './table/compactTrackers';
import {roomProfile,tableGameReady,type RoomCommand,type TableRoomState} from './table/model';
export type DamageSelection={key:string;link:boolean};
export default function CompactCounterControls({state,playerId,busy,onAdjust,onDamageSelection}:{state:TableRoomState;playerId:string;busy:boolean;onAdjust:(command:Extract<RoomCommand,{type:'adjust'}>)=>void|boolean|Promise<void|boolean>;onDamageSelection?:(selection:DamageSelection|null)=>void}){
 const [selected,setSelected]=useState('life'),[linkDamage,setLinkDamage]=useState(true),[includeOwn,setIncludeOwn]=useState(false);
 const trackers=compactTrackers(state,playerId,includeOwn),tracker=trackers.find(t=>t.id===selected)??trackers[0];
 useEffect(()=>{onDamageSelection?.(tracker?.field==='damage'?{key:tracker.key!,link:linkDamage}:null);},[tracker?.field,tracker?.key,linkDamage,onDamageSelection]);
 if(!tracker)return null;
 const blocked=!tableGameReady(state),profile=roomProfile(state),health=profile.health.label;
 const step=(direction:number,amount:number)=>{const n=Math.min(amount,direction<0?tracker.value-tracker.min:tracker.max-tracker.value);if(n<=0)return false;return onAdjust(trackerCommand(tracker,direction*n,linkDamage));};
 return <div className="ct-compact-controls"><label className="ct-tracker-select">Adjust<select aria-label="Choose a counter to adjust" value={tracker.id} onChange={e=>setSelected(e.target.value)}><optgroup label="Totals & counters">{trackers.filter(t=>t.field!=='damage').map(t=><option key={t.id} value={t.id}>{t.label} · {t.value}</option>)}</optgroup>{profile.sourceDamage.enabled&&<optgroup label="Incoming damage source">{trackers.filter(t=>t.field==='damage').map(t=><option key={t.id} value={t.id}>{t.label} · {t.value}</option>)}</optgroup>}</select></label>
 {tracker.field==='damage'&&<label className="ct-check ct-compact-link"><input type="checkbox" checked={linkDamage} onChange={e=>setLinkDamage(e.target.checked)}/> Also adjust {health}</label>}
 <div className="ct-tile-adjust" role="group" aria-label={`Your ${tracker.label} controls`}><HoldAdjustButton disabled={blocked||tracker.value<=tracker.min} busy={busy} tapAmount={tracker.field==='life'?(profile.health.tapAmount??1):1} holdAmount={tracker.field==='life'?(profile.health.holdAmount??10):10} label={`${tracker.field==='life'?'Lose':'Remove'} ${tracker.field==='life'?(profile.health.tapAmount??1):1} ${tracker.label}`} onStep={n=>step(-1,n)}>−</HoldAdjustButton><HoldAdjustButton disabled={blocked||!tracker.canAdd||tracker.value>=tracker.max} busy={busy} tapAmount={tracker.field==='life'?(profile.health.tapAmount??1):1} holdAmount={tracker.field==='life'?(profile.health.holdAmount??10):10} label={`${tracker.field==='life'?'Gain':'Add'} ${tracker.field==='life'?(profile.health.tapAmount??1):1} ${tracker.label}`} onStep={n=>step(1,n)}>+</HoldAdjustButton></div><small className="ct-hold-hint">Tap ±{tracker.field==='life'?(profile.health.tapAmount??1):1} · hold to repeat ±{tracker.field==='life'?(profile.health.holdAmount??10):10}</small>
 {profile.sourceDamage.enabled&&<details className="ct-source-options"><summary>Source options</summary><label className="ct-check ct-compact-link"><input type="checkbox" checked={includeOwn} onChange={e=>setIncludeOwn(e.target.checked)}/> Show my sources too · for control changes</label></details>}
 {!tracker.canAdd&&<small>Each player can track up to 8 custom counters.</small>}</div>;
}
