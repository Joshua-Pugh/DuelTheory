import type {Battlefield} from '../../../ashenBattlefieldState';

export default function AshenClashQueue({state,onInspect}:{state:Battlefield;onInspect:(id:string)=>void}){
  const duel=state.rules?.duel;
  if(!duel?.stack.length)return null;
  return <section className="ab-clash-queue" aria-label="The Clash"><strong>CLASH</strong><ol>{[...duel.stack].reverse().map((entry,index)=>{
    const card=state.table.cards[entry.context.source];
    return <li key={entry.key||`${entry.program.id}-${index}`}><button disabled={!card} onClick={()=>onInspect(entry.context.source)}><small>{index===0?'Next to resolve':`Then ${index+1}`} · P{Number(entry.context.player)+1}</small><span>{card?.name||entry.program.label}</span></button></li>;
  })}</ol></section>;
}
