import type {Battlefield} from '../ashenBattlefieldState';
import type {EffectContext} from '../framework';
import {submitAshenAction,resumeBruteDuel,burnInBruteDuel,nextAshenPhase,passAshenPriority,declareAshenAttackers,assignAshenBlocker,clearAshenBlockers,resolveAshenCombat,orderAshenTrigger,confirmAshenTriggerOrder,chooseKorgathForCall} from '../games/ashen/duel';
import {pendingAshenChoices} from '../games/ashen/adapter';
export type AshenCommand={type:'play';source:string;context:EffectContext;ability?:string}|{type:'choice';ids:string[]}|{type:'burn';id:string}|{type:'next'|'pass'|'clearBlockers'|'combat'|'confirmOrder'}|{type:'attack';ids:string[]}|{type:'block';attacker:string;blocker:string}|{type:'order';index:number}|{type:'call';id:string|null};
export function applyAshenCommand(s:Battlefield,seat:0|1,c:AshenCommand){
 const d=s.rules?.duel;if(!d||d.winner!==undefined)throw Error('The duel is not active.');
 const active=()=>{if(s.table.active!==seat)throw Error('Wait for your turn.');};
 if(c.type==='play'){if(c.context.player!==String(seat)||c.context.source!==c.source||s.table.cards[c.source]?.controller!==seat)throw Error('Use your own cards.');return submitAshenAction(s,c.source,c.context,c.ability);}
 if(c.type==='choice'){if(pendingAshenChoices(s)?.context.player!==String(seat))throw Error('This choice belongs to the other player.');return resumeBruteDuel(s,c.ids);}
 if(c.type==='burn')return burnInBruteDuel(s,c.id,seat);
 if(c.type==='pass')return passAshenPriority(s,seat);
 if(['block','clearBlockers','combat'].includes(c.type)){if(s.table.active===seat)throw Error('Only the defender assigns blockers.');if(c.type==='block'&&s.table.cards[c.blocker]?.controller!==seat)throw Error('Use your own blocker.');}
 else active();
 switch(c.type){case 'next':return nextAshenPhase(s);case 'attack':return declareAshenAttackers(s,c.ids);case 'block':return assignAshenBlocker(s,c.attacker,c.blocker);case 'clearBlockers':return clearAshenBlockers(s);case 'combat':return resolveAshenCombat(s);case 'order':return orderAshenTrigger(s,c.index);case 'confirmOrder':return confirmAshenTriggerOrder(s);case 'call':return chooseKorgathForCall(s,c.id);default:throw Error('Unknown action.');}
}
