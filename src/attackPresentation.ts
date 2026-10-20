import type {Card} from './core/types';
import type {DuelState,PendingAttack,BattleResult} from './engine/model';
export function attackPresentation(state:DuelState,catalog:ReadonlyMap<number,Card>,attack:PendingAttack|undefined=state.pendingAttack){
 if(!attack)return null;const attacker=state.cards[attack.attackerId];if(!attacker||attacker.faceDown)return null;
 const attackerName=attacker.token?'Sheep Token':catalog.get(attacker.cardId)?.name??'Attacking monster';const target=attack.targetId?state.cards[attack.targetId]:undefined;
 const targetName=attack.targetId?(target?.faceDown?`face-down monster (Zone ${(target.zone??0)+1})`:catalog.get(target?.cardId??0)?.name??'target monster'):`Player ${attack.defender+1} · direct attack`;
 return {attackerName,targetName,label:attack.replay?`Attack replay · ${attackerName}: choose a new target`:`${attackerName} → ${targetName}`};
}
export function attackPath(from:{x:number;y:number},to:{x:number;y:number}){const mid=(from.y+to.y)/2;return `M ${from.x} ${from.y} C ${from.x} ${mid}, ${to.x} ${mid}, ${to.x} ${to.y}`;}

/** Derived from authority state, so fast online snapshots and reconnects cannot miss a timer. */
export function battleVisual(state:DuelState):{attack:PendingAttack;completed:boolean}|null{
 if(state.phase!=='BATTLE')return null;
 if(state.pendingAttack)return {attack:state.pendingAttack,completed:false};
 const b=state.lastBattle;if(!b||b.turn!==state.turn)return null;
 let declaration=-1;for(let i=state.events.length-1;i>=0;i--){if(state.events[i].type==='ATTACK_DECLARE'){declaration=i;break;}}
 if(declaration>=b.eventIndex)return null; // A newer attack was canceled; do not revive the older line.
 const attacker=b.attackerSeat??state.cards[b.attackerId]?.controller??0;
 return {attack:{attackerId:b.attackerId,targetId:b.targetId,attacker,defender:attacker===0?1:0},completed:true};
}

export type BattleVisual={attack:PendingAttack;completed:boolean;result?:BattleResult;key:string};
/** Room snapshots carry the completed attacks, so multiple attacks between polls remain visible. */
export function battleVisuals(state:DuelState):BattleVisual[]{
 if(state.phase!=='BATTLE')return [];
 if(!state.battleHistory?.length){const v=battleVisual(state);return v?[{...v,result:v.completed?state.lastBattle:undefined,key:v.completed?`battle-${state.lastBattle?.eventIndex}`:'active'}]:[];}
 const pending=state.pendingAttack;let declaration=-1;for(let i=state.events.length-1;i>=0;i--)if(state.events[i].type==='ATTACK_DECLARE'){declaration=i;break;}
 const result:BattleVisual[]=state.battleHistory.filter(b=>b.turn===state.turn&&!(pending&&b.attackerId===pending.attackerId&&b.eventIndex>declaration)).map(b=>{const attacker=b.attackerSeat??state.cards[b.attackerId]?.controller??0;return {attack:{attackerId:b.attackerId,targetId:b.targetId,attacker,defender:attacker===0?1:0},completed:true,result:b,key:`${b.turn}-${b.eventIndex}-${b.attackerId}`};});
 if(pending)result.push({attack:pending,completed:false,key:'active'});
 return result;
}
