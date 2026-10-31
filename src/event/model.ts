import {applyRoomCommand,newTableRoom,RoomError,tableGameOver,type RoomCommand,type TableRoomState} from '../table/model';
import {validateTableProfile,type TableProfile} from '../table/profiles';
export type ArchivedGame={round:number;state:TableRoomState;startedAt?:number;endedAt?:number;eventRound?:number;reason?:string};
export type EventRound={number:number;phase:'active'|'ended'|'seating';tables:number[];durationMinutes:number;startedAt?:number;endedAt?:number;reason?:string};
export type RoundReport=EventRound&{results:{table:number;group:number;players:{name:string;life:number;counters:Record<string,number>}[]}[]};
export type EventTable={number:number;round:number;state:TableRoomState;help?:string;announcement?:string;startedAt?:number;endedAt?:number;eventRound?:number;archived?:boolean;finished:boolean;archive:ArchivedGame[]};
export type EventState={code:string;name:string;revision:number;created:number;updated:number;announcement:string;profile:TableProfile;tables:EventTable[];eventRound?:EventRound;roundHistory?:RoundReport[]};
export type PublicEvent={code:string;name:string;revision:number;announcement:string;eventRound?:EventRound;tables:{number:number;round:number;joined:number;capacity:number;status:string}[]};
export type EventStore={state:EventState;owner:string;members:Record<string,{table:number;round:number;id:string}>;requests:Record<string,string>};
export type EventReply={event:PublicEvent;state?:EventState;table?:EventTable;playerId?:string;serverNow?:number;history?:{table:number;game:ArchivedGame}[];nextCursor?:number};
const text=(v:unknown,max:number)=>{if(typeof v!=='string'||!v.trim()||v.trim().length>max)throw new RoomError(`Enter 1–${max} characters.`);return v.trim();};
export const tableFinished=(t:EventTable)=>t.finished||tableGameOver(t.state);
export const eventStatus=(t:EventTable)=>t.help?'Assistance requested':tableFinished(t)?'Finished':t.state.firstPlayer?.winner?'In progress':t.state.started?'Rolling':t.state.players.length===t.state.capacity?'Ready':'Waiting';
export function eventSummary(s:EventState):PublicEvent{return {code:s.code,name:s.name,revision:s.revision,announcement:s.announcement,eventRound:s.eventRound,tables:s.tables.map(t=>({number:t.number,round:t.round,joined:t.state.players.length,capacity:t.state.capacity,status:eventStatus(t)}))};}
function archiveGame(t:EventTable,now:number,reason?:string){
 if(t.archived)return;
 t.archive=[{round:t.round,state:structuredClone(t.state),startedAt:t.startedAt,endedAt:t.endedAt??now,eventRound:t.eventRound,reason},...t.archive].slice(0,3);t.archived=true;
}
function prepareTable(s:EventStore,t:EventTable,mode:'samePlayers'|'newPlayers',now:number,id:string){
 archiveGame(t,now);
 t.state=mode==='samePlayers'?applyRoomCommand(t.state,'organizer',{type:'reset'},id,now,undefined,true):newTableRoom(s.state.code,`Table ${t.number}`,t.state.capacity,'organizer',t.state.profile??s.state.profile);
 t.round++;t.finished=false;delete t.help;delete t.startedAt;delete t.endedAt;delete t.eventRound;delete t.archived;delete t.announcement;
 for(const [key,m] of Object.entries(s.members))if(m.table===t.number){if(mode==='samePlayers'&&t.state.players.some(p=>p.id===m.id))m.round=t.round;else delete s.members[key];}
}
const inRound=(s:EventState,t:EventTable)=>s.eventRound?.phase!=='seating'&&s.eventRound?.tables.includes(t.number);
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
 if(['startRound','endRound','prepareRound'].includes(String(input.type))){
  if(!owner)throw new RoomError('Only the organizer can manage rounds.');
  if(input.revision!==s.state.revision)throw new RoomError('The event changed. Review the round again before continuing.');
  const round=s.state.eventRound;
  if(input.type==='startRound'){
   if(round&&round.phase!=='seating')throw new RoomError('End and prepare the current round before starting another.');
   if(!Array.isArray(input.tables)||!input.tables.length||input.tables.length>s.state.tables.length||new Set(input.tables).size!==input.tables.length)throw new RoomError('Choose the ready tables for this round.');
   const duration=Number(input.durationMinutes);if(!Number.isInteger(duration)||duration<1||duration>240)throw new RoomError('Choose a round duration of 1–240 minutes.');
   const tables=input.tables.map(n=>s.state.tables.find(t=>t.number===n));
   if(tables.some(t=>!t||t.state.started||t.finished||t.state.players.length!==t.state.capacity))throw new RoomError('Each selected table must be full and ready.');
   const number=(round?.number??0)+1;
   for(const table of tables){const t=table!;t.state=applyRoomCommand(t.state,'organizer',{type:'start'},`${requestId}-${t.number}`,now,undefined,true);t.startedAt=now;t.eventRound=number;}
   s.state.eventRound={number,phase:'active',tables:tables.map(t=>t!.number),durationMinutes:duration,startedAt:now};
  }else if(input.type==='endRound'){
   if(!round||round.phase!=='active')throw new RoomError('No round is running.');
   const tables=s.state.tables.filter(t=>round.tables.includes(t.number)),unfinished=tables.filter(t=>!tableFinished(t));
   if(unfinished.length&&!input.endUnfinished)throw new RoomError('Some tables are still playing. Review them before ending the round.');
   if(input.endUnfinished!==undefined&&typeof input.endUnfinished!=='boolean')throw new RoomError('Confirm whether unfinished games should end.');
   const reason=unfinished.length?text(input.reason,160):undefined;
   for(const t of tables){t.finished=true;t.endedAt??=now;archiveGame(t,now,reason);delete t.help;}
   round.phase='ended';round.endedAt=now;round.reason=reason;
   s.state.roundHistory=[{...round,results:tables.map(t=>({table:t.number,group:t.round,players:t.state.players.map(p=>({name:p.name,life:p.life,counters:structuredClone(p.counters)}))}))},...(s.state.roundHistory??[])].slice(0,8);
  }else{
   if(!round||round.phase!=='ended')throw new RoomError('End and archive the current round first.');
   if(input.mode!=='samePlayers'&&input.mode!=='newPlayers')throw new RoomError('Choose whether to keep players or free their seats.');
   for(const t of s.state.tables.filter(t=>round.tables.includes(t.number)))prepareTable(s,t,input.mode,now,`${requestId}-${t.number}`);
   s.state.eventRound={...round,phase:'seating',tables:[]};
  }
 }else if(input.type==='announce'){
  if(!owner)throw new RoomError('Only the organizer can make announcements.');
  if(input.revision!==s.state.revision)throw new RoomError('The event changed. Refresh and try again.');
  const message=typeof input.message==='string'&&input.message.length<=240?input.message.trim():(()=>{throw new RoomError('Use a message under 240 characters.');})();
  if(input.table!==undefined){const t=s.state.tables.find(t=>t.number===input.table);if(!t||input.round!==t.round)throw new RoomError('The table changed. Select it again.');t.announcement=message;}else s.state.announcement=message;
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
   if(inRound(s.state,t))throw new RoomError('Use the round controls to prepare tables in this round.');
   prepareTable(s,t,'newPlayers',now,requestId);
  }else if(input.type==='correct'){
   if(!owner)throw new RoomError('Only the organizer can correct another player’s totals.');
   if(t.archived)throw new RoomError('This game is archived. Start a new game before changing totals.');
   if(input.revision!==t.state.revision)throw new RoomError('The totals changed. Review the correction again.');
   const reason=text(input.reason,160),target=t.state.players.find(p=>p.id===input.playerId);if(!target)throw new RoomError('Choose a player at this table.');
   if(!['life','counter','damage'].includes(String(input.field)))throw new RoomError('Choose a life total, counter or named source.');
   t.state=applyRoomCommand(t.state,target.id,{type:'adjust',field:input.field as 'life'|'counter'|'damage',key:input.key as string,delta:input.delta as number},requestId,now);
   t.state.log[0]={...t.state.log[0],player:'Organizer',text:`Correction for ${target.name}: ${t.state.log[0].text} · ${reason}`};
   delete t.state.players.find(p=>p.id===target.id)!.lastEntry;
   if(!t.finished){if(tableGameOver(t.state))t.endedAt??=now;else delete t.endedAt;}
  }else if(input.type==='help'||input.type==='finish'||input.type==='clearHelp'){
   if(!owner&&(!member||member.table!==t.number||member.round!==t.round||!t.state.players.some(p=>p.id===member.id)))throw new RoomError('Join this table first.');
   if(input.type==='clearHelp'){if(!owner)throw new RoomError('Only the organizer can clear a request.');delete t.help;}
   else if(input.type==='help')t.help=owner?'Organizer check requested':t.state.players.find(p=>p.id===member.id)!.name;
   else {if(!owner)throw new RoomError('Only the organizer can mark a table finished.');if(t.archived)throw new RoomError('This game is archived. Prepare the next game instead.');t.finished=!t.finished;if(t.finished)t.endedAt=now;else if(!tableGameOver(t.state))delete t.endedAt;}
  }else if(input.type==='command'){
   const command=input.command as RoomCommand;if(!command||typeof command.type!=='string'||command.type==='join'||command.type==='transferHost'||command.type==='closeRoom')throw new RoomError('That action is not available at an event table.');
   if(!owner&&(!member||member.table!==t.number||member.round!==t.round||!t.state.players.some(p=>p.id===member.id)))throw new RoomError('Your seat is no longer available. Join again.');
   if(t.finished&&command.type!=='leave'&&!(owner&&command.type==='reset'))throw new RoomError('The organizer marked this table finished.');
   if(owner&&command.type==='reset'){
    if(inRound(s.state,t))throw new RoomError('Use the round controls to prepare tables in this round.');
    if(input.revision!==t.state.revision)throw new RoomError('The table changed. Review it before resetting.');
    prepareTable(s,t,'samePlayers',now,requestId);
   }else{
    t.state=applyRoomCommand(t.state,owner?'organizer':member.id,command,requestId,now,undefined,owner);
    if(command.type==='start')t.startedAt=now;
    if(tableGameOver(t.state))t.endedAt??=now;else if(!t.finished)delete t.endedAt;
   }
   if(command.type==='leave')delete s.members[hash];
  }else throw new RoomError('Unknown event action.');
 }
 s.state.revision++;s.state.updated=now;s.requests[requestId]=hash;s.requests=Object.fromEntries(Object.entries(s.requests).slice(-300));return s;
}
