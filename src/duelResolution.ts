import type {DuelState,LegalAction} from './engine/model';

/** Resolving cards do not count as a back row available to respond. */
export function shouldAutoResolve(state:DuelState,actions?:LegalAction[]):boolean{
 if(actions)return Boolean(state.chain.length)&&Boolean(unopposedResponse(actions));
 const resolving=new Set(state.chain.map(link=>link.instanceId));
 return Boolean(state.chain.length)&&!state.pendingLightChoice&&!state.pendingDiscard&&!state.pendingRandomDiscard&&!state.pendingRoll&&!state.pendingDeckChoice&&!state.pendingTriggers?.length&&!state.pendingSearch&&
  state.players.every(player=>player.zones.spell.every(id=>id===null||resolving.has(id)));
}

/** Mandatory choices and actual card responses are never silently passed. */
export function unopposedResponse(actions:LegalAction[]):LegalAction|undefined{
 const passes=['PASS_CHAIN','RESOLVE_CHAIN','PASS_ATTACK_RESPONSE','PASS_SUMMON_RESPONSE','PASS_FREE_RESPONSE'];
 if(!actions.length||actions.some(a=>!passes.includes(a.type)))return;
 return actions.find(a=>a.type!=='RESOLVE_CHAIN')??actions[0];
}
