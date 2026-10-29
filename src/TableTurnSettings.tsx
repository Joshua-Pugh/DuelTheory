import {tableTurnsEnabled,type RoomCommand,type TableRoomState} from './table/model';
export default function TableTurnSettings({state,playerId,busy,onChange}:{state:TableRoomState;playerId:string;busy:boolean;onChange:(command:RoomCommand)=>void}){
 const enabled=tableTurnsEnabled(state);
 return <details className="ct-panel ct-turn-settings" aria-label="Turn passing settings"><summary>Turn passing · {enabled?'on':'off'}</summary>
  {state.host===playerId?<label><input type="checkbox" checked={enabled} disabled={busy} onChange={e=>onChange({type:'configureTurns',enabled:e.target.checked,revision:state.revision})}/> Enable turn passing</label>:<strong>Turn passing · {enabled?'on':'off'}</strong>}
  <p>{enabled?'The current player or host can pass the turn. Eliminated players are skipped.':'Track totals without passing turns in the app. The first-player dice roll still works.'} The host can change this setting. Changing it turns off the turn timer.</p>
 </details>;
}
