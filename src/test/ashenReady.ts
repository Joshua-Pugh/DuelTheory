import {newAshenDuel,newBruteDuel,chooseAshenOpening} from '../games/ashen/duel';
import type {Battlefield} from '../ashenBattlefieldState';
function keepBoth(s:Battlefield){const first=s.rules!.duel!.first;return chooseAshenOpening(chooseAshenOpening(s,first,'keep'),first===0?1:0,'keep');}
/** Effect fixtures start after both players have accepted their opening hands. */
export const readyAshenDuel=(...args:Parameters<typeof newAshenDuel>)=>keepBoth(newAshenDuel(...args));
export const readyBruteDuel=(...args:Parameters<typeof newBruteDuel>)=>keepBoth(newBruteDuel(...args));
