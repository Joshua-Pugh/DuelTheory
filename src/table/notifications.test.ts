import {expect,it} from 'vitest';
import {applyRoomCommand,newTableRoom} from './model';
import {tableNotifications} from './notifications';
function ready(){let s=newTableRoom('ABCDEFGH','Alerts',3,'a');for(const id of ['a','b','c'])s=applyRoomCommand(s,id,{type:'join',name:id,sources:[id]},'join-'+id);s=applyRoomCommand(s,'a',{type:'start'},'start');for(const id of ['a','b','c'])s=applyRoomCommand(s,id,{type:'roll',round:1},'roll-'+id,0,()=>id==='a'?6:1);return s;}
it('does not announce initial snapshots, duplicate/older polls, new rooms or ordinary total changes',()=>{
 const s=ready(),next=applyRoomCommand(s,'a',{type:'adjust',field:'life',delta:-1},'life');
 for(const [before,after] of [[null,s],[s,s],[next,s],[s,{...next,code:'DIFFERENT'}]] as const)expect(tableNotifications(before,after)).toEqual({messages:[],cues:[]});
});
it('announces title claims, transfers and release without making a sound for label edits',()=>{
 const s=ready(),claimed=applyRoomCommand(s,'a',{type:'claimTitle',version:0},'claim'),moved=applyRoomCommand(claimed,'b',{type:'claimTitle',version:1},'move');
 expect(tableNotifications(s,claimed)).toEqual({messages:['Table Title is now held by a.'],cues:[{event:'tableTitle'}]});
 expect(tableNotifications(claimed,moved).messages).toEqual(['Table Title is now held by b.']);
 const renamed=applyRoomCommand(moved,'a',{type:'configureTitle',version:2,label:'Crown',reminder:''},'rename');expect(tableNotifications(moved,renamed).cues).toEqual([]);
 expect(tableNotifications(renamed,applyRoomCommand(renamed,'b',{type:'releaseTitle',version:3},'release')).messages).toEqual(['Crown is now unclaimed.']);
});
it('announces elimination once and uses a single final-result sound when it ends the game',()=>{
 let s=ready();const before=s;s=applyRoomCommand(s,'b',{type:'adjust',field:'life',delta:-20},'out-b');
 expect(tableNotifications(before,s)).toEqual({messages:['b is eliminated.'],cues:[{event:'tableEliminated'}]});
 const end=applyRoomCommand(s,'c',{type:'concede',value:true},'out-c');expect(tableNotifications(s,end)).toEqual({messages:['c is eliminated.','a wins. Game over.'],cues:[{event:'victory'}]});
 const reset=applyRoomCommand(end,'a',{type:'reset'},'reset');expect(tableNotifications(end,reset).messages).toEqual([]);
});
it('does not replay detached or reset histories after reconnecting',()=>{
 const s=ready(),out=applyRoomCommand(s,'b',{type:'concede',value:true},'out');
 expect(tableNotifications(s,{...out,log:[out.log[0]]}).cues).toEqual([]);
 let next=applyRoomCommand(out,'a',{type:'reset'},'reset');next=applyRoomCommand(next,'a',{type:'start'},'start-again');expect(tableNotifications(out,next).cues).toEqual([]);
});

it('plays one life-change sound per confirmed batch without noisy text announcements',()=>{const s=ready(),down=applyRoomCommand(s,'a',{type:'adjust',field:'life',delta:-1},'life');expect(tableNotifications(s,down)).toEqual({messages:[],cues:[{event:'tableLifeDown'}]});const up=applyRoomCommand(down,'a',{type:'adjust',field:'life',delta:2},'gain');expect(tableNotifications(down,up).cues).toEqual([{event:'tableLifeUp'}]);});
