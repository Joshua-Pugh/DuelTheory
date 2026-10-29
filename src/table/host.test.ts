import {expect,it} from 'vitest';
import {applyRoomCommand,newTableRoom,tableGameReady,type RoomCommand} from './model';
function joined(){let s=newTableRoom('ABCDEFGH','Host test',2,'a');for(const id of ['a','b'])s=applyRoomCommand(s,id,{type:'join',name:id,sources:[id]},'join-'+id);return s;}
it('allows only the current host to transfer to another existing seat, with stale-state protection',()=>{
 const s=joined(),cmd={type:'transferHost' as const,playerId:'b',revision:s.revision};
 expect(()=>applyRoomCommand(s,'b',cmd,'guest')).toThrow('current host');
 for(const playerId of ['a','missing'])expect(()=>applyRoomCommand(s,'a',{...cmd,playerId},'bad')).toThrow('another player');
 expect(()=>applyRoomCommand(s,'a',{...cmd,revision:0},'stale')).toThrow('changed');
 const next=applyRoomCommand(s,'a',cmd,'transfer');expect(next.host).toBe('b');expect(s.host).toBe('a');
 expect(next.players).toEqual(s.players);expect(next.log[0].text).toContain('passed hosting to b');
 expect(()=>applyRoomCommand(next,'a',{type:'closeRoom',revision:next.revision},'old-host')).toThrow('current host');
 expect(applyRoomCommand(next,'b',{type:'start'},'start').started).toBe(true);
});
it('only the current host can close; a closed room cannot be joined, reset or changed',()=>{
 const s=joined(),cmd={type:'closeRoom' as const,revision:s.revision};
 expect(()=>applyRoomCommand(s,'b',cmd,'guest')).toThrow('current host');
 expect(()=>applyRoomCommand(s,'a',{...cmd,revision:0},'stale')).toThrow('changed');
 const closed=applyRoomCommand(s,'a',cmd,'close',1234);expect(closed.closedAt).toBe(1234);expect(tableGameReady(closed)).toBe(false);
 for(const [actor,command] of [['a',{type:'reset'}],['a',{type:'adjust',field:'life',delta:1}],['c',{type:'join',name:'c',sources:['c']}]] as [string,RoomCommand][])expect(()=>applyRoomCommand(closed,actor,command,'late')).toThrow('closed');
 expect(closed.players).toEqual(s.players);expect(closed.log[0].text).toContain('all players are disconnected');
});
it('freezes a running timer and preserves history when the host closes an active game',()=>{
 let s=joined();s=applyRoomCommand(s,'a',{type:'configureTurns',enabled:true,revision:s.revision},'turns');s=applyRoomCommand(s,'a',{type:'configureTimer',version:0,durationSeconds:60},'timer');s=applyRoomCommand(s,'a',{type:'start'},'start');for(const id of ['a','b'])s=applyRoomCommand(s,id,{type:'roll',round:1},'roll-'+id,1000,()=>id==='a'?6:1);
 expect(tableGameReady(s)).toBe(true);const closed=applyRoomCommand(s,'a',{type:'closeRoom',revision:s.revision},'close',11000);expect(closed.timer).toMatchObject({remainingMs:50000,runningSince:undefined});expect(closed.log.slice(1)).toEqual(s.log);
});
