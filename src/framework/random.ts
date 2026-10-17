/** Deterministic, game-independent shuffle; callers persist the seed for replays. */
export function seededShuffle<T>(items:readonly T[],seed:number):T[]{let s=seed>>>0;const out=[...items];for(let i=out.length-1;i>0;i--){s=(Math.imul(s,1664525)+1013904223)>>>0;const j=Math.floor((s/4294967296)*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
