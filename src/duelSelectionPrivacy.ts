import type {Card} from './core/types';
import type {DuelState,Seat} from './engine/model';
/** Never pass hidden identity, artwork, stats or effect text to a selection tile. */
export function selectionCard(state:DuelState,id:string,viewer:Seat,lookup:(id:string)=>Card|undefined):Card|undefined{
 const c=state.cards[id];
 if(c?.faceDown&&c.controller!==viewer)return {id:0,name:`Player ${c.controller+1} face-down ${c.location==='monster'?'Monster':'card'} · Zone ${(c.zone??0)+1}`,type:'Hidden card',desc:'Identity stays hidden until the rules reveal this card.'};
 return lookup(id);
}
export function materialOrigins(state:DuelState,ids:string[]):Record<string,string>{
 return Object.fromEntries(ids.map(id=>[id,state.cards[id]?.location==='monster'?'On your field':state.cards[id]?.location==='hand'?'In your hand':'In your Graveyard']));
}
