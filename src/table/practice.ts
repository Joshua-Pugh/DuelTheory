import {COMMANDER_PROFILE,validateTableProfile,type TableProfile} from './profiles';
import {applyRoomCommand,newTableRoom,type TableRoomState,type RoomCommand} from './model';
export const PRACTICE_COMPLETE='dueltheory.table.lesson.v1';
export function practiceDraft():TableProfile{return {...structuredClone(COMMANDER_PROFILE),name:'My Commander table',counters:[],sourceDamage:{enabled:false,label:'Commander combat damage',defeatAt:21}};}
export function practiceSetupReady(profile:TableProfile){try{const p=validateTableProfile(profile);return p.health.start===40&&p.health.defeatAt===0&&p.counters.some(c=>c.label==='Poison'&&c.start===0&&c.defeatAt===10)&&p.counters.some(c=>c.label==='Energy'&&c.start===0&&c.defeatAt===null)&&p.sourceDamage.enabled&&p.sourceDamage.defeatAt===21;}catch{return false;}}
export function createPractice(profile:TableProfile){const s=newTableRoom('PRACTICE','Commander practice',4,'you',profile);return applyRoomCommand(s,'you',{type:'join',name:'You',sources:['Your commander']},'practice-you');}
export function addPracticePlayers(s:TableRoomState){return ['Mara','Theo','Ada'].reduce((room,name)=>applyRoomCommand(room,name.toLowerCase(),{type:'join',name,sources:[name+"’s commander"]},'practice-'+name),s);}
/** Scripted dice isolate the lesson from ties. Live rooms still roll on the server. */
export function practiceAction(s:TableRoomState,command:RoomCommand){let next=applyRoomCommand(s,'you',command,crypto.randomUUID(),Date.now(),()=>6);if(command.type==='roll'){for(const [id,n] of [['mara',4],['theo',3],['ada',2]] as const)if(next.firstPlayer?.eligible.includes(id)&&!Object.hasOwn(next.firstPlayer.rolls,id))next=applyRoomCommand(next,id,{type:'roll',round:next.firstPlayer.round},crypto.randomUUID(),Date.now(),()=>n);}return next;}
export function lessonActionAllowed(step:number,command:RoomCommand){
 if(step===6)return command.type==='start';if(step===7)return command.type==='roll';
 if(step===8||step===9)return command.type==='adjust'&&command.field==='life'&&command.delta===(step===8?-1:1);
 if(step===10||step===11)return command.type==='adjust'&&command.field==='counter'&&command.key===(step===10?'Poison':'Energy')&&command.delta===1;
 if(step===12)return command.type==='adjust'&&command.field==='damage'&&command.key==='mara:0'&&command.delta===1&&command.loseLife===true;
 if(step===13)return command.type==='undo';return false;
}
