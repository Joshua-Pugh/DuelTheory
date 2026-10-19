/** Game-independent policy boundary: adapters supply observations and already legal actions. */
export type Decision<A>={action:A;reason:string};
export function bestLegalAction<O,A>(observation:O,actions:readonly A[],score:(observation:O,action:A)=>{value:number;reason:string}):Decision<A>|undefined{
 let best:Decision<A>|undefined,value=-Infinity;
 for(const action of actions){const candidate=score(observation,action);if(candidate.value>value){value=candidate.value;best={action,reason:candidate.reason};}}
 return best;
}
