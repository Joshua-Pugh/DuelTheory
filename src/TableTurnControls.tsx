import TableFirstPlayerDice from './TableFirstPlayerDice';
import {currentTurnPlayer,tableEliminated,tableGameOver,activeTablePlayers,tableTurnsEnabled,type TableRoomState,type RoomCommand} from './table/model';

export default function TableTurnControls({state,playerId,busy,onChange}:{state:TableRoomState;playerId:string;busy:boolean;onChange:(command:RoomCommand)=>void}){
 const roll=state.firstPlayer,current=currentTurnPlayer(state),name=(id:string)=>state.players.find(p=>p.id===id)?.name||'Player';
 const over=tableGameOver(state),active=activeTablePlayers(state),me=state.players.find(p=>p.id===playerId);

 if(roll?.winner&&!over&&!tableTurnsEnabled(state))return <TableFirstPlayerDice state={state} playerId={playerId} busy={busy} onChange={onChange}/>;
 if(roll?.winner&&!over)return <><TableFirstPlayerDice state={state} playerId={playerId} busy={busy} onChange={onChange}/><section className="ct-turn-strip" aria-label="Turn order"><strong>Turn {state.turn} · {current?name(current):'Waiting'}</strong><button className="ct-primary" disabled={busy||(current!==playerId&&state.host!==playerId)} onClick={()=>onChange({type:'endTurn',turn:state.turn!})}>{current===playerId?'End my turn':'Next turn (host)'}</button><details><summary>Seat order</summary><ol className="ct-turn-order">{state.turnOrder?.map(id=><li key={id} className={state.players.some(p=>p.id===id&&tableEliminated(p,state))?'ct-out-turn':id===current?'ct-current-turn':''}>{name(id)}{id===current?' · current turn':''}</li>)}</ol></details></section></>;
 return <section className="ct-panel ct-turns" aria-label="First player and turn order">
 <h2>{over?(active[0]?`${active[0].name} wins!`:'Game over · no active players remain'):current?`Turn ${state.turn} · ${name(current)}`:'Roll to see who goes first'}</h2>
 {over?<p role="status">The game has ended. The host can start a new game. Correct an accidental entry in your controls to restore a player.</p>:<>
 {!roll?<p>Once everyone has joined, the host can lock seats and open the dice roll. Seat order follows the player list; join in your order around the table.</p>:!roll.winner?<>
 <p>{roll.round===1?'Everyone rolls a six-sided die. Highest roll goes first.':`Tie-break round ${roll.round}: only the players tied for highest roll again.`}</p>
 <TableFirstPlayerDice state={state} playerId={playerId} busy={busy} onChange={onChange}/>
 </>:<><p>{name(roll.winner)} won the roll. Turns follow seat order from that player.</p><ol className="ct-turn-order">{state.turnOrder?.map(id=>{const p=state.players.find(p=>p.id===id),out=p&&tableEliminated(p,state);return <li key={id} className={out?'ct-out-turn':id===current?'ct-current-turn':''}>{name(id)}{out?' · eliminated':id===current?' · current turn':''}</li>;})}</ol><button className="ct-primary" disabled={busy||(current!==playerId&&state.host!==playerId)} onClick={()=>onChange({type:'endTurn',turn:state.turn!})}>{current===playerId?'End my turn':'Next turn (host)'}</button><p className="ct-hint">Eliminated and conceded players are automatically skipped.</p></>}
 {me&&tableEliminated(me,state)&&<p className="ct-threshold">You are eliminated. Your controls remain available to correct accidental entries.</p>}</>}
 </section>;
}
