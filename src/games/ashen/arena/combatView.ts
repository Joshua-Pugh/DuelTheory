import type {Battlefield} from '../../../ashenBattlefieldState';
import {canChooseAshenCombat,inspectAshenAttacker,inspectAshenBlocker} from '../duel';

export type CombatCardIntent='attack'|'target'|'block'|'unblock'|'effect-target';
export type CombatCardView={intent?:CombatCardIntent;label?:string;reason?:string;blockTarget?:string;selected?:boolean;attacking:boolean;blocking:boolean};
export function combatCardView(state:Battlefield,id:string,seat:0|1,selected:string[],target:string|null):CombatCardView{
 const c=state.table.cards[id],combat=state.rules?.duel?.combat;
 const assigned=!!combat&&Object.values(combat.blockers).some(ids=>ids.includes(id));
 const view:CombatCardView={attacking:!!combat?.attackers.includes(id)&&combat.stage!=='finished',blocking:assigned&&combat?.stage!=='finished'};
 if(!c||c.zone!=='unit')return view;
 if(canChooseAshenCombat(state,'attack')&&seat===state.table.active&&c.controller===seat){const check=inspectAshenAttacker(state,id);return {...view,...(check.allowed?{intent:'attack' as const,selected:selected.includes(id),label:selected.includes(id)?'Selected':'Can attack'}:{reason:check.reason})};}
 if(!canChooseAshenCombat(state,'block')||seat===state.table.active)return view;
 if(c.controller===state.table.active&&combat?.attackers.includes(id))return {...view,intent:'target',selected:target===id,label:target===id?'Choose a blocker':'Choose to block'};
 if(c.controller!==seat)return view;
 if(assigned)return {...view,intent:'unblock',label:'Blocking · tap to remove'};
 const legalAttackers=combat?.attackers.filter(id=>inspectAshenBlocker(state,id,c.instanceId).allowed)||[];
 if(!target&&combat?.attackers.length===1&&legalAttackers.length===0)return {...view,reason:inspectAshenBlocker(state,combat.attackers[0],id).reason};
 if(!target&&legalAttackers.length===1)return {...view,intent:'block',label:'Can block',blockTarget:legalAttackers[0]};
 if(target){const check=inspectAshenBlocker(state,target,id);return {...view,...(check.allowed?{intent:'block' as const,label:'Can block'}:{reason:check.reason})};}
 return view;
}

export type CombatLink={from:string;to:string;kind:'attack'|'block';preview:boolean};
export function combatLinks(state:Battlefield,selected:string[]):CombatLink[]{
 const c=state.rules?.duel?.combat;if(!c||c.stage==='finished')return [];
 const preview=canChooseAshenCombat(state,'attack');
 const attackers=preview?selected.filter(id=>inspectAshenAttacker(state,id).allowed):c.attackers;
 const station=state.table.piles[`${state.table.active===0?1:0}:command`][0];
 return attackers.flatMap<CombatLink>(id=>{
  if(state.table.cards[id]?.zone!=='unit')return [];
  const blockers=(c.blockers[id]||[]).filter(b=>state.table.cards[b]?.zone==='unit');
  if(blockers.length)return blockers.map(b=>({from:b,to:id,kind:'block' as const,preview:false}));
  return !c.blocked.includes(id)&&station?[{from:id,to:station,kind:'attack' as const,preview}]:[];
 });
}
