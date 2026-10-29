import {DUEL_PROFILE,validateTableProfile,type TableProfile} from './profiles';
import {defaultTurnTimer,turnTimeRemaining,type TurnTimer} from './timer';
/** Manual multiplayer scorekeeping; this does not adjudicate card effects. */
export type TotalsSnapshot={life:number;poison:number;damage:Record<string,number>;counters:Record<string,number>};
export type LastTableEntry={id:string;text:string;before:TotalsSnapshot};
export type TablePlayer={lastEntry?:LastTableEntry;id:string;name:string;sources?:string[];commanders:string[];life:number;poison:number;damage:Record<string,number>;counters:Record<string,number>;conceded:boolean};
export type FirstPlayerRoll={round:number;eligible:string[];rolls:Record<string,number>;winner?:string};
export type TableTitle={label:string;reminder:string;version:number;holder?:string};
export type TableRoomState={closedAt?:number;turnTracking?:boolean;timer?:TurnTimer;tableTitle?:TableTitle;profile?:TableProfile;code:string;title:string;host:string;capacity:number;started:boolean;revision:number;players:TablePlayer[];firstPlayer?:FirstPlayerRoll;turnOrder?:string[];turn?:number;log:{id:string;at:number;player:string;text:string}[]};
export const sharedTableTitle=(s:TableRoomState):TableTitle=>s.tableTitle??{label:'Table Title',reminder:'',version:0};
export type RoomCommand=
 |{type:'join';name:string;sources?:string[];commanders?:string[]}
 |{type:'adjust';field:'life'|'poison'|'damage'|'counter';delta:number;key?:string;loseLife?:boolean}
 |{type:'concede';value:boolean}
 |{type:'roll';round:number}|{type:'endTurn';turn:number}
 |{type:'claimTitle'|'releaseTitle';version:number}|{type:'configureTitle';version:number;label:string;reminder:string}
 |{type:'undo';entryId:string}
 |{type:'configureTimer';version:number;durationSeconds:number}|{type:'timer';version:number;turn:number;mode:'pause'|'resume'|'restart'}
 |{type:'configureTurns';enabled:boolean;revision:number}
 |{type:'transferHost';playerId:string;revision:number}|{type:'closeRoom';revision:number}
 |{type:'start'}|{type:'reset'};
export class RoomError extends Error{}
const label=(value:unknown,max:number)=>{if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw new RoomError(`Enter text between 1 and ${max} characters.`);return value.trim();};
export function newTableRoom(code:string,title:unknown,capacity:unknown,host:string,profile:unknown=DUEL_PROFILE):TableRoomState{
 if(!Number.isInteger(capacity)||Number(capacity)<2||Number(capacity)>8)throw new RoomError('Choose 2–8 players.');
 let settings:TableProfile;try{settings=validateTableProfile(profile);}catch(e){throw new RoomError(e instanceof Error?e.message:String(e));}
 return {turnTracking:false,profile:settings,code,title:label(title,50),host,capacity:Number(capacity),started:false,revision:0,players:[],log:[]};
}
export const sourceKey=(playerId:string,index:number)=>`${playerId}:${index}`;
export function tableSources(s:TableRoomState){return s.players.flatMap(p=>(p.sources??p.commanders).map((name,i)=>({key:sourceKey(p.id,i),name,owner:p.name,ownerId:p.id})));}
// Old wire fields (life/commanders/poison) remain readable for existing room clients.
export function roomProfile(s:TableRoomState):TableProfile{return s.profile??LEGACY_PROFILE;}
export const LEGACY_PROFILE:TableProfile={schemaVersion:1,name:'Existing table settings',health:{label:'Life',start:40,defeatAt:0},counters:[{label:'Poison',start:0,defeatAt:10}],sourceDamage:{enabled:true,label:'Combat damage',defeatAt:21}};
export function counterValue(p:TablePlayer,key:string,s:TableRoomState){return !s.profile&&key==='Poison'?p.poison:Object.hasOwn(p.counters,key)?p.counters[key]:0;}
export function tableWarnings(p:TablePlayer,s?:TableRoomState){const profile=s?roomProfile(s):LEGACY_PROFILE;return [...(profile.health.defeatAt!==null&&p.life<=profile.health.defeatAt?[`${profile.health.label} is ${profile.health.defeatAt} or less`]:[]),...profile.counters.filter(c=>(s?counterValue(p,c.label,s):c.label==='Poison'?p.poison:p.counters[c.label]||0)>=(c.defeatAt??Infinity)).map(c=>`${c.defeatAt}+ ${c.label} counters`),...(profile.sourceDamage.enabled&&profile.sourceDamage.defeatAt!==null&&Object.values(p.damage).some(n=>n>=profile.sourceDamage.defeatAt!)?[`${profile.sourceDamage.defeatAt}+ damage from one source`]:[])];}
export function tableEliminated(p:TablePlayer,s?:TableRoomState){return p.conceded||tableWarnings(p,s).length>0;}
export function activeTablePlayers(s:TableRoomState){return s.players.filter(p=>!tableEliminated(p,s));}
export function tableGameOver(s:TableRoomState){return s.started&&s.players.length>=2&&activeTablePlayers(s).length<2;}
export function tableGameReady(s:TableRoomState){return s.closedAt===undefined&&s.started&&Boolean(s.firstPlayer?.winner);}
function settleFirstPlayer(s:TableRoomState){
 const roll=s.firstPlayer;if(!roll||roll.winner||tableGameOver(s))return '';
 roll.eligible=roll.eligible.filter(id=>s.players.some(p=>p.id===id&&!tableEliminated(p,s)));
 if(!roll.eligible.length){roll.eligible=activeTablePlayers(s).map(p=>p.id);roll.rolls={};roll.round++;return ' · remaining players roll again';}
 if(roll.eligible.length>1&&!roll.eligible.every(id=>Object.hasOwn(roll.rolls,id)))return '';
 const highest=Math.max(...roll.eligible.map(id=>roll.rolls[id]??0)),tied=roll.eligible.filter(id=>(roll.rolls[id]??0)===highest);
 if(tied.length>1){s.firstPlayer={round:roll.round+1,eligible:tied,rolls:{}};return ` · tied highest: ${s.players.filter(p=>tied.includes(p.id)).map(p=>p.name).join(', ')}; reroll`;}
 roll.winner=tied[0];const index=s.players.findIndex(p=>p.id===roll.winner);s.turnOrder=[...s.players.slice(index),...s.players.slice(0,index)].map(p=>p.id);s.turn=1;return ` · ${s.players[index].name} goes first`;
}
export function rollSixSidedDie(){const limit=4294967292;let value:number;do{value=crypto.getRandomValues(new Uint32Array(1))[0];}while(value>=limit);return value%6+1;}
// Missing flag preserves the behavior of rooms created by earlier clients.
export const tableTurnsEnabled=(s:TableRoomState)=>s.turnTracking!==false;
export function currentTurnPlayer(s:TableRoomState){return tableTurnsEnabled(s)&&s.turnOrder?.length&&s.turn?s.turnOrder[(s.turn-1)%s.turnOrder.length]:undefined;}
export function applyRoomCommand(original:TableRoomState,actor:string,input:RoomCommand,requestId:string,now=Date.now(),die=rollSixSidedDie):TableRoomState{
 if(!input||typeof input!=='object'||typeof input.type!=='string')throw new RoomError('Invalid action.');
 if(original.closedAt!==undefined)throw new RoomError('This table has been closed by its host.');
 const s=structuredClone(original);let text='';let player=s.players.find(p=>p.id===actor);
 if(input.type==='join'){
  if(player)return s;
  if(s.started)throw new RoomError('This game has started; new seats are locked.');
  if(s.players.length>=s.capacity)throw new RoomError('This room is full.');
  const name=label(input.name,24);
  if(s.players.some(p=>p.name.toLowerCase()===name.toLowerCase()))throw new RoomError('That player name is already taken.');
  const names=input.sources??input.commanders;
  if(!Array.isArray(names)||names.length<1||names.length>(s.profile?8:2))throw new RoomError('Enter up to eight named damage sources.');
  player={id:actor,name,commanders:names.map(n=>label(n,80)),...(s.profile?{sources:names.map(n=>label(n,80))}:{}),life:roomProfile(s).health.start,poison:0,damage:{},counters:Object.fromEntries((s.profile?.counters??[]).map(c=>[c.label,c.start])),conceded:false};s.players.push(player);text='joined the table';
 }else{
  if(!player)throw new RoomError('Join this room before changing values.');
  if(input.type==='transferHost'||input.type==='closeRoom'){
   if(actor!==s.host)throw new RoomError('Only the current host can transfer hosting or close the table.');
   if(input.revision!==s.revision)throw new RoomError('The table changed. Refresh and try again.');
   if(input.type==='transferHost'){
    const next=s.players.find(p=>p.id===input.playerId);
    if(!next||next.id===actor)throw new RoomError('Choose another player at this table.');
    s.host=next.id;text=`passed hosting to ${next.name}`;
   }else{
    s.closedAt=now;
    if(s.timer)s.timer={...s.timer,remainingMs:turnTimeRemaining(s.timer,now),runningSince:undefined,version:s.timer.version+1};
    text='closed the table; all players are disconnected';
   }
  }
  else if(input.type==='undo'){
   const entry=player.lastEntry;if(!tableGameReady(s)||!entry||entry.id!==input.entryId)throw new RoomError('That entry is no longer available to undo.');
   Object.assign(player,structuredClone(entry.before));delete player.lastEntry;text=`undid last entry: ${entry.text}`;
  }
  else if(input.type==='configureTurns'){
   if(actor!==s.host)throw new RoomError('Only the host can configure turn passing.');
   if(typeof input.enabled!=='boolean')throw new RoomError('Choose whether turn passing is enabled.');
   if(input.revision!==s.revision)throw new RoomError('The table changed. Refresh and try again.');
   s.turnTracking=input.enabled;
   if(s.timer)s.timer={...s.timer,durationSeconds:0,remainingMs:0,runningSince:undefined,version:s.timer.version+1};
   text=input.enabled?'enabled turn passing':'disabled turn passing';
  }
  else if(input.type==='configureTimer'||input.type==='timer'){
   if(!tableTurnsEnabled(s))throw new RoomError('Enable turn passing before using a turn timer.');
   const timer=s.timer??defaultTurnTimer();
   if(input.version!==timer.version)throw new RoomError('The timer changed. Refresh its current state and try again.');
   if(input.type==='configureTimer'){
    if(actor!==s.host)throw new RoomError('Only the host can configure the turn timer.');
    if(!Number.isInteger(input.durationSeconds)||input.durationSeconds<0||input.durationSeconds>7200)throw new RoomError('Choose a turn timer from 1 second to 120 minutes, or 0 to disable.');
    s.timer={durationSeconds:input.durationSeconds,remainingMs:input.durationSeconds*1000,version:timer.version+1,turn:s.turn,...(input.durationSeconds&&tableGameReady(s)&&!tableGameOver(s)?{runningSince:now}:{})};
    text=input.durationSeconds?`set a ${input.durationSeconds}-second turn timer`:'disabled the turn timer';
   }else{
    if(!tableGameReady(s)||tableGameOver(s)||!timer.durationSeconds||input.turn!==s.turn)throw new RoomError('The turn changed or its timer is not active.');
    if(actor!==currentTurnPlayer(s)&&actor!==s.host)throw new RoomError('Only the current player or host can control the timer.');
    if(input.mode==='pause'){
     if(timer.runningSince===undefined)throw new RoomError('The timer is already paused.');
     s.timer={...timer,remainingMs:turnTimeRemaining(timer,now),runningSince:undefined,version:timer.version+1};text='paused the turn timer';
    }else if(input.mode==='resume'){
     if(timer.runningSince!==undefined||timer.remainingMs<=0)throw new RoomError('Pause a running timer, or restart an expired timer.');
     s.timer={...timer,runningSince:now,version:timer.version+1};text='resumed the turn timer';
    }else if(input.mode==='restart'){s.timer={...timer,remainingMs:timer.durationSeconds*1000,runningSince:now,version:timer.version+1};text='restarted the turn timer';}
    else throw new RoomError('Unknown timer control.');
   }
  }
  else if(input.type==='claimTitle'||input.type==='releaseTitle'||input.type==='configureTitle'){
   const marker=sharedTableTitle(s);
   if(input.version!==marker.version)throw new RoomError('The table title changed. Check the current holder and try again.');
   if(input.type==='configureTitle'){
    if(actor!==s.host)throw new RoomError('Only the host can configure the table title.');
    if(typeof input.reminder!=='string'||input.reminder.trim().length>120)throw new RoomError('Use a reminder up to 120 characters.');
    s.tableTitle={...marker,label:label(input.label,24),reminder:input.reminder.trim(),version:marker.version+1};text=`configured shared title: ${s.tableTitle.label}`;
   }else{
    if(!tableGameReady(s))throw new RoomError('Finish the first-player roll before changing the table title.');
    if(input.type==='claimTitle'){
     if(tableEliminated(player,s))throw new RoomError('Eliminated players cannot hold the table title.');
     if(marker.holder===actor)throw new RoomError('You already hold this title.');
     s.tableTitle={...marker,holder:actor,version:marker.version+1};text=`claimed ${marker.label}${marker.holder?` from ${s.players.find(p=>p.id===marker.holder)?.name}`:''}`;
    }else{
     if(actor!==marker.holder&&actor!==s.host)throw new RoomError('Only the holder or host can clear the title.');
     s.tableTitle={...marker,holder:undefined,version:marker.version+1};text=`cleared ${marker.label}`;
    }
   }
  }
  else if((input.type==='adjust'||input.type==='concede')&&!tableGameReady(s))throw new RoomError('Wait for everyone to join, the host to lock seats, and the first-player roll to finish.');
  else if(input.type==='start'){if(actor!==s.host)throw new RoomError('Only the host can start the game.');if(s.started&&s.firstPlayer)throw new RoomError('The game has already started.');if(s.players.length!==s.capacity)throw new RoomError('Wait for all '+s.capacity+' players to join.');s.started=true;s.firstPlayer={round:1,eligible:s.players.map(p=>p.id),rolls:{}};delete s.turnOrder;delete s.turn;text='locked seats; everyone rolls to see who goes first';}
  else if(input.type==='roll'){
   const roll=s.firstPlayer;if(!s.started||!roll||roll.winner||tableGameOver(s)||tableEliminated(player,s))throw new RoomError('First-player rolling is not open.');
   if(input.round!==roll.round||!roll.eligible.includes(actor)||Object.hasOwn(roll.rolls,actor))throw new RoomError('Wait for the other players or the next tie-break round.');
   const result=die();if(!Number.isInteger(result)||result<1||result>6)throw new RoomError('Invalid die result.');roll.rolls[actor]=result;text=`rolled ${result} on a six-sided die (round ${roll.round})`;
  }
  else if(input.type==='endTurn'){
   if(!tableTurnsEnabled(s))throw new RoomError('Turn passing is disabled by the host.');
   if(!s.turnOrder?.length||!s.turn||input.turn!==s.turn)throw new RoomError('The turn has changed or rolling is not finished.');
   if(actor!==currentTurnPlayer(s)&&actor!==s.host)throw new RoomError('Only the current player or host can advance the turn.');
   if(activeTablePlayers(s).length<2)throw new RoomError('At least two active players are needed to advance turns.');
   const ending=currentTurnPlayer(s),marker=sharedTableTitle(s);
   do{s.turn++;}while(s.players.some(p=>p.id===currentTurnPlayer(s)&&tableEliminated(p,s)));text=`ended the turn${marker.holder===ending&&marker.reminder?` · ${marker.label} reminder: ${marker.reminder}`:''} · turn ${s.turn}: ${s.players.find(p=>p.id===currentTurnPlayer(s))?.name}`;
  }
  else if(input.type==='reset'){if(actor!==s.host)throw new RoomError('Only the host can reset the game.');for(const p of s.players){p.life=roomProfile(s).health.start;p.poison=0;p.damage={};p.counters=Object.fromEntries((s.profile?.counters??[]).map(c=>[c.label,c.start]));p.conceded=false;delete p.lastEntry;}if(s.tableTitle)s.tableTitle={...s.tableTitle,holder:undefined,version:s.tableTitle.version+1};s.started=false;delete s.firstPlayer;delete s.turnOrder;delete s.turn;text=`reset the table to ${roomProfile(s).health.start} ${roomProfile(s).health.label}; seats are open`;}
  else if(input.type==='concede'){if(typeof input.value!=='boolean')throw new RoomError('Invalid concession.');player.conceded=input.value;delete player.lastEntry;text=input.value?'conceded':'returned to the game';}
  else if(input.type==='adjust'){
   const n=input.delta;if(!Number.isInteger(n)||n===0||Math.abs(n)>999)throw new RoomError('Use a whole-number change from 1 to 999.');
   if(input.field==='life'){const next=player.life+n;if(Math.abs(next)>99999)throw new RoomError('Primary total is out of range.');player.life=next;text=`${n>0?'+':''}${n} ${roomProfile(s).health.label} → ${next}`;}
   else if(input.field==='poison'){if(s.profile)throw new RoomError('Use a configured counter.');const next=player.poison+n;if(next<0||next>999)throw new RoomError('Poison cannot go below 0 or above 999.');player.poison=next;text=`${n>0?'+':''}${n} poison → ${next}`;}
   else if(input.field==='damage'){
    if(input.loseLife!==undefined&&typeof input.loseLife!=='boolean')throw new RoomError('Choose whether life should also be adjusted.');
    if(!roomProfile(s).sourceDamage.enabled)throw new RoomError('Source damage is disabled for this table.');
    const source=tableSources(s).find(c=>c.key===input.key);if(!source)throw new RoomError('Choose a damage source at this table.');
    const next=(player.damage[source.key]||0)+n;if(next<0||next>999)throw new RoomError('Source damage cannot go below 0 or above 999.');player.damage[source.key]=next;
    if(input.loseLife){if(Math.abs(player.life-n)>99999)throw new RoomError('Primary total is out of range.');player.life-=n;}
    text=`${n>0?'+':''}${n} damage from ${source.name} (${source.owner})${input.loseLife?' · life adjusted':''}`;
   }else if(input.field==='counter'){
    const key=label(input.key,24);if(['__proto__','constructor','prototype'].includes(key.toLowerCase()))throw new RoomError('Choose a different counter name.');
    if(!Object.hasOwn(player.counters,key)&&Object.keys(player.counters).length>=8)throw new RoomError('Use up to 8 custom counters.');
    const next=(Object.hasOwn(player.counters,key)?player.counters[key]:0)+n;if(next<0||next>9999)throw new RoomError('Counter is out of range.');player.counters[key]=next;text=`${n>0?'+':''}${n} ${key} → ${next}`;
   }else throw new RoomError('Unknown counter.');
   const before=original.players.find(p=>p.id===actor)!;
   player.lastEntry={id:requestId,text,before:structuredClone({life:before.life,poison:before.poison,damage:before.damage,counters:before.counters})};
  }else throw new RoomError('Unknown action.');
 }
 for(const p of s.players){const was=original.players.find(old=>old.id===p.id);if(was&&!tableEliminated(was,original)&&tableEliminated(p,s))text+=` · ${p.name} eliminated (${p.conceded?'conceded':tableWarnings(p,s).join(', ')})`;else if(was&&tableEliminated(was,original)&&!tableEliminated(p,s)&&input.type!=='reset')text+=` · ${p.name} restored after correction`;}
 if(s.tableTitle?.holder&&s.players.some(p=>p.id===s.tableTitle!.holder&&tableEliminated(p,s))){text+=` · ${s.tableTitle.label} cleared; choose a new holder manually`;s.tableTitle={...s.tableTitle,holder:undefined,version:s.tableTitle.version+1};}
 text+=settleFirstPlayer(s);
 if(s.turnOrder?.length&&s.turn&&activeTablePlayers(s).length>=2&&s.players.some(p=>p.id===currentTurnPlayer(s)&&tableEliminated(p,s))){do{s.turn++;}while(s.players.some(p=>p.id===currentTurnPlayer(s)&&tableEliminated(p,s)));text+=` · turn ${s.turn}: ${s.players.find(p=>p.id===currentTurnPlayer(s))?.name}`;}
 if(tableGameOver(s)&&!tableGameOver(original)){const winner=activeTablePlayers(s)[0];text+=winner?` · ${winner.name} wins; game over`:' · no active players remain; game over';}
 if(s.timer?.durationSeconds){
  if(s.closedAt!==undefined)s.timer={...s.timer,runningSince:undefined};
  else if(input.type==='reset')s.timer={...s.timer,remainingMs:s.timer.durationSeconds*1000,runningSince:undefined,turn:undefined,version:s.timer.version+1};
  else if(tableGameOver(s)&&s.timer.runningSince!==undefined)s.timer={...s.timer,remainingMs:turnTimeRemaining(s.timer,now),runningSince:undefined,version:s.timer.version+1};
  else if(s.turn&&original.turn!==s.turn)s.timer={...s.timer,remainingMs:s.timer.durationSeconds*1000,runningSince:now,turn:s.turn,version:s.timer.version+1};
 }
 s.revision++;s.log=[{id:requestId,at:now,player:player!.name,text},...s.log].slice(0,80);return s;
}
