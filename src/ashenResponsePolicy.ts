import type {Battlefield} from './ashenBattlefieldState';
/** Convenience passing only; it never changes which responses the engine permits. */
export function ownResponsePassKey(state:Battlefield,seat:0|1,hold:boolean){
 const d=state.rules?.duel,p=d?.priority,top=d?.stack.at(-1);
 if(hold||state.rules?.pending||d?.ordering||d?.callPermission||!p||!top||p.holder!==String(seat)||top.context.player!==String(seat))return null;
 return [top.key,top.context.source,d.stack.length,p.passed.join(',')].join(':');
}
