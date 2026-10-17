import type {Deck} from './types';

export type HandCondition = {name:string; groups:number[][]};
export type ConditionResult = {name:string; hits:number; percent:number; standardError:number};
export type HandReport = {
  deckName:string; deckSize:number; trials:number; handSize:number; seed:number;
  sampleHand:number[]; averageUnique:number; duplicateHandsPercent:number;
  conditions:ConditionResult[];
};

function prng(seed:number){let x=seed>>>0;return ()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296;};}

/** Each group is an OR list; all nonempty groups are combined using AND. */
export function qualifies(hand:readonly number[],groups:readonly (readonly number[])[]):boolean {
  return groups.length>0 && groups.every(group=>group.length>0 && group.some(id=>hand.includes(id)));
}

/** Sample without replacement; runtime scales with trials * opening hand size. */
export function runHandReport(deck:Deck, conditions:HandCondition[], trials=10000, handSize=5, seed=20261014):HandReport {
  if(!Number.isInteger(handSize)||handSize<1||deck.main.length<handSize)throw Error('Not enough cards for the requested opening hand.');
  if(!Number.isInteger(trials)||trials<1||trials>100000)throw Error('Trials must be 1–100,000.');
  if(!Number.isSafeInteger(seed))throw Error('Seed must be a safe integer.');
  if(conditions.length>20)throw Error('Too many conditions.');
  const rand=prng(seed), hits=conditions.map(()=>0);
  let totalUnique=0,duplicate=0;let sampleHand:number[]=[];
  for(let t=0;t<trials;t++){
    const cards=deck.main.slice();
    for(let i=0;i<handSize;i++){
      const j=i+Math.floor(rand()*(cards.length-i));
      [cards[i],cards[j]]=[cards[j],cards[i]];
    }
    const hand=cards.slice(0,handSize);
    if(t===0)sampleHand=hand;
    const unique=new Set(hand).size;
    totalUnique+=unique;
    if(unique<handSize)duplicate++;
    conditions.forEach((condition,index)=>{if(qualifies(hand,condition.groups))hits[index]++;});
  }
  return {
    deckName:deck.name,deckSize:deck.main.length,trials,handSize,seed,sampleHand,
    averageUnique:totalUnique/trials,duplicateHandsPercent:100*duplicate/trials,
    conditions:conditions.map((condition,i)=>{
      const p=hits[i]/trials;
      return {name:condition.name,hits:hits[i],percent:100*p,standardError:100*Math.sqrt(p*(1-p)/trials)};
    })
  };
}

// Backwards-compatible adapter for the first prototype.
export function sampleOpeningHands(deck:Deck,trials=10000,handSize=5,seed=20261014){
  const report=runHandReport(deck,[],trials,handSize,seed);
  return {...report,probabilityAtLeastOne:(ids:number[])=>runHandReport(deck,[{name:'hit',groups:[ids]}],trials,handSize,seed).conditions[0].percent,
    probabilityAllGroups:(groups:number[][])=>runHandReport(deck,[{name:'all',groups}],trials,handSize,seed).conditions[0].percent};
}
