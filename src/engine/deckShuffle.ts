import {seededShuffle,log,type DuelState,type Seat} from './model';
/** Authoritative, replayable search shuffle shared by local, AI and online games. */
export function shuffleSearchedDeck(s:DuelState,seat:Seat){
 const seed=(s.seed+Math.imul(s.turn,9187)+s.events.length*8719+seat*17)>>>0;
 s.players[seat].deck=seededShuffle(s.players[seat].deck,seed);
 log(s,'SHUFFLE',`Player ${seat+1} shuffled their Deck after searching.`,seat);
}
