import type {DuelState,LegalAction,Seat} from './engine/model';

/** Always use freshly generated legal attacks, including restrictions and remaining attacks. */
export function quickAttacks(actions:LegalAction[],seat:Seat,id?:string){
 return actions.filter(a=>a.type==='DECLARE_ATTACK'&&a.seat===seat&&(!id||a.attackerId===id));
}
export function directAttackQueue(state:DuelState,actions:LegalAction[],seat:Seat):string[]{
 if(state.current!==seat||state.phase!=='BATTLE'||state.winner!==null||state.drawnGame||state.players[seat===0?1:0].zones.monster.some(Boolean))return [];
 return [...new Set(quickAttacks(actions,seat).filter(a=>a.type==='DECLARE_ATTACK'&&!a.targetId).map(a=>a.type==='DECLARE_ATTACK'?a.attackerId:''))];
}
