import {describe,it,expect} from 'vitest';
import {applyRoomCommand,newCommanderRoom,commanderKey,commanderWarnings,commanderEliminated,commanderGameOver,currentTurnPlayer,activeCommanderPlayers} from './model';
const game=(capacity=2)=>{let s=newCommanderRoom('ABCDEFGH','Commander night',capacity,'alice');s=applyRoomCommand(s,'alice',{type:'join',name:'Alice',commanders:['Atraxa','Partner']},'join-a');return applyRoomCommand(s,'bob',{type:'join',name:'Bob',commanders:['Atraxa']},'join-b');};
const ready=()=>{let s=applyRoomCommand(game(),'alice',{type:'start'},'start');s=applyRoomCommand(s,'alice',{type:'roll',round:1},'ra',0,()=>6);return applyRoomCommand(s,'bob',{type:'roll',round:1},'rb',0,()=>1);};
describe('manual Commander room rules',()=>{
 it('resolves repeated high ties, rejects repeat rolls and follows seat order from the winner',()=>{
  let s=applyRoomCommand(game(),'alice',{type:'start'},'start');
  const roll=(id:string,n:number)=>{s=applyRoomCommand(s,id,{type:'roll',round:s.firstPlayer!.round},id+String(s.revision),0,()=>n);};
  roll('alice',6);expect(()=>roll('alice',1)).toThrow('Wait');roll('bob',6);expect(s.firstPlayer?.round).toBe(2);
  expect(()=>applyRoomCommand(s,'alice',{type:'roll',round:1},'stale')).toThrow('Wait');
  roll('alice',3);roll('bob',3);roll('alice',2);roll('bob',5);
  expect(s.turnOrder).toEqual(['bob','alice']);expect(s.turn).toBe(1);expect(s.firstPlayer?.winner).toBe('bob');
  expect(()=>roll('bob',6)).toThrow('not open');
  s=applyRoomCommand(s,'bob',{type:'endTurn',turn:1},'next');expect(s.turn).toBe(2);
  expect(()=>applyRoomCommand(s,'bob',{type:'endTurn',turn:2},'wrong')).toThrow('current player');
  expect(()=>applyRoomCommand(s,'alice',{type:'endTurn',turn:1},'stale')).toThrow('changed');
  s=applyRoomCommand(s,'alice',{type:'reset'},'reset');expect(s.firstPlayer).toBeUndefined();expect(s.turnOrder).toBeUndefined();expect(s.turn).toBeUndefined();
 });
 it('only rerolls tied highest players and skips conceded seats',()=>{
  let s=applyRoomCommand(game(3),'c',{type:'join',name:'Charlie',commanders:['C']},'join-c');s=applyRoomCommand(s,'alice',{type:'start'},'start');
  for(const [id,n] of [['alice',6],['bob',1],['c',6]] as const)s=applyRoomCommand(s,id,{type:'roll',round:1},id,0,()=>n);
  expect(s.firstPlayer?.eligible).toEqual(['alice','c']);expect(()=>applyRoomCommand(s,'bob',{type:'roll',round:2},'b')).toThrow('Wait');
  s=applyRoomCommand(s,'alice',{type:'roll',round:2},'a2',0,()=>6);s=applyRoomCommand(s,'c',{type:'roll',round:2},'c2',0,()=>2);
  s=applyRoomCommand(s,'bob',{type:'concede',value:true},'concede');s=applyRoomCommand(s,'alice',{type:'endTurn',turn:1},'end');expect(s.turn).toBe(3);
  expect(()=>applyRoomCommand(s,'alice',{type:'start'},'restart')).toThrow('already');
 });
 it('starts everyone at 40 life and keeps commander identities separate even with the same card name',()=>{const s=ready();expect(s.players.map(p=>p.life)).toEqual([40,40]);const next=applyRoomCommand(s,'alice',{type:'adjust',field:'damage',key:commanderKey('bob',0),delta:7,loseLife:true},'hit');expect(next.players[0].life).toBe(33);expect(next.players[0].damage).toEqual({'bob:0':7});expect(next.players[1].life).toBe(40);expect(s.players[0].life).toBe(40);});
 it('never trusts a supplied player ID to edit another player',()=>{const s=ready(),next=applyRoomCommand(s,'alice',{type:'adjust',field:'life',delta:-4,playerId:'bob'} as never,'hit');expect(next.players[0].life).toBe(36);expect(next.players[1].life).toBe(40);expect(()=>applyRoomCommand(s,'stranger',{type:'adjust',field:'life',delta:-2},'x')).toThrow('Join');});
 it('keeps poison and commander damage independent from life when requested',()=>{let s=ready();s=applyRoomCommand(s,'alice',{type:'adjust',field:'poison',delta:5},'p');s=applyRoomCommand(s,'alice',{type:'adjust',field:'damage',key:'bob:0',delta:5,loseLife:false},'d');expect(s.players[0]).toMatchObject({life:40,poison:5,damage:{'bob:0':5}});});
 it('allows correcting commander damage and life together',()=>{let s=applyRoomCommand(ready(),'alice',{type:'adjust',field:'damage',key:'bob:0',delta:5,loseLife:true},'d');s=applyRoomCommand(s,'alice',{type:'adjust',field:'damage',key:'bob:0',delta:-2,loseLife:true},'fix');expect(s.players[0].life).toBe(37);expect(s.players[0].damage['bob:0']).toBe(3);});
 it('automatically eliminates at each threshold without marking a concession',()=>{let s=ready();s=applyRoomCommand(s,'alice',{type:'adjust',field:'life',delta:-40},'life');s=applyRoomCommand(s,'alice',{type:'adjust',field:'poison',delta:10},'poison');s=applyRoomCommand(s,'alice',{type:'adjust',field:'damage',key:'bob:0',delta:21,loseLife:false},'damage');expect(commanderWarnings(s.players[0])).toHaveLength(3);expect(commanderEliminated(s.players[0])).toBe(true);expect(s.players[0].conceded).toBe(false);});
 it.each([
  [{type:'adjust',field:'life',delta:-39},{type:'adjust',field:'life',delta:-1},{type:'adjust',field:'life',delta:1}],
  [{type:'adjust',field:'poison',delta:9},{type:'adjust',field:'poison',delta:1},{type:'adjust',field:'poison',delta:-1}],
  [{type:'adjust',field:'damage',key:'bob:0',delta:20},{type:'adjust',field:'damage',key:'bob:0',delta:1},{type:'adjust',field:'damage',key:'bob:0',delta:-1}]
 ])('eliminates exactly at the threshold and allows correcting an entry (%j)',(below,hit,fix)=>{
  let s=ready();
  s=applyRoomCommand(s,'alice',below as never,'below');expect(commanderEliminated(s.players[0])).toBe(false);
  s=applyRoomCommand(s,'alice',hit as never,'hit');expect(commanderEliminated(s.players[0])).toBe(true);expect(commanderGameOver(s)).toBe(true);expect(activeCommanderPlayers(s).map(p=>p.id)).toEqual(['bob']);expect(s.log[0].text).toContain('Bob wins');
  s=applyRoomCommand(s,'alice',fix as never,'fix');expect(commanderEliminated(s.players[0])).toBe(false);expect(commanderGameOver(s)).toBe(false);expect(s.log[0].text).toContain('restored after correction');
 });
 it('keeps commander damage separate, including partners, and handles negative life',()=>{
  let s=ready();s=applyRoomCommand(s,'bob',{type:'adjust',field:'damage',key:'alice:0',delta:20},'d1');s=applyRoomCommand(s,'bob',{type:'adjust',field:'damage',key:'alice:1',delta:20},'d2');expect(commanderEliminated(s.players[1])).toBe(false);
  s=applyRoomCommand(s,'bob',{type:'adjust',field:'life',delta:-41},'life');expect(commanderEliminated(s.players[1])).toBe(true);
 });
 it('immediately advances an eliminated current player, skips eliminated seats, and stops at a winner',()=>{
  let s=applyRoomCommand(game(3),'c',{type:'join',name:'Charlie',commanders:['C']},'join-c');s=applyRoomCommand(s,'alice',{type:'start'},'start');
  for(const [id,n] of [['alice',6],['bob',2],['c',1]] as const)s=applyRoomCommand(s,id,{type:'roll',round:1},id,0,()=>n);
  s=applyRoomCommand(s,'alice',{type:'adjust',field:'life',delta:-40},'out');expect(currentTurnPlayer(s)).toBe('bob');expect(s.turn).toBe(2);
  s=applyRoomCommand(s,'bob',{type:'endTurn',turn:2},'end');s=applyRoomCommand(s,'c',{type:'endTurn',turn:3},'end-c');expect(currentTurnPlayer(s)).toBe('bob');expect(s.turn).toBe(5);
  s=applyRoomCommand(s,'bob',{type:'adjust',field:'poison',delta:10},'out-b');expect(commanderGameOver(s)).toBe(true);expect(activeCommanderPlayers(s)[0].id).toBe('c');expect(()=>applyRoomCommand(s,'alice',{type:'endTurn',turn:5},'bad')).toThrow('two active');
  s=applyRoomCommand(s,'c',{type:'adjust',field:'life',delta:-40},'all-out');expect(commanderGameOver(s)).toBe(true);expect(activeCommanderPlayers(s)).toEqual([]);
  s=applyRoomCommand(s,'alice',{type:'reset'},'reset');expect(activeCommanderPlayers(s)).toHaveLength(3);expect(commanderGameOver(s)).toBe(false);
 });
 it('locks all game edits until the first-player roll is finished',()=>{
  expect(()=>applyRoomCommand(game(3),'alice',{type:'start'},'early')).toThrow('all 3 players');
  let s=game();
  for(const type of ['life','poison','counter','damage'])expect(()=>applyRoomCommand(s,'alice',{type:'adjust',field:type,delta:1,key:'bob:0'} as never,'blocked')).toThrow('Wait for everyone');
  expect(()=>applyRoomCommand(s,'alice',{type:'concede',value:true},'concede')).toThrow('Wait for everyone');
  s=applyRoomCommand(s,'alice',{type:'start'},'start');s=applyRoomCommand(s,'alice',{type:'roll',round:1},'ra',0,()=>6);
  expect(()=>applyRoomCommand(s,'alice',{type:'adjust',field:'life',delta:-1},'blocked')).toThrow('Wait for everyone');
  s=applyRoomCommand(s,'bob',{type:'roll',round:1},'rb',0,()=>1);s=applyRoomCommand(s,'alice',{type:'adjust',field:'life',delta:-1},'allowed');expect(s.players[0].life).toBe(39);
  s=applyRoomCommand(s,'alice',{type:'reset'},'reset');expect(()=>applyRoomCommand(s,'alice',{type:'adjust',field:'life',delta:-1},'blocked')).toThrow('Wait for everyone');
 });
 it('rejects invalid changes atomically and protects custom counter objects',()=>{const s=ready();for(const input of [{type:'adjust',field:'poison',delta:-1},{type:'adjust',field:'life',delta:Infinity},{type:'adjust',field:'counter',key:'__proto__',delta:1},{type:'adjust',field:'damage',key:'unknown',delta:1}])expect(()=>applyRoomCommand(s,'alice',input as never,'bad')).toThrow();expect(s.players[0].life).toBe(40);expect(s.players[0].counters).toEqual({});});
 it('lets only the host start/reset, locks new joins, and preserves seats for a new game',()=>{let s=game();expect(()=>applyRoomCommand(s,'bob',{type:'start'},'x')).toThrow('host');s=applyRoomCommand(s,'alice',{type:'start'},'start');expect(()=>applyRoomCommand(s,'charlie',{type:'join',name:'Charlie',commanders:['Commander']},'j')).toThrow('started');s=ready();s=applyRoomCommand(s,'bob',{type:'adjust',field:'life',delta:-12},'hit');s=applyRoomCommand(s,'alice',{type:'reset'},'reset');expect(s.started).toBe(false);expect(s.players.map(p=>p.life)).toEqual([40,40]);expect(s.players.map(p=>p.id)).toEqual(['alice','bob']);});
 it('validates room capacity, duplicate names and counter bounds',()=>{expect(()=>newCommanderRoom('ABCDEFGH','x',100,'a')).toThrow();const s=game(4);expect(()=>applyRoomCommand(s,'c',{type:'join',name:'ALICE',commanders:['c']},'j')).toThrow('taken');let next=ready();for(let i=0;i<8;i++)next=applyRoomCommand(next,'alice',{type:'adjust',field:'counter',key:'counter'+i,delta:1},'c'+i);expect(()=>applyRoomCommand(next,'alice',{type:'adjust',field:'counter',key:'ninth',delta:1},'c9')).toThrow('8');});
 it('treats inherited object names as empty counters and rejects non-boolean life switches',()=>{const s=ready(),next=applyRoomCommand(s,'alice',{type:'adjust',field:'counter',key:'toString',delta:1},'counter');expect(next.players[0].counters.toString).toBe(1);expect(()=>applyRoomCommand(s,'alice',{type:'adjust',field:'damage',key:'bob:0',delta:1,loseLife:'false'} as never,'bad')).toThrow('whether life');});
});
