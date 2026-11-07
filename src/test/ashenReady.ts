import {newAshenDuel,newBruteDuel,chooseAshenOpening} from '../games/ashen/duel';
import type {Battlefield} from '../ashenBattlefieldState';
function keepBoth(s:Battlefield){const first=s.rules!.duel!.first;s.rules!.duel!.holdResponses=[true,true];return chooseAshenOpening(chooseAshenOpening(s,first,'keep'),first===0?1:0,'keep');}
/** Effect fixtures use full control to exercise every legal response and paid-cost boundary. Production duels default to passing own plays. */
export const readyAshenDuel=(...args:Parameters<typeof newAshenDuel>)=>keepBoth(newAshenDuel(...args));
export const readyBruteDuel=(...args:Parameters<typeof newBruteDuel>)=>keepBoth(newBruteDuel(...args));
