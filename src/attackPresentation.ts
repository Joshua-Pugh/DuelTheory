import type {Card} from './core/types';
import type {DuelState,PendingAttack} from './engine/model';
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
 const attacker=state.cards[b.attackerId]?.controller??0;
 return {attack:{attackerId:b.attackerId,targetId:b.targetId,attacker,defender:attacker===0?1:0},completed:true};
}
