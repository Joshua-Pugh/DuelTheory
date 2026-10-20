import type {Deck} from './types';
/** Preserve the registered pool and all section sizes across games. */
export function validateSideboard(original:Deck,next:Deck){
 const pool=(d:Deck)=>[...d.main,...d.extra,...d.side].sort((a,b)=>a-b).join(',');
 if(original.main.length!==next.main.length||original.extra.length!==next.extra.length||original.side.length!==next.side.length||pool(original)!==pool(next))throw Error('Exchange cards one for one from your registered Side Deck. Main, Extra and Side counts must stay the same.');
}
