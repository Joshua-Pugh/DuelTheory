import {it,expect} from 'vitest';
import {newEvent,operateEvent,eventReply} from './model';
import {DUEL_PROFILE} from '../table/profiles';
it('closes all event seats, hides the directory, retains archives and restores fresh seats under the same codes',()=>{
 let s=newEvent('ABCDEFGH','owner',{name:'Store',count:4,capacity:2,profile:DUEL_PROFILE},1000);
 s=operateEvent(s,'guest',{type:'join',table:1,round:1,name:'Guest'},'join',1100,'guest');
 s=operateEvent(s,'owner',{type:'fillDemoTables',revision:s.state.revision},'fill',1200);
 s=operateEvent(s,'owner',{type:'startRound',tables:[1],durationMinutes:50,revision:s.state.revision},'start',1300);
 expect(()=>operateEvent(s,'guest',{type:'deleteEvent',revision:s.state.revision},'bad',1400)).toThrow('Only the organizer');
 expect(()=>operateEvent(s,'owner',{type:'deleteEvent',revision:0},'stale',1400)).toThrow('changed');
 s=operateEvent(s,'owner',{type:'deleteEvent',revision:s.state.revision},'delete',1400);
 expect(eventReply(s,'guest')).toEqual(expect.objectContaining({event:expect.objectContaining({deletedAt:1400,tables:[]})}));
 expect(eventReply(s,'guest').table).toBeUndefined();expect(s.members).toEqual({});expect(s.state.tables[0].archive[0].state.players).toHaveLength(2);
 expect(()=>operateEvent(s,'guest',{type:'join',table:1,round:1,name:'Guest'},'join-again',1500)).toThrow('deleted');
 expect(()=>operateEvent(s,'guest',{type:'restoreEvent',revision:s.state.revision},'bad-restore',1500)).toThrow('Only the organizer');
 s=operateEvent(s,'owner',{type:'restoreEvent',revision:s.state.revision},'restore',1500);
 expect(s.state.deletedAt).toBeUndefined();expect(s.state.code).toBe('ABCDEFGH');expect(s.state.tables[0].round).toBe(2);expect(s.state.tables.every(t=>t.state.players.length===0)).toBe(true);expect(s.state.eventRound?.number).toBe(1);expect(s.state.eventRound?.phase).toBe('seating');
 expect(s.state.tables[0].archive[0].state.players).toHaveLength(2);
});
it('gives repeated announcements new identities but deduplicates an outstanding assistance call',()=>{
 let s=newEvent('ABCDEFGH','owner',{name:'Store',count:4,capacity:2,profile:DUEL_PROFILE},1000);
 s=operateEvent(s,'guest',{type:'join',table:1,round:1,name:'Guest'},'join',1100,'guest');
 for(const id of ['a','b'])s=operateEvent(s,'owner',{type:'announce',message:'Five minutes',revision:s.state.revision},id,1200);
 expect(s.state.announcementId).toBe('b');
 s=operateEvent(s,'guest',{type:'help',table:1,round:1},'help-1',1300);
 s=operateEvent(s,'guest',{type:'help',table:1,round:1},'help-2',1400);expect(s.state.tables[0].helpId).toBe('help-1');
 s=operateEvent(s,'owner',{type:'clearHelp',table:1,round:1},'clear',1500);
 s=operateEvent(s,'guest',{type:'help',table:1,round:1},'help-3',1600);expect(s.state.tables[0].helpId).toBe('help-3');
});
