import {readyAshenDuel as newAshenDuel} from '../../test/ashenReady';
import {expect,it} from 'vitest';
import {ashenActionCost,moveAshenCard} from './adapter';
import {submitAshenAction,passAshenPriority,resumeBruteDuel,advanceAshenTo} from './duel';
function setup(seat:0|1=0){const s=newAshenDuel(['Noble','Noble'],42,seat);for(const c of Object.values(s.table.cards))if(c.zone==='command')moveAshenCard(s,c.instanceId,'graveyard');s.basins[seat].oath=99;const rune=Object.values(s.table.cards).find(c=>c.controller===seat&&c.cardId==='ashen-noble-rune-of-clarity')!;moveAshenCard(s,rune.instanceId,'support');return {s,id:rune.instanceId};}
it('resolves one Clarity trigger per Refine draw before returning to bottom-deck selection in either seat',()=>{
 for(const seat of [0,1] as const){
  const {s,id}=setup(seat),other=seat===0?1:0,station=Object.values(s.table.cards).find(c=>c.owner===other&&c.type==='Command Station')!;moveAshenCard(s,station.instanceId,'command');
  const count=s.table.piles[`${seat}:hand`].length,deck=s.table.piles[`${seat}:deck`].length;
  let next=submitAshenAction(s,id,{player:String(seat),source:id},'clarity-refine'),targets=0,bottom=false;
  for(let n=0;n<80;n++){
   const flow=next.rules?.pending?.flow,step=flow?.steps[0];
   if(flow&&step?.op==='select'){
    expect(flow.context.player).toBe(String(seat));expect(flow.context.source).toBe(id);expect(bottom).toBe(false);targets++;
    next=resumeBruteDuel(next,[station.instanceId]);
   }else if(flow&&step?.op==='choose'){
    expect(targets).toBe(2);expect(next.table.health[other]).toBe(18);expect(next.table.piles[`${seat}:hand`]).toHaveLength(count+2);expect(next.table.piles[`${seat}:deck`]).toHaveLength(deck-2);bottom=true;
    next=resumeBruteDuel(next,next.table.piles[`${seat}:hand`].slice(0,2));
   }else if(next.rules!.duel!.priority)next=passAshenPriority(next,Number(next.rules!.duel!.priority!.holder) as 0|1);
   else break;
  }
  expect(targets).toBe(2);expect(bottom).toBe(true);expect(next.table.health[other]).toBe(18);expect(next.table.piles[`${seat}:hand`]).toHaveLength(count);expect(next.rules!.nobleMarks?.[seat]?.refined).toBe(1);expect(next.rules!.resumeAfterTriggers||[]).toHaveLength(0);expect(next.table.events.filter(e=>e.startsWith('Triggered:')&&e.includes('Rune of Clarity'))).toHaveLength(2);
 }
});
it('counts the start-of-turn draw and does not damage the Station until its selected trigger resolves',()=>{
 const {s,id}=setup(1),station=Object.values(s.table.cards).find(c=>c.owner===0&&c.type==='Command Station')!;moveAshenCard(s,station.instanceId,'command');s.table.active=0;s.rules!.duel!.phase='main2';
 let next=advanceAshenTo(s,'end');expect(next.rules!.pending!.flow.context.source).toBe(id);expect(next.table.health[0]).toBe(20);next=resumeBruteDuel(next,[station.instanceId]);for(let n=0;n<20&&next.rules!.duel!.priority;n++)next=passAshenPriority(next,Number(next.rules!.duel!.priority!.holder) as 0|1);expect(next.table.health[0]).toBe(19);expect(next.rules!.duel!.phase).toBe('main1');
});
it('uses a single capped Command discount calculation for UI and payment',()=>{
 const {s}=setup(),card=Object.values(s.table.cards).find(c=>c.controller===0&&c.cardId==='ashen-noble-high-strategist')!;if(card.zone!=='hand')moveAshenCard(s,card.instanceId,'hand');const base=ashenActionCost(s,card.instanceId);expect(base.isCommand).toBe(true);
 s.rules!.nobleMarks={0:{planned:1,refined:1},1:{planned:90}};const cost=ashenActionCost(s,card.instanceId);expect(cost.reduction).toBe(Math.min(2,base.printed.untuned||0));expect(cost.payable.oath).toBe(base.printed.oath);s.rules!.nobleMarks[0]={planned:99};expect(ashenActionCost(s,card.instanceId).payable.untuned).toBe(0);expect(ashenActionCost(s,card.instanceId).reduction).toBe(base.printed.untuned);
});
it('handles an extra Bastion draw without replaying Refine or its original draw triggers',()=>{
 const {s,id}=setup(),ownStation=Object.values(s.table.cards).find(c=>c.owner===0&&c.type==='Command Station')!,enemy=Object.values(s.table.cards).find(c=>c.owner===1&&c.type==='Command Station')!;moveAshenCard(s,ownStation.instanceId,'command');moveAshenCard(s,enemy.instanceId,'command');const hand=s.table.piles['0:hand'].length;
 let next=submitAshenAction(s,id,{player:'0',source:id},'clarity-refine'),targets=0,bottom=0;
 for(let n=0;n<100;n++){
  const flow=next.rules?.pending?.flow,step=flow?.steps[0];
  if(flow&&step?.op==='select'){targets++;next=resumeBruteDuel(next,[enemy.instanceId]);}
  else if(flow&&step?.op==='mode')next=resumeBruteDuel(next,['draw']);
  else if(flow&&step?.op==='choose'){bottom++;expect(targets).toBe(3);next=resumeBruteDuel(next,next.table.piles['0:hand'].slice(0,2));}
  else if(next.rules!.duel!.priority)next=passAshenPriority(next,Number(next.rules!.duel!.priority!.holder) as 0|1);else break;
 }
 expect(targets).toBe(3);expect(bottom).toBe(1);expect(next.table.health[1]).toBe(17);expect(next.table.piles['0:hand']).toHaveLength(hand+1);expect(next.rules!.nobleMarks?.[0]?.refined).toBe(1);
});
