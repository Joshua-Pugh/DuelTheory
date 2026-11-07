import {describe,it,expect} from 'vitest';
import {createPractice} from './ashenPracticeScenarios';
import {ownResponsePassKey} from './ashenResponsePolicy';
import {newAshenDuel,chooseAshenOpening,submitAshenAction,passAshenPriority,setAshenResponseMode} from './games/ashen/duel';
import {moveAshenCard} from './games/ashen/adapter';
import {applyAshenCommand} from './matches/ashenCommands';
import type {Battlefield} from './ashenBattlefieldState';
function responding(){const s=createPractice(0);const d=s.rules!.duel!;d.stack=[{kind:'action',program:{version:1,id:'font',label:'Play Font',steps:[]},context:{source:'font-1',player:'0'}}];d.priority={players:['0','1'],holder:'0',passed:['1']};return s;}
describe('own response convenience',()=>{
 it('passes only the acting players own opportunity unless held',()=>{const s=responding();expect(ownResponsePassKey(s,0,false)).toBeTruthy();expect(ownResponsePassKey(s,0,true)).toBeNull();expect(ownResponsePassKey(s,1,false)).toBeNull();});
 it('preserves the opponents response opportunity',()=>{const s=responding();s.rules!.duel!.priority!.holder='1';expect(ownResponsePassKey(s,1,false)).toBeNull();});
 it('does not pass while trigger ordering or a card permission needs a choice',()=>{const s=responding();s.rules!.duel!.ordering=true;expect(ownResponsePassKey(s,0,false)).toBeNull();s.rules!.duel!.ordering=false;s.rules!.duel!.callPermission='call';expect(ownResponsePassKey(s,0,false)).toBeNull();});
});

function fixture(){let s=newAshenDuel(['Brute','Brute'],42,0);s=chooseAshenOpening(s,0,'keep');s=chooseAshenOpening(s,1,'keep');for(const seat of [0,1] as const)for(const id of [...s.table.piles[`${seat}:hand`]])moveAshenCard(s,id,'deck');return s;}
function put(s:Battlefield,slug:string,seat:0|1,zone:string){const c=Object.values(s.table.cards).find(c=>c.controller===seat&&c.cardId==='ashen-brute-'+slug)!;moveAshenCard(s,c.instanceId,zone);c.rotated=false;return c.instanceId;}
it('resolves your Font without a self-response stop, even with your own ready reactive ability',()=>{
 const s=fixture(),font=put(s,'fury-font',0,'hand');put(s,'ring-of-the-ley',0,'support');
 const next=submitAshenAction(s,font,{source:font,player:'0'});expect(next.table.cards[font].zone).toBe('ley');expect(next.rules?.duel?.priority).toBeNull();expect(next.rules?.duel?.stack).toHaveLength(0);
});
it('preserves the opponent response and your chance to answer their card, then skips redundant own passes',()=>{
 let s=fixture();const first=put(s,'ashen-strike',0,'hand'),reply=put(s,'ashen-strike',1,'hand');put(s,'ring-of-the-ley',0,'support');s.basins[0].fury=2;s.basins[1].fury=1;
 s=submitAshenAction(s,first,{source:first,player:'0',targets:[s.table.piles['1:command'][0]]});expect(s.rules?.duel?.priority?.holder).toBe('1');
 s=submitAshenAction(s,reply,{source:reply,player:'1',targets:[s.table.piles['0:command'][0]]});expect(s.rules?.duel?.priority?.holder).toBe('0');
 s=passAshenPriority(s,0);expect(s.table.health).toEqual([17,17]);expect(s.rules?.duel?.priority).toBeNull();
});
it('supports seat-scoped full control through the network command and settles when it is switched off',()=>{
 let s=fixture();const font=put(s,'fury-font',0,'hand');put(s,'ring-of-the-ley',0,'support');
 s=applyAshenCommand(s,0,{type:'responseMode',hold:true});expect(s.rules?.duel?.holdResponses).toEqual([true,false]);
 s=submitAshenAction(s,font,{source:font,player:'0'});expect(s.rules?.duel?.priority?.holder).toBe('0');
 const reloaded=JSON.parse(JSON.stringify(s));expect(reloaded.rules.duel.holdResponses).toEqual([true,false]);
 s=setAshenResponseMode(reloaded,0,false);expect(s.table.cards[font].zone).toBe('ley');expect(s.rules?.duel?.priority).toBeNull();
 expect(()=>applyAshenCommand(s,1,{type:'responseMode',hold:'yes'} as never)).toThrow();
});
