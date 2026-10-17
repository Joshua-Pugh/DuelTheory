import type {Card,Deck} from './types';

export type Role='starter'|'setup'|'payoff'|'defense'|'utility'|'dead';
export type Roles=Record<number,Role[]>;
export type QualityRules={minStarter:number;minActionable:number;maxDead:number;maxCopiesSameName:number};
export const GOAT_BASELINE:QualityRules={minStarter:1,minActionable:2,maxDead:1,maxCopiesSameName:2};
export type QualityResult={trials:number;seed:number;brickPercent:number;playablePercent:number;strongPercent:number;brickCount:number;reasons:{reason:string;count:number;percent:number}[];roleCoverage:{role:Role;percent:number}[]};
export const ROLE_NAMES:Role[]=['starter','setup','payoff','defense','utility','dead'];

/** Editable *heuristics*, not official rulings. Never infer legal combos from roles. */
export function inferRoles(card:Card):Role[]{
 const n=card.name.toLowerCase(), t=card.type.toLowerCase();
 if(/dark master - zorc|shinato, king of a higher plane|the masked beast/.test(n))return ['payoff','dead'];
 if(/contract with the abyss|shinato's ark/.test(n))return ['setup'];
 if(/manju of the ten thousand hands|senju of the thousand hands|sangan|magician of faith|gravekeeper's spy|dekoichi|mystic tomato|shining angel|apprentice magician/.test(n))return ['starter'];
 if(/thunder dragon|graceful charity|pot of greed|morphing jar|reinforcement of the army/.test(n))return ['starter','setup'];
 if(/chaos sorcerer|black luster soldier - envoy/.test(n))return ['payoff'];
 if(/mirror force|torrential tribute|sakuretsu armor|book of moon|scapegoat|ring of destruction/.test(n))return ['defense'];
 if(/spell|trap/.test(t))return ['utility'];
 if(/monster/.test(t)&& (card.level||0)>=7)return ['payoff','dead'];
 if(/monster/.test(t))return ['starter'];
 return ['utility'];
}
function rng(seed:number){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function sample(deck:readonly number[],size:number,random:()=>number){const arr=deck.slice();for(let i=0;i<size;i++){let j=i+Math.floor(random()*(arr.length-i));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr.slice(0,size);}
export function evaluateHand(hand:number[],roles:Roles,rules:QualityRules){
 const has=(role:Role)=>hand.filter(id=>(roles[id]||[]).includes(role)).length;
 const start=has('starter'),actionable=hand.filter(id=>(roles[id]||[]).some(r=>r==='starter'||r==='setup'||r==='defense'||r==='utility')).length;
 const dead=has('dead');const copies=Math.max(0,...Object.values(hand.reduce<Record<number,number>>((o,id)=>(o[id]=(o[id]||0)+1,o),{})));
 const reasons:string[]=[];
 if(start<rules.minStarter)reasons.push('Insufficient starters');
 if(actionable<rules.minActionable)reasons.push('Too few actionable cards');
 if(dead>rules.maxDead)reasons.push('Too many conditional/dead draws');
 if(copies>rules.maxCopiesSameName)reasons.push('Excess duplicate copies');
 return {brick:reasons.length>0,strong:reasons.length===0&&start>=2&&actionable>=3,reasons};
}
export function analyzeQuality(deck:Deck,catalog:Map<number,Card>,overrides:Roles={},rules:QualityRules=GOAT_BASELINE,trials=10000,seed=20261014):QualityResult {
 if(deck.main.length<5)throw Error('Main Deck must have at least five cards');
 if(!Number.isInteger(trials)||trials<1||trials>100000)throw Error('Trials must be 1–100,000');
 const roles:Roles={};for(const id of new Set(deck.main))roles[id]=overrides[id]||inferRoles(catalog.get(id)||{id,name:`Unknown ${id}`,type:'Unknown',desc:''});
 const random=rng(seed),reasonCounts=new Map<string,number>(),coverage=Object.fromEntries(ROLE_NAMES.map(role=>[role,0])) as Record<Role,number>;
 let bricks=0,strong=0;
 for(let t=0;t<trials;t++){
  const hand=sample(deck.main,5,random),quality=evaluateHand(hand,roles,rules);
  if(quality.brick)bricks++;if(quality.strong)strong++;
  quality.reasons.forEach(reason=>reasonCounts.set(reason,(reasonCounts.get(reason)||0)+1));
  for(const role of ROLE_NAMES)if(hand.some(id=>roles[id].includes(role)))coverage[role]++;
 }
 return {trials,seed,brickPercent:bricks/trials*100,playablePercent:(trials-bricks)/trials*100,strongPercent:strong/trials*100,brickCount:bricks,
  reasons:[...reasonCounts].map(([reason,count])=>({reason,count,percent:100*count/trials})).sort((a,b)=>b.count-a.count),
  roleCoverage:ROLE_NAMES.map(role=>({role,percent:coverage[role]/trials*100}))};
}
export type Swap={out:number;in:number;before:number;after:number;delta:number;explanation:string};
/** Controlled comparisons use identical seeds; results are heuristic and not wins. */
export function testSwaps(deck:Deck,catalog:Map<number,Card>,overrides:Roles,rules:QualityRules,candidates:number[],trials=2500,seed=20261014):Swap[]{
 const base=analyzeQuality(deck,catalog,overrides,rules,trials,seed).brickPercent;
 const owned=new Set(deck.main), outgoing=[...owned].slice(0,30);
 const out:Swap[]=[];
 for(const add of candidates.filter(id=>!owned.has(id)).slice(0,20)){
  const card=catalog.get(add);if(!card||/Fusion|Synchro|Xyz|Link|Pendulum/i.test(card.type))continue;
  for(const remove of outgoing){
   const original=catalog.get(remove);if(!original)continue;
   const currentCount=deck.main.filter(id=>id===add).length;if(currentCount>=3)continue;
   const modified=deck.main.slice();modified.splice(modified.indexOf(remove),1,add);
   const after=analyzeQuality({...deck,main:modified},catalog,overrides,rules,trials,seed).brickPercent;
   const delta=after-base;
   if(delta< -0.1)out.push({out:remove,in:add,before:base,after,delta,explanation:`Possible role coverage improvement: ${inferRoles(card).join('/')} replacing ${inferRoles(original).join('/')}. Check GOAT legality and strategy fit.`});
  }
 }
 return out.sort((a,b)=>a.delta-b.delta).slice(0,8);
}
