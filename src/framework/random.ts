/** Deterministic, game-independent shuffle; callers persist the seed for replays. */
export function seededShuffle<T>(items:readonly T[],seed:number):T[]{let s=seed>>>0;const out=[...items];for(let i=out.length-1;i>0;i--){s=(Math.imul(s,1664525)+1013904223)>>>0;const j=Math.floor((s/4294967296)*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
/** Deterministic coin results with replacement; no dependency on a particular card game. */
export function seededCoinTosses(count:number,seed:number):boolean[]{
 let state=seed>>>0;return Array.from({length:count},()=>{
  state=(state+0x6D2B79F5)>>>0;let value=Math.imul(state^(state>>>15),1|state);
  value^=value+Math.imul(value^(value>>>7),61|value);
  return ((value^(value>>>14))>>>0)>=0x80000000;
 });
}
