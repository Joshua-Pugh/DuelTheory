import {applyRoomCommand,newTableRoom,RoomError,tableGameOver,type RoomCommand,type TableRoomState} from '../table/model';
import {validateTableProfile,type TableProfile} from '../table/profiles';
export type EventTable={number:number;round:number;state:TableRoomState;help?:string;finished:boolean;archive:{round:number;state:TableRoomState}[]};
export type EventState={code:string;name:string;revision:number;created:number;updated:number;announcement:string;profile:TableProfile;tables:EventTable[]};
export type PublicEvent={code:string;name:string;revision:number;announcement:string;tables:{number:number;round:number;joined:number;capacity:number;status:string}[]};
export type EventStore={state:EventState;owner:string;members:Record<string,{table:number;round:number;id:string}>;requests:Record<string,string>};
export type EventReply={event:PublicEvent;state?:EventState;table?:EventTable;playerId?:string};
const text=(v:unknown,max:number)=>{if(typeof v!=='string'||!v.trim()||v.trim().length>max)throw new RoomError(`Enter 1–${max} characters.`);return v.trim();};
export const eventStatus=(t:EventTable)=>t.help?'Needs help':t.finished||tableGameOver(t.state)?'Finished':t.state.firstPlayer?.winner?'Playing':t.state.started?'Rolling':'Waiting';
export function eventSummary(s:EventState):PublicEvent{return {code:s.code,name:s.name,revision:s.revision,announcement:s.announcement,tables:s.tables.map(t=>({number:t.number,round:t.round,joined:t.state.players.length,capacity:t.state.capacity,status:eventStatus(t)}))};}
export function newEvent(code:string,owner:string,input:Record<string,unknown>,now=Date.now()):EventStore{
 const name=text(input.name,50),profile=validateTableProfile(input.profile),count=Number(input.count),capacity=Number(input.capacity);
 if(![4,5,6].includes(count)||!Number.isInteger(capacity)||capacity<2||capacity>8)throw new RoomError('Choose 4–6 tables and 2–8 seats per table.');
 return {owner,members:{},requests:{},state:{code,name,profile,revision:0,created:now,updated:now,announcement:'',tables:Array.from({length:count},(_,i)=>({number:i+1,round:1,finished:false,archive:[],state:newTableRoom(code,`Table ${i+1}`,capacity,'organizer',profile)}))}};
}
export function eventReply(store:EventStore,hash:string,tableNumber?:number):EventReply{
 const event=eventSummary(store.state);if(hash===store.owner)return {event,state:store.state};
 const member=store.members[hash],table=store.state.tables.find(t=>t.number===member?.table);
 return member&&table&&member.round===table.round&&table.state.players.some(p=>p.id===member.id)&&(!tableNumber||table.number===tableNumber)?{event,table,playerId:member.id}:{event};
}
export function operateEvent(original:EventStore,hash:string,input:Record<string,unknown>,requestId:string,now=Date.now(),playerId:string=crypto.randomUUID()):EventStore{
 const s=structuredClone(original),owner=hash===s.owner;
 if(s.requests[requestId]){if(s.requests[requestId]!==hash)throw new RoomError('Request ID already used.');return s;}
 if(input.type==='announce'){
  if(!owner)throw new RoomError('Only the organizer can make announcements.');
  if(input.revision!==s.state.revision)throw new RoomError('The event changed. Refresh and try again.');
  s.state.announcement=typeof input.message==='string'&&input.message.length<=240?input.message.trim():(()=>{throw new RoomError('Use a message under 240 characters.');})();
 }else{
  const t=s.state.tables.find(t=>t.number===input.table);if(!t)throw new RoomError('Choose a table in this event.');
  if(input.round!==t.round)throw new RoomError('A new group is at this table. Rejoin using its QR code.');
  const member=s.members[hash];
  if(input.type==='join'){
   if(owner)throw new RoomError('The organizer does not occupy a seat. Use another device or browser for a player.');
   if(member&&s.state.tables.some(x=>x.round===member.round&&x.number===member.table&&x.state.players.some(p=>p.id===member.id))){if(member.table!==t.number)throw new RoomError('Leave your current table before joining another.');return s;}
   if(t.finished||t.state.started)throw new RoomError('This table is not taking players. Ask the organizer for a new game.');
   t.state=applyRoomCommand(t.state,playerId,{type:'join',name:input.name as string,sources:Array.isArray(input.sources)&&input.sources.length?input.sources as string[]:[input.name as string]},requestId,now);s.members[hash]={table:t.number,round:t.round,id:playerId};
  }else if(input.type==='newGroup'){
   if(!owner)throw new RoomError('Only the organizer can seat a new group.');
   if(input.revision!==t.state.revision)throw new RoomError('This table changed. Review it before clearing seats.');
   t.archive=[{round:t.round,state:t.state},...t.archive].slice(0,3);t.round++;t.finished=false;delete t.help;t.state=newTableRoom(s.state.code,`Table ${t.number}`,t.state.capacity,'organizer',s.state.profile);
   for(const [key,m] of Object.entries(s.members))if(m.table===t.number)delete s.members[key];
  }else if(input.type==='help'||input.type==='finish'||input.type==='clearHelp'){
   if(!owner&&(!member||member.table!==t.number||member.round!==t.round||!t.state.players.some(p=>p.id===member.id)))throw new RoomError('Join this table first.');
   if(input.type==='clearHelp'){if(!owner)throw new RoomError('Only the organizer can clear a request.');delete t.help;}
   else if(input.type==='help')t.help=owner?'Organizer check requested':t.state.players.find(p=>p.id===member.id)!.name;
   else {if(!owner)throw new RoomError('Only the organizer can mark a table finished.');t.finished=!t.finished;}
  }else if(input.type==='command'){
   const command=input.command as RoomCommand;if(!command||typeof command.type!=='string'||command.type==='join'||command.type==='transferHost'||command.type==='closeRoom')throw new RoomError('That action is not available at an event table.');
   if(!owner&&(!member||member.table!==t.number||member.round!==t.round||!t.state.players.some(p=>p.id===member.id)))throw new RoomError('Your seat is no longer available. Join again.');
   if(t.finished&&command.type!=='leave'&&!(owner&&command.type==='reset'))throw new RoomError('The organizer marked this table finished.');
   t.state=applyRoomCommand(t.state,owner?'organizer':member.id,command,requestId,now,undefined,owner);
   if(owner&&command.type==='reset'){t.finished=false;delete t.help;}
   if(command.type==='leave')delete s.members[hash];
  }else throw new RoomError('Unknown event action.');
 }
 s.state.revision++;s.state.updated=now;s.requests[requestId]=hash;s.requests=Object.fromEntries(Object.entries(s.requests).slice(-300));return s;
}
