import type {Deck,GameAction,GamePhase,GameState,PlayerState} from './types';
const phases:GamePhase[]=['DRAW','STANDBY','MAIN_1','BATTLE','MAIN_2','END'];
const makePlayer=(deck:Deck):PlayerState=>({lifePoints:8000,hand:[],deck:[...deck.main],graveyard:[],banished:[],monsters:Array(5).fill(null),spells:Array(5).fill(null)});
export function createGame(player1:Deck,player2:Deck):GameState{return {formatId:'goat-2005',turn:1,currentPlayer:0,phase:'DRAW',players:[makePlayer(player1),makePlayer(player2)],log:['Game initialized (manual sandbox prototype).']};}
export function applyAction(state:GameState,action:GameAction):GameState{
  const copy:GameState=structuredClone(state);
  if(action.type==='DRAW'){
    if(action.player!==state.currentPlayer)throw Error('Only active player may draw via this control.');
    for(let i=0;i<action.count;i++){const id=copy.players[action.player].deck.shift();if(id!==undefined)copy.players[action.player].hand.push(id);}
    copy.log.push(`Player ${action.player+1} drew ${action.count} (or remaining) card(s).`);
  } else if(action.type==='ADJUST_LP'){
    const player=copy.players[action.player];player.lifePoints=Math.max(0,player.lifePoints+action.amount);copy.log.push(`Player ${action.player+1} LP adjusted by ${action.amount}.`);
  } else {
    const i=phases.indexOf(copy.phase);if(i===phases.length-1){copy.phase='DRAW';copy.currentPlayer=copy.currentPlayer===0?1:0;copy.turn++;}else copy.phase=phases[i+1];
    copy.log.push(`Turn ${copy.turn}: Player ${copy.currentPlayer+1} — ${copy.phase}`);
  }
  return copy;
}
