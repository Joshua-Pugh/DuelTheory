import {getCard,type DuelState,type EngineContext} from './engine/model';
import {battleAttack} from './engine/ritualDeckEffects';
import {restrictStat} from './engine/goatControlEffects';
export function monsterReadout(state:DuelState,id:string,ctx:EngineContext){
 const c=state.cards[id];if(!c||c.location!=='monster'||c.faceDown||!c.token&&!ctx.cards.has(c.cardId))return null;
 try{const card=getCard(state,id,ctx),attack=battleAttack(state,id,ctx),defense=restrictStat(state,id,'def',ctx)??Number(card.def);return {attack:Number.isFinite(attack)?attack:'?',defense:Number.isFinite(defense)?defense:'?'};}catch{return null;} // A masked absorbed Equip must not expose its private stats.
}
export function battleSummary(state:DuelState,ctx:EngineContext){const b=state.lastBattle;if(!b||b.turn!==state.turn)return null;const name=(id:string)=>{const c=state.cards[id];return c&&(c.token||ctx.cards.has(c.cardId))?getCard(state,id,ctx).name:'Monster';};return b.damage>0?`${name(b.sourceId)} dealt ${b.damage.toLocaleString()} battle damage to Player ${b.damagedSeat+1}.`:`${name(b.attackerId)} ${b.targetId?'battled '+name(b.targetId):'attacked directly'} · no LP damage.`;}
