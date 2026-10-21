import {sensibleActions} from './strategy';
import {planChaosTurn} from './planning';
import {chooseResourceHeuristic} from './resourcePolicy';
import type {Card} from '../core/types';import type {DuelState,LegalAction,Seat} from '../engine/model';import type {Decision} from './policy';
export const chooseChaosTurboHeuristic=chooseResourceHeuristic;
/** Bounded tactical planning falls back to the resource strategy at uncertain boundaries. */
export function chooseChaosTurbo(state:DuelState,legal:readonly LegalAction[],seat:Seat,catalog:readonly Card[]):Decision<LegalAction>|undefined{
 const options=sensibleActions(state,legal,seat,catalog),fallback=chooseChaosTurboHeuristic(state,options,seat,catalog);
 if(fallback&&['ACTIVATE_POT_OF_GREED','ACTIVATE_GRACEFUL_CHARITY','ACTIVATE_THUNDER_DRAGON'].includes(fallback.action.type))return fallback;
 return fallback?planChaosTurn(state,options,seat,catalog,chooseChaosTurboHeuristic)??fallback:undefined;
}
