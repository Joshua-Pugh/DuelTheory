import type {DuelState} from './engine/model';

/** Resolving cards do not count as a back row available to respond. */
export function shouldAutoResolve(state:DuelState):boolean{
 const resolving=new Set(state.chain.map(link=>link.instanceId));
 return Boolean(state.chain.length)&&!state.pendingDiscard&&!state.pendingRandomDiscard&&!state.pendingRoll&&!state.pendingDeckChoice&&!state.pendingTriggers?.length&&!state.pendingSearch&&
  state.players.every(player=>player.zones.spell.every(id=>id===null||resolving.has(id)));
}
