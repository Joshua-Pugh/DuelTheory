import {currentTurnPlayer,type CommanderRoomState,type RoomCommand} from './commander/model';

export default function CommanderTurnControls({state,playerId,busy,onChange}:{state:CommanderRoomState;playerId:string;busy:boolean;onChange:(command:RoomCommand)=>void}){
 const roll=state.firstPlayer,current=currentTurnPlayer(state),name=(id:string)=>state.players.find(p=>p.id===id)?.name||'Player';
 const canRoll=roll&&!roll.winner&&roll.eligible.includes(playerId)&&!Object.hasOwn(roll.rolls,playerId);
 return <section className="ct-panel ct-turns" aria-label="First player and turn order">
 <h2>{current?`Turn ${state.turn} · ${name(current)}`:'Roll to see who goes first'}</h2>
 {!roll?<p>Once everyone has joined, the host can lock seats and open the dice roll. Seat order follows the player list; join in your order around the table.</p>:!roll.winner?<>
 <p>{roll.round===1?'Everyone rolls a six-sided die. Highest roll goes first.':`Tie-break round ${roll.round}: only the players tied for highest roll again.`}</p>
 <div className="ct-roll-results" aria-live="polite">{state.players.map(p=><div key={p.id}><span className="ct-die" aria-label={roll.rolls[p.id]?`Rolled ${roll.rolls[p.id]}`:'Waiting'}>{roll.rolls[p.id]?['','⚀','⚁','⚂','⚃','⚄','⚅'][roll.rolls[p.id]]:'—'}</span><strong>{p.name}</strong><small>{roll.rolls[p.id]?`Rolled ${roll.rolls[p.id]}`:roll.eligible.includes(p.id)?'Waiting to roll':'Not in this tie-break'}</small></div>)}</div>
 <button className="ct-primary" disabled={busy||!canRoll} onClick={()=>onChange({type:'roll',round:roll.round})}>{busy?'Saving…':canRoll?'Roll to see who goes first':'Waiting for other players'}</button>
 </>:<><p>{name(roll.winner)} won the roll. Turns follow seat order from that player.</p><ol className="ct-turn-order">{state.turnOrder?.map(id=><li key={id} className={id===current?'ct-current-turn':''}>{name(id)}{id===current?' · current turn':''}{state.players.find(p=>p.id===id)?.conceded?' · conceded':''}</li>)}</ol><button className="ct-primary" disabled={busy||(current!==playerId&&state.host!==playerId)||state.players.filter(p=>!p.conceded).length<2} onClick={()=>onChange({type:'endTurn',turn:state.turn!})}>{current===playerId?'End my turn':'Next turn (host)'}</button><p className="ct-hint">Conceded players are skipped. Life and counter notices do not automatically remove players.</p></>}
 </section>;
}
