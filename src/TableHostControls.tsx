import {useState} from 'react';
import type {TableRoomState,RoomCommand} from './table/model';
export default function TableHostControls({state,playerId,busy,onChange}:{state:TableRoomState;playerId:string;busy:boolean;onChange:(command:RoomCommand)=>void}){
 const [chosen,setChosen]=useState('');
 if(state.host!==playerId)return null;
 const players=state.players.filter(p=>p.id!==playerId),valid=players.some(p=>p.id===chosen);
 return <details className="ct-panel ct-host-settings"><summary>Hosting · pass host or close table</summary>
  <p>Closing this table disconnects everyone. Pass hosting first if the others want to keep playing. A lost connection or closed app does not end the table.</p>
  <label>New host<select value={valid?chosen:''} disabled={busy||!players.length} onChange={e=>setChosen(e.target.value)}><option value="">Choose a player</option>{players.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
  <button disabled={busy||!valid} onClick={()=>{const next=players.find(p=>p.id===chosen);if(next&&window.confirm(`Pass hosting to ${next.name}? They will control table settings and room closure.`))onChange({type:'transferHost',playerId:chosen,revision:state.revision});}}>Pass host</button>
 </details>;
}
