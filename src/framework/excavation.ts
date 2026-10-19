/** Reusable ordered excavation: inspect through the first stopping card without mutating the pile. */
export function excavateUntil<T>(pile:readonly T[],stop:(card:T)=>boolean):{picked:T[];hit:T|undefined}{
 const index=pile.findIndex(stop);return {picked:pile.slice(0,index<0?pile.length:index+1),hit:index<0?undefined:pile[index]};
}
