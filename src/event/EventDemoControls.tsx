import {useState} from 'react';
import TablePlayerGrid from '../TablePlayerGrid';
import TableTurnControls from '../TableTurnControls';
import {tableGameReady,type RoomCommand} from '../table/model';
import type {EventTable} from './model';
export default function EventDemoControls({table:t,busy,act}:{table:EventTable;busy:boolean;act:(input:Record<string,unknown>)=>Promise<boolean>}){
 const [choice,setChoice]=useState('');
 const demos=t.state.players.filter(p=>t.demoPlayerIds?.includes(p.id)),selected=demos.find(p=>p.id===choice)??demos[0],open=t.state.capacity-t.state.players.length;
 const at=(input:Record<string,unknown>)=>act({...input,table:t.number,round:t.round,revision:t.state.revision});
 const command=(c:RoomCommand)=>at({type:'demoCommand',playerId:selected?.id,command:c});
 return <details className="eh-demo-controls"><summary>Demo players · {demos.length} simulated seats</summary><p>Fill the empty seats so you can test with one real device. Real players can replace a demo seat by joining before the game starts. Demo players roll automatically.</p>
 {!t.state.started&&!t.finished&&<div className="ct-actions"><button disabled={busy||!open} onClick={()=>void at({type:'fillDemo',count:open})}>Fill open seats with demo players</button><button disabled={busy||!demos.length} onClick={()=>void at({type:'clearDemo'})}>Remove demo players</button></div>}
 {t.state.started&&demos.length>0&&<p>Prepare a new game to add or remove demo seats.</p>}
 {selected&&!t.finished&&!t.archived&&<><label>Control a demo player<select value={selected.id} onChange={e=>setChoice(e.target.value)}>{demos.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><p>You control the selected simulated seat below. These controls cannot change a real player’s totals.</p>{t.state.started&&<TableTurnControls state={t.state} playerId={selected.id} busy={busy} onChange={c=>void command(c)}/>}<TablePlayerGrid key={`${t.round}-${selected.id}`} state={t.state} playerId={selected.id} busy={busy} onAdjust={command}/><button disabled={busy||!tableGameReady(t.state)} onClick={()=>void command({type:'concede',value:!selected.conceded})}>{selected.conceded?'Return demo player to game':'Concede demo player'}</button></>}
 </details>;
}
