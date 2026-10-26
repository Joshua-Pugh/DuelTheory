import {describe,expect,it} from 'vitest';
import {ashenVisualEvents} from '../../ashenVisualEvents';
import {newAshenDuel,chooseAshenOpening,ashenOpeningPlayer,advanceAshenTo,nextAshenPhase,inspectAshenAction,burnInBruteDuel} from './duel';
import {applyAshenCommand} from '../../matches/ashenCommands';
import {applyMatchCommand,matchView,member,startMatch,type Match} from '../../matches/model';
import type {Battlefield} from '../../ashenBattlefieldState';

const setup=(first:0|1=0)=>newAshenDuel(['Brute','Noble'],42,first);
function audit(s:Battlefield,seat:0|1,size:number){
 const hand=s.table.piles[`${seat}:hand`],deck=s.table.piles[`${seat}:deck`];
 expect(hand).toHaveLength(size);expect(deck).toHaveLength(60-size);
 expect(new Set([...hand,...deck]).size).toBe(60);
 for(const id of hand)expect(s.table.cards[id].zone).toBe('hand');
 for(const id of deck)expect(s.table.cards[id].zone).toBe('deck');
}
describe('AT opening hands',()=>{
 it.each([0,1] as const)('lets first player %i redraw, then the other player; neither starts early',first=>{
  let s=setup(first);const other=first===0?1:0;const original=structuredClone(s);
  expect(ashenOpeningPlayer(s)).toBe(first);expect(()=>chooseAshenOpening(s,other,'keep')).toThrow('opening-hand');
  expect(()=>advanceAshenTo(s,'end')).toThrow('opening hands');expect(()=>burnInBruteDuel(s,'anything',first)).toThrow('opening hands');
  expect(inspectAshenAction(s,s.table.piles[`${first}:hand`][0],first).allowed).toBe(false);
  s=chooseAshenOpening(s,first,'redraw');audit(s,first,6);expect(s.rules!.shuffleCounts![first]).toBe(1);
  expect(s.table.piles[`${first}:hand`]).not.toEqual(original.table.piles[`${first}:hand`]);expect(original).toEqual(setup(first));
  s=chooseAshenOpening(s,first,'redraw');audit(s,first,5);
  s=chooseAshenOpening(s,first,'keep');expect(ashenOpeningPlayer(s)).toBe(other);
  expect(()=>applyAshenCommand(s,first,{type:'next'})).toThrow('opening hands');
  s=chooseAshenOpening(s,other,'redraw');audit(s,other,6);audit(s,first,5);
  s=chooseAshenOpening(s,other,'keep');expect(ashenOpeningPlayer(s)).toBeNull();
  expect(s.table.active).toBe(first);expect(s.table.turn).toBe(1);expect(s.rules!.duel!.phase).toBe('main1');
  expect(()=>chooseAshenOpening(s,first,'redraw')).toThrow('opening-hand');
  s=nextAshenPhase(advanceAshenTo(s,'main2'));expect(s.table.active).toBe(other);audit(s,other,7);
 });
 it('reduces later redraws to one and rejects further redraws without changing state',()=>{
  let s=setup();for(const count of [6,5,4,3,2,1]){s=chooseAshenOpening(s,0,'redraw');audit(s,0,count);}
  const before=structuredClone(s);expect(()=>chooseAshenOpening(s,0,'redraw')).toThrow('below one');expect(s).toEqual(before);
  expect(s.table.health).toEqual([20,20]);expect(s.rules!.duel!.stack).toEqual([]);expect(s.rules!.duel!.jobs).toEqual([]);expect(s.rules!.nobleMarks).toBeUndefined();
 });
 it('preserves redraw counts through saves and does not add openings to older games',()=>{
  const saved=JSON.parse(JSON.stringify(chooseAshenOpening(setup(),0,'redraw'))) as Battlefield;
  audit(chooseAshenOpening(saved,0,'redraw'),0,5);
  delete saved.rules!.duel!.opening;expect(ashenOpeningPlayer(saved)).toBeNull();expect(advanceAshenTo(saved,'main2').rules!.duel!.phase).toBe('main2');
 });
 it('shuffles deterministically without logging hand names or triggering in-game effects',()=>{
  const a=chooseAshenOpening(setup(),0,'redraw'),b=chooseAshenOpening(setup(),0,'redraw');
  expect(a).toEqual(b);expect(a.rules!.shuffleSeed).not.toBe(setup().rules!.shuffleSeed);
  expect(a.table.events.at(-1)).toBe('Opening hand: Player 1 used the free redraw; drew 6 cards.');
  const animations=ashenVisualEvents(setup(),a);expect(animations.filter(e=>e.kind==='draw'&&e.seat===0)).toHaveLength(6);expect(animations).toContainEqual({kind:'shuffle',seat:0});
 });
 it('enforces online ownership and keeps the other hand and all deck identities secret',()=>{
  let s:Match={code:'TESTROOM',game:'ashen',revision:0,members:[member('Host',{faction:'Brute'}),member('Guest',{faction:'Noble'})],phase:'lobby',chat:[]};
  startMatch(s,[],42,0);
  expect(()=>applyMatchCommand(s,1,{type:'ashen',action:{type:'opening',choice:'redraw'}},[],1)).toThrow('opening-hand');
  expect(()=>applyMatchCommand(s,0,{type:'ashen',action:{type:'phase',phase:'end'}},[],1)).toThrow('opening hands');
  s=applyMatchCommand(s,0,{type:'ashen',action:{type:'opening',choice:'redraw'}},[],1);
  const host=matchView(s,0,[]).ashen!,guest=matchView(s,1,[]).ashen!;
  expect(host.table.piles['0:hand'].every(id=>host.table.cards[id].cardId!=='hidden')).toBe(true);
  expect(guest.table.piles['0:hand'].every(id=>guest.table.cards[id].cardId==='hidden')).toBe(true);
  expect(host.rules!.shuffleSeed).toBeUndefined();expect(guest.rules!.shuffleSeed).toBeUndefined();
  for(const view of [host,guest])for(const seat of [0,1])expect(view.table.piles[`${seat}:deck`].every(id=>view.table.cards[id].cardId==='hidden')).toBe(true);
  s=applyMatchCommand(s,0,{type:'ashen',action:{type:'opening',choice:'keep'}},[],1);
  expect(()=>applyMatchCommand(s,0,{type:'ashen',action:{type:'opening',choice:'keep'}},[],1)).toThrow('opening-hand');
  s=applyMatchCommand(s,1,{type:'ashen',action:{type:'opening',choice:'keep'}},[],1);
  expect(applyMatchCommand(s,0,{type:'ashen',action:{type:'phase',phase:'main2'}},[],1).ashen!.rules!.duel!.phase).toBe('main2');
 });
});
