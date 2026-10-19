/** Bounded beam search. Game adapters own simulation, observation and evaluation. */
export function searchSequences<S,A>(initial:S,adapter:{actions:(s:S)=>readonly A[];step:(s:S,a:A)=>S|undefined;evaluate:(s:S)=>number;terminal:(s:S)=>boolean},limits={depth:4,width:4,nodes:80}){
 type Node={state:S;first?:A;line:A[];value:number};
 let frontier:Node[]=[{state:initial,line:[],value:adapter.evaluate(initial)}],best:Node|undefined,nodes=0;
 for(let depth=0;depth<limits.depth&&frontier.length&&nodes<limits.nodes;depth++){
  const next:Node[]=[];
  for(const node of frontier){
   if(adapter.terminal(node.state))continue;
   for(const action of adapter.actions(node.state)){
    if(nodes>=limits.nodes)break;nodes++;
    const state=adapter.step(node.state,action);if(!state)continue;
    const child:Node={state,first:node.first??action,line:[...node.line,action],value:adapter.evaluate(state)};
    if(!best||child.value>best.value)best=child;
    if(!adapter.terminal(state))next.push(child);
   }
  }
  frontier=next.sort((a,b)=>b.value-a.value).slice(0,limits.width);
 }
 return best?.first===undefined?undefined:{action:best.first,line:best.line,value:best.value,nodes};
}
