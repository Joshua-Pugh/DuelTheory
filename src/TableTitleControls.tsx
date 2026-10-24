import {Flag} from 'lucide-react';
import {currentTurnPlayer,sharedTableTitle,tableEliminated,tableGameReady,type RoomCommand,type TableRoomState} from './table/model';
export default function TableTitleControls({state,playerId,busy,onChange}:{state:TableRoomState;playerId:string;busy:boolean;onChange:(c:RoomCommand)=>void}){
 const marker=sharedTableTitle(state),me=state.players.find(p=>p.id===playerId),holder=state.players.find(p=>p.id===marker.holder),host=state.host===playerId;
 return <section className="ct-shared-title" aria-label="Shared table title"><div><Flag size={20}/><div><strong>{marker.label}</strong><p role="status">{holder?`Held by ${holder.name}`:'Unclaimed · choose a holder when your game calls for it'}</p></div></div>
 <div className="ct-actions">{marker.holder!==playerId&&<button disabled={busy||!tableGameReady(state)||!me||tableEliminated(me,state)} onClick={()=>onChange({type:'claimTitle',version:marker.version})}>Claim {marker.label}</button>}{holder&&(host||holder.id===playerId)&&<button disabled={busy||!tableGameReady(state)} onClick={()=>onChange({type:'releaseTitle',version:marker.version})}>Clear title</button>}</div>
 {holder&&marker.reminder&&<p className="ct-title-reminder">{currentTurnPlayer(state)===holder.id?'This turn · ':''}{holder.name}: {marker.reminder}</p>}
 {host&&<details className="ct-title-settings"><summary>Title settings</summary><form key={marker.version} onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);onChange({type:'configureTitle',version:marker.version,label:String(data.get('label')||''),reminder:String(data.get('reminder')||'')});}}><label>Shared title name<input name="label" maxLength={24} required defaultValue={marker.label}/></label><label>Optional end-of-turn reminder<input name="reminder" maxLength={120} defaultValue={marker.reminder} placeholder="Remember your title benefit"/></label><button disabled={busy}>Save title settings</button></form></details>}
 <small>A single shared marker. Claim it manually when appropriate; automatic damage and card effects do not transfer it.</small>
 </section>;
}
