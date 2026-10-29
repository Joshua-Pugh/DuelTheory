import {useEffect,useState} from 'react';
import TableNumberInput from './TableNumberInput';
import {currentTurnPlayer,tableGameOver,tableGameReady,tableTurnsEnabled,type RoomCommand,type TableRoomState} from './table/model';
import {defaultTurnTimer,timerText,turnTimeRemaining} from './table/timer';
export default function TableTurnTimer({state,playerId,busy,serverOffset=0,onChange}:{state:TableRoomState;playerId:string;busy:boolean;serverOffset?:number;onChange:(command:RoomCommand)=>void}){
 const timer=state.timer??defaultTurnTimer(),host=state.host===playerId,active=tableGameReady(state)&&!tableGameOver(state);
 const [minutes,setMinutes]=useState<number|null>(()=>timer.durationSeconds?timer.durationSeconds/60:3),[now,setNow]=useState(()=>Date.now());
 useEffect(()=>{if(!timer.durationSeconds)return;setNow(Date.now());const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id);},[timer.durationSeconds]);
 if(!tableTurnsEnabled(state)||(!timer.durationSeconds&&!host))return null;
 const remaining=turnTimeRemaining(timer,now+serverOffset),expired=active&&remaining===0,canControl=active&&(host||currentTurnPlayer(state)===playerId);
 const send=(mode:'pause'|'resume'|'restart')=>onChange({type:'timer',version:timer.version,turn:state.turn!,mode});
 return <section className={`ct-turn-timer${expired?' ct-time-up':''}`} aria-label="Optional turn timer">
 {Boolean(timer.durationSeconds)&&<><div><span className="eyebrow">TURN TIMER</span><output aria-label="Time remaining">{timerText(remaining)}</output><small role="status">{!active?'Waiting for an active turn':expired?'Time up · end the turn when ready':timer.runningSince===undefined?'Paused':'Running'}</small></div>{canControl&&<div className="ct-actions"><button disabled={busy||remaining===0} onClick={()=>send(timer.runningSince===undefined?'resume':'pause')}>{timer.runningSince===undefined?'Resume timer':'Pause timer'}</button><button disabled={busy} onClick={()=>send('restart')}>Restart timer</button></div>}<p>No automatic turn changes or penalties.</p></>}
 {host&&<details className="ct-timer-settings"><summary>Turn timer settings · {timer.durationSeconds?`${timer.durationSeconds/60} minutes`:'off'}</summary><form onSubmit={e=>{e.preventDefault();if(minutes!==null&&Number.isInteger(minutes)&&minutes>=1&&minutes<=120)onChange({type:'configureTimer',version:timer.version,durationSeconds:minutes*60});}}><label>Minutes per turn<TableNumberInput value={minutes} onChange={setMinutes} min={1} max={120}/></label><button disabled={busy||minutes===null||!Number.isInteger(minutes)||minutes<1||minutes>120}>Set turn timer</button>{Boolean(timer.durationSeconds)&&<button type="button" disabled={busy} onClick={()=>onChange({type:'configureTimer',version:timer.version,durationSeconds:0})}>Turn timer off</button>}</form><p>Starts with the first turn and resets for each new turn. The host or current player can pause it.</p></details>}
 </section>;
}
