import type {Card} from '../core/types';
import type {DuelState} from '../engine/model';
import {GameService} from '../services/GameService';
/** Authority-only batching: pause at every reveal or real choice, regardless of seat. */
export function advanceUncontestedBattle(state:DuelState,catalog:readonly Card[]):DuelState{
 if(!state.pendingAttack)return state;
 const service=new GameService(),session=service.restoreOnline(state,catalog,false);let next=state;
 for(let i=0;i<8;i++){
  if(!next.pendingAttack||next.winner!==null||next.drawnGame)break;
  const actions=[...service.getLegalActions(session,0),...service.getLegalActions(session,1)];
  if(actions.length!==1||!['PASS_ATTACK_RESPONSE','ADVANCE_DAMAGE_STEP'].includes(actions[0].type))break;
  const before=next;next=service.dispatch(session,actions[0]);
  if(Object.values(next.cards).some(c=>before.cards[c.instanceId]?.faceDown&&!c.faceDown&&c.location==='monster'))break;
 }
 service.close(session);return next;
}
