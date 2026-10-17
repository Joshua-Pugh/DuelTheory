import {seededShuffle,type DuelState,type Seat} from './engine/model';

/** One unbiased toss from the session seed; a saved seed reproduces both toss and shuffle. */
export function openingCoin(seed:number):{face:'Heads'|'Tails';firstSeat:Seat}{
 const firstSeat=seededShuffle<Seat>([0,1],(seed^0x9e3779b9)>>>0)[0];
 return {face:firstSeat===0?'Heads':'Tails',firstSeat};
}
export function duelResult(state:DuelState):{title:string;reason:string}|null{
 if(state.drawnGame)return {title:'The duel is a draw',reason:'Both players have no Life Points remaining.'};
 if(state.winner===null)return null;
 const loser:Seat=state.winner===0?1:0;
 const end=[...state.events].reverse().find(e=>e.type==='DECK_OUT'||e.type==='GAME_END');
 return {title:`Player ${state.winner+1} wins`,reason:end?.type==='DECK_OUT'?`Player ${loser+1} could not draw from an empty Deck.`:state.players[loser].lp===0?`Player ${loser+1} has no Life Points remaining.`:'The duel has ended.'};
}
