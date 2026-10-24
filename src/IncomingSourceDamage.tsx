import {useState} from 'react';
import TableNumberInput from './TableNumberInput';
import type {DamageSelection} from './CompactCounterControls';
import {roomProfile,tableGameReady,tableSources,type RoomCommand,type TableRoomState} from './table/model';
export default function IncomingSourceDamage({state,playerId,selected,busy=false,onAdjust}:{state:TableRoomState;playerId:string;selected?:DamageSelection|null;busy?:boolean;onAdjust?:(command:Extract<RoomCommand,{type:'adjust'}>)=>void|boolean|Promise<void|boolean>}){
 const [amount,setAmount]=useState<number|null>(1);
 const me=state.players.find(p=>p.id===playerId),profile=roomProfile(state);if(!me||!profile.sourceDamage.enabled)return null;
 const sources=tableSources(state),received=Object.entries(me.damage).filter(([,n])=>n>0),source=sources.find(s=>s.key===selected?.key),damage=source?me.damage[source.key]||0:0;
 const valid=amount!==null&&Number.isInteger(amount)&&amount>=1&&amount<=999,blocked=busy||!tableGameReady(state)||!source||!onAdjust||!valid;
 const change=(delta:number)=>{if(source&&selected)void onAdjust?.({type:'adjust',field:'damage',key:source.key,delta,loseLife:selected.link});};
 return <section className="ct-incoming-damage" aria-label="Your incoming source damage"><header><strong>{me.name} · damage received</strong><small>Your received-damage list</small></header><p>Pick an incoming damage source in your card’s Adjust menu to record or correct a hit.</p>{received.length?<ul>{received.map(([key,n])=>{const entry=sources.find(s=>s.key===key);return <li key={key}><span>{entry?.name??'Source'}<small>{entry?.owner??'Unknown player'}</small></span><strong>{n}{profile.sourceDamage.defeatAt!==null?` / ${profile.sourceDamage.defeatAt}`:''}</strong></li>;})}</ul>:<p>No source damage recorded.</p>}
 <details className="ct-manual-source"><summary>Enter a damage amount</summary><p>{source?`${source.owner} · ${source.name} · ${damage} received`:'Choose an incoming damage source on your card first.'}</p><form onSubmit={e=>{e.preventDefault();if(!blocked&&damage+amount!<=999)change(amount!);}}><label>Damage amount<TableNumberInput min={1} max={999} value={amount} onChange={setAmount}/></label><button disabled={blocked||damage+(amount??0)>999}>Record damage</button><button type="button" disabled={blocked||damage<(amount??0)} onClick={()=>change(-amount!)}>Correct / remove damage</button></form>{source&&<p>{selected?.link?`${profile.health.label} adjusts with this damage.`:`${profile.health.label} is not linked to this damage.`}</p>}</details></section>;
}
