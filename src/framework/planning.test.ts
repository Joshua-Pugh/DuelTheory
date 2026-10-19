import {it,expect} from 'vitest';
import {searchSequences} from './planning';
it('finds a delayed payoff instead of taking the largest immediate reward',()=>{
 const graph:Record<string,string[]>={start:['cash','setup'],setup:['win'],cash:[],win:[]};
 const result=searchSequences('start',{actions:s=>graph[s],step:(_,a)=>a,evaluate:s=>({start:0,cash:5,setup:1,win:100})[s]!,terminal:s=>!graph[s].length});
 expect(result?.action).toBe('setup');expect(result?.line).toEqual(['setup','win']);
});
it('enforces its expansion budget even when branches never terminate',()=>{
 let steps=0;
 const result=searchSequences(0,{actions:()=>[1,2,3,4,5],step:(s,a)=>{steps++;return s+a;},evaluate:s=>s,terminal:()=>false},{depth:100,width:5,nodes:13});
 expect(steps).toBe(13);expect(result?.nodes).toBe(13);
});
