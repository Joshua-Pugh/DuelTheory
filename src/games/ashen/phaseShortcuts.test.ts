import {expect,it} from 'vitest';
import {advanceAshenTo,newBruteDuel,nextAshenPhase,declareAshenAttackers,resolveAshenCombat,passAshenPriority,resumeBruteDuel} from './duel';
import {moveAshenCard,ashenAdapter} from './adapter';
import {applyAshenCommand} from '../../matches/ashenCommands';
function setup(){const s=newBruteDuel(()=>.4);s.table.active=0;return s;}
it('skips Main I to End and still heals damage, clears essence and draws for the next player',()=>{
 const s=setup(),before=JSON.stringify(s),hand=s.table.piles['1:hand'].length;s.basins[0].fury=4;s.rules!.damage.example=2;
 const next=advanceAshenTo(s,'end');expect(next.table.active).toBe(1);expect(next.rules!.turn).toBe(2);expect(next.rules!.duel!.phase).toBe('main1');expect(next.table.piles['1:hand']).toHaveLength(hand+1);expect(next.basins[0].fury).toBe(0);expect(next.rules!.damage).toEqual({});expect(s.rules!.turn).toBe(1);expect(JSON.parse(before).table.active).toBe(0);
});
it('can skip to Main II without ending the turn or paying fatigue',()=>{
 const s=setup(),next=advanceAshenTo(s,'main2');expect(next.rules!.duel!.phase).toBe('main2');expect(next.rules!.turn).toBe(1);expect(next.table.active).toBe(0);expect(next.rules!.duel!.combat?.attackers).toEqual([]);
});
it('cannot bypass a Ready Reckless Unit, but allows a fatigued one',()=>{
 const s=setup(),unit=Object.values(s.table.cards).find(c=>c.controller===0&&c.cardId==='ashen-brute-stonehide-juggernaut')!;moveAshenCard(s,unit.instanceId,'unit');
 expect(()=>advanceAshenTo(s,'end')).toThrow('Reckless');s.table.cards[unit.instanceId].rotated=true;expect(()=>advanceAshenTo(s,'end')).not.toThrow();
});
it('cannot skip blocking or combat damage and permits End after combat finishes',()=>{
 let s=setup();const unit=Object.values(s.table.cards).find(c=>c.controller===0&&c.type==='Unit')!;moveAshenCard(s,unit.instanceId,'unit');s=declareAshenAttackers(nextAshenPhase(s),[unit.instanceId]);
 let budget=20;while(s.rules!.duel!.priority&&budget--)s=passAshenPriority(s,Number(s.rules!.duel!.priority!.holder) as 0|1);
 expect(()=>advanceAshenTo(s,'end')).toThrow('Finish the Skirmish');s=resolveAshenCombat(s);budget=20;while(s.rules!.duel!.priority&&budget--)s=passAshenPriority(s,Number(s.rules!.duel!.priority!.holder) as 0|1);
 expect(s.rules!.duel!.combat!.stage).toBe('finished');expect(advanceAshenTo(s,'end').table.active).toBe(1);
});
it('pauses an End shortcut for mandatory discard and does not skip the choice',()=>{
 const s=setup();ashenAdapter.draw(s,'0',3);const next=advanceAshenTo(s,'end');expect(next.rules!.duel!.phase).toBe('end');expect(next.rules!.pending).toBeDefined();expect(next.table.active).toBe(0);expect(()=>advanceAshenTo(next,'end')).toThrow('choice');
 const done=resumeBruteDuel(next,next.table.piles['0:hand'].slice(0,2));expect(done.table.piles['0:hand']).toHaveLength(7);expect(done.table.active).toBe(1);
});
it('validates private phase commands on the server and rejects backwards jumps',()=>{
 const s=setup();expect(()=>applyAshenCommand(s,1,{type:'phase',phase:'end'})).toThrow('Wait for your turn');expect(applyAshenCommand(s,0,{type:'phase',phase:'main2'}).rules!.duel!.phase).toBe('main2');expect(()=>advanceAshenTo(advanceAshenTo(s,'main2'),'combat')).toThrow('later phase');
});

