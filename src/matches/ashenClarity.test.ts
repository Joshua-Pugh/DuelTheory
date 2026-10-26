import {readyAshenDuel as newAshenDuel} from '../test/ashenReady';
import {expect,it} from 'vitest';
import {applyMatchCommand,matchView,member,type Match} from './model';

import {moveAshenCard} from '../games/ashen/adapter';
it('keeps interrupted Refine server-only and authenticates each private Clarity target',()=>{
 const b=newAshenDuel(['Noble','Noble'],42,0),rune=Object.values(b.table.cards).find(c=>c.controller===0&&c.cardId==='ashen-noble-rune-of-clarity')!;moveAshenCard(b,rune.instanceId,'support');b.basins[0].oath=20;for(const c of Object.values(b.table.cards))if(c.controller===0&&c.zone==='command')moveAshenCard(b,c.instanceId,'graveyard');
 let s:Match={game:'ashen',code:'CLARITY2',phase:'playing',revision:0,chat:[],members:[member('Host',{faction:'Noble'}),member('Friend',{faction:'Noble'})],ashen:b};
 s=applyMatchCommand(s,0,{type:'ashen',action:{type:'play',source:rune.instanceId,context:{source:rune.instanceId,player:'0'},ability:'clarity-refine'}},[],42);
 let choices=0;
 for(let n=0;n<60;n++){
  const pending=s.ashen!.rules!.pending,step=pending?.flow.steps[0],priority=s.ashen!.rules!.duel!.priority;
  if(step?.op==='select'){
   choices++;expect(s.ashen!.rules!.resumeAfterTriggers).toHaveLength(1);expect(matchView(s,0,[]).ashen!.rules!.resumeAfterTriggers).toBeUndefined();const other=matchView(s,1,[]).ashen!;expect(other.rules!.pending).toBeUndefined();expect(other.rules!.resumeAfterTriggers).toBeUndefined();expect(other.table.piles['0:hand'].every(id=>other.table.cards[id].cardId==='hidden')).toBe(true);
   const ids=[s.ashen!.table.piles['1:command'][0]];expect(()=>applyMatchCommand(s,1,{type:'ashen',action:{type:'choice',ids}},[],42)).toThrow('other player');s=applyMatchCommand(s,0,{type:'ashen',action:{type:'choice',ids}},[],42);
  }else if(step?.op==='choose'){expect(choices).toBe(2);expect(s.ashen!.table.health[1]).toBe(18);s=applyMatchCommand(s,0,{type:'ashen',action:{type:'choice',ids:s.ashen!.table.piles['0:hand'].slice(0,2)}},[],42);}
  else if(priority)s=applyMatchCommand(s,Number(priority.holder) as 0|1,{type:'ashen',action:{type:'pass'}},[],42);else break;
 }
 expect(choices).toBe(2);expect(s.ashen!.table.health[1]).toBe(18);expect(s.ashen!.rules!.pending).toBeUndefined();
});
