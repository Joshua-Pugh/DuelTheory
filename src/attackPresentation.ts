import type {Card} from './core/types';
import type {DuelState,PendingAttack} from './engine/model';
export function attackPresentation(state:DuelState,catalog:ReadonlyMap<number,Card>,attack:PendingAttack|undefined=state.pendingAttack){
 if(!attack)return null;const attacker=state.cards[attack.attackerId];if(!attacker||attacker.faceDown)return null;
 const attackerName=attacker.token?'Sheep Token':catalog.get(attacker.cardId)?.name??'Attacking monster';const target=attack.targetId?state.cards[attack.targetId]:undefined;
 const targetName=attack.targetId?(target?.faceDown?`face-down monster (Zone ${(target.zone??0)+1})`:catalog.get(target?.cardId??0)?.name??'target monster'):`Player ${attack.defender+1} · direct attack`;
 return {attackerName,targetName,label:attack.replay?`Attack replay · ${attackerName}: choose a new target`:`${attackerName} → ${targetName}`};
}
export function attackPath(from:{x:number;y:number},to:{x:number;y:number}){const mid=(from.y+to.y)/2;return `M ${from.x} ${from.y} C ${from.x} ${mid}, ${to.x} ${mid}, ${to.x} ${to.y}`;}
