import {expect,it} from 'vitest';
import {applyRoomCommand,newTableRoom,currentTurnPlayer,tableGameReady,tableTurnsEnabled} from './model';
function ready(){let s=newTableRoom('ABCDEFGH','Optional turns',3,'a');for(const id of ['a','b','c'])s=applyRoomCommand(s,id,{type:'join',name:id,sources:[id]},'j'+id);s=applyRoomCommand(s,'a',{type:'start'},'start');for(const id of ['a','b','c'])s=applyRoomCommand(s,id,{type:'roll',round:1},'r'+id,0,()=>id==='a'?6:1);return s;}
it('defaults new tables to totals-only but still rolls first player and allows totals',()=>{
 const s=ready();expect(tableGameReady(s)).toBe(true);expect(s.firstPlayer?.winner).toBe('a');expect(tableTurnsEnabled(s)).toBe(false);expect(currentTurnPlayer(s)).toBeUndefined();
 expect(applyRoomCommand(s,'a',{type:'adjust',field:'life',delta:-1},'life').players[0].life).toBe(19);
 expect(()=>applyRoomCommand(s,'a',{type:'endTurn',turn:1},'end')).toThrow('disabled');
 expect(()=>applyRoomCommand(s,'a',{type:'configureTimer',version:0,durationSeconds:60},'timer')).toThrow('Enable turn passing');
});
it('allows only host, checks stale/invalid commands, and preserves old-room behavior',()=>{
 const s=ready(),command={type:'configureTurns' as const,enabled:true,revision:s.revision};
 expect(()=>applyRoomCommand(s,'b',command,'bad')).toThrow('host');
 expect(()=>applyRoomCommand(s,'a',{...command,revision:0},'stale')).toThrow('changed');
 expect(()=>applyRoomCommand(s,'a',{...command,enabled:'yes'} as never,'invalid')).toThrow('Choose');
 const legacy={...s};delete legacy.turnTracking;expect(tableTurnsEnabled(legacy)).toBe(true);expect(currentTurnPlayer(legacy)).toBe('a');
});
it('disables the timer with turns, preserves totals and first roll, and skips eliminated players on reenable',()=>{
 let s=ready();s=applyRoomCommand(s,'a',{type:'configureTurns',enabled:true,revision:s.revision},'on');s=applyRoomCommand(s,'a',{type:'configureTimer',version:0,durationSeconds:60},'timer');
 s=applyRoomCommand(s,'a',{type:'configureTurns',enabled:false,revision:s.revision},'off');expect(s.timer).toMatchObject({durationSeconds:0,remainingMs:0});expect(s.timer?.runningSince).toBeUndefined();
 s=applyRoomCommand(s,'a',{type:'concede',value:true},'out');s=applyRoomCommand(s,'a',{type:'configureTurns',enabled:true,revision:s.revision},'again');expect(currentTurnPlayer(s)).toBe('b');expect(s.firstPlayer?.winner).toBe('a');expect(s.players[0].conceded).toBe(true);
});
