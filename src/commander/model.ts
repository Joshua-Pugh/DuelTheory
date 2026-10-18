/** Manual multiplayer scorekeeping; this does not adjudicate card effects. */
export type CommanderPlayer={id:string;name:string;commanders:string[];life:number;poison:number;damage:Record<string,number>;counters:Record<string,number>;conceded:boolean};
export type FirstPlayerRoll={round:number;eligible:string[];rolls:Record<string,number>;winner?:string};
export type CommanderRoomState={code:string;title:string;host:string;capacity:number;started:boolean;revision:number;players:CommanderPlayer[];firstPlayer?:FirstPlayerRoll;turnOrder?:string[];turn?:number;log:{id:string;at:number;player:string;text:string}[]};
export type RoomCommand=
 |{type:'join';name:string;commanders:string[]}
 |{type:'adjust';field:'life'|'poison'|'damage'|'counter';delta:number;key?:string;loseLife?:boolean}
 |{type:'concede';value:boolean}
 |{type:'roll';round:number}|{type:'endTurn';turn:number}
 |{type:'start'}|{type:'reset'};
export class RoomError extends Error{}
const label=(value:unknown,max:number)=>{if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw new RoomError(`Enter text between 1 and ${max} characters.`);return value.trim();};
export function newCommanderRoom(code:string,title:unknown,capacity:unknown,host:string):CommanderRoomState{
 if(!Number.isInteger(capacity)||Number(capacity)<2||Number(capacity)>6)throw new RoomError('Choose 2–6 players.');
 return {code,title:label(title,50),host,capacity:Number(capacity),started:false,revision:0,players:[],log:[]};
}
export const commanderKey=(playerId:string,index:number)=>`${playerId}:${index}`;
export function commanderSources(s:CommanderRoomState){return s.players.flatMap(p=>p.commanders.map((name,i)=>({key:commanderKey(p.id,i),name,owner:p.name})));}
export function commanderWarnings(p:CommanderPlayer){return [...(p.life<=0?['Life is 0 or less']:[]),...(p.poison>=10?['10+ poison counters']:[]),...(Object.values(p.damage).some(n=>n>=21)?['21+ combat damage from one commander']:[])];}
export function commanderEliminated(p:CommanderPlayer){return p.conceded||commanderWarnings(p).length>0;}
export function activeCommanderPlayers(s:CommanderRoomState){return s.players.filter(p=>!commanderEliminated(p));}
export function commanderGameOver(s:CommanderRoomState){return s.started&&s.players.length>=2&&activeCommanderPlayers(s).length<2;}
export function commanderGameReady(s:CommanderRoomState){return s.started&&Boolean(s.firstPlayer?.winner);}
function settleFirstPlayer(s:CommanderRoomState){
 const roll=s.firstPlayer;if(!roll||roll.winner||commanderGameOver(s))return '';
 roll.eligible=roll.eligible.filter(id=>s.players.some(p=>p.id===id&&!commanderEliminated(p)));
 if(!roll.eligible.length){roll.eligible=activeCommanderPlayers(s).map(p=>p.id);roll.rolls={};roll.round++;return ' · remaining players roll again';}
 if(roll.eligible.length>1&&!roll.eligible.every(id=>Object.hasOwn(roll.rolls,id)))return '';
 const highest=Math.max(...roll.eligible.map(id=>roll.rolls[id]??0)),tied=roll.eligible.filter(id=>(roll.rolls[id]??0)===highest);
 if(tied.length>1){s.firstPlayer={round:roll.round+1,eligible:tied,rolls:{}};return ` · tied highest: ${s.players.filter(p=>tied.includes(p.id)).map(p=>p.name).join(', ')}; reroll`;}
 roll.winner=tied[0];const index=s.players.findIndex(p=>p.id===roll.winner);s.turnOrder=[...s.players.slice(index),...s.players.slice(0,index)].map(p=>p.id);s.turn=1;return ` · ${s.players[index].name} goes first`;
}
export function rollSixSidedDie(){const limit=4294967292;let value:number;do{value=crypto.getRandomValues(new Uint32Array(1))[0];}while(value>=limit);return value%6+1;}
export function currentTurnPlayer(s:CommanderRoomState){return s.turnOrder?.length&&s.turn?s.turnOrder[(s.turn-1)%s.turnOrder.length]:undefined;}
export function applyRoomCommand(original:CommanderRoomState,actor:string,input:RoomCommand,requestId:string,now=Date.now(),die=rollSixSidedDie):CommanderRoomState{
 if(!input||typeof input!=='object'||typeof input.type!=='string')throw new RoomError('Invalid action.');
 const s=structuredClone(original);let text='';let player=s.players.find(p=>p.id===actor);
 if(input.type==='join'){
  if(player)return s;
  if(s.started)throw new RoomError('This game has started; new seats are locked.');
  if(s.players.length>=s.capacity)throw new RoomError('This room is full.');
  const name=label(input.name,24);
  if(s.players.some(p=>p.name.toLowerCase()===name.toLowerCase()))throw new RoomError('That player name is already taken.');
  if(!Array.isArray(input.commanders)||input.commanders.length<1||input.commanders.length>2)throw new RoomError('Enter one or two commanders.');
  player={id:actor,name,commanders:input.commanders.map(n=>label(n,80)),life:40,poison:0,damage:{},counters:{},conceded:false};s.players.push(player);text='joined the table';
 }else{
  if(!player)throw new RoomError('Join this room before changing values.');
  if((input.type==='adjust'||input.type==='concede')&&!commanderGameReady(s))throw new RoomError('Wait for everyone to join, the host to lock seats, and the first-player roll to finish.');
  if(input.type==='start'){if(actor!==s.host)throw new RoomError('Only the host can start the game.');if(s.started&&s.firstPlayer)throw new RoomError('The game has already started.');if(s.players.length!==s.capacity)throw new RoomError('Wait for all '+s.capacity+' players to join.');s.started=true;s.firstPlayer={round:1,eligible:s.players.map(p=>p.id),rolls:{}};delete s.turnOrder;delete s.turn;text='locked seats; everyone rolls to see who goes first';}
  else if(input.type==='roll'){
   const roll=s.firstPlayer;if(!s.started||!roll||roll.winner||commanderGameOver(s)||commanderEliminated(player))throw new RoomError('First-player rolling is not open.');
   if(input.round!==roll.round||!roll.eligible.includes(actor)||Object.hasOwn(roll.rolls,actor))throw new RoomError('Wait for the other players or the next tie-break round.');
   const result=die();if(!Number.isInteger(result)||result<1||result>6)throw new RoomError('Invalid die result.');roll.rolls[actor]=result;text=`rolled ${result} on a six-sided die (round ${roll.round})`;
  }
  else if(input.type==='endTurn'){
   if(!s.turnOrder?.length||!s.turn||input.turn!==s.turn)throw new RoomError('The turn has changed or rolling is not finished.');
   if(actor!==currentTurnPlayer(s)&&actor!==s.host)throw new RoomError('Only the current player or host can advance the turn.');
   if(activeCommanderPlayers(s).length<2)throw new RoomError('At least two active players are needed to advance turns.');
   do{s.turn++;}while(s.players.some(p=>p.id===currentTurnPlayer(s)&&commanderEliminated(p)));text=`ended the turn · turn ${s.turn}: ${s.players.find(p=>p.id===currentTurnPlayer(s))?.name}`;
  }
  else if(input.type==='reset'){if(actor!==s.host)throw new RoomError('Only the host can reset the game.');for(const p of s.players){p.life=40;p.poison=0;p.damage={};p.counters={};p.conceded=false;}s.started=false;delete s.firstPlayer;delete s.turnOrder;delete s.turn;text='reset the table to 40 life; seats are open';}
  else if(input.type==='concede'){if(typeof input.value!=='boolean')throw new RoomError('Invalid concession.');player.conceded=input.value;text=input.value?'conceded':'returned to the game';}
  else if(input.type==='adjust'){
   const n=input.delta;if(!Number.isInteger(n)||n===0||Math.abs(n)>999)throw new RoomError('Use a whole-number change from 1 to 999.');
   if(input.field==='life'){const next=player.life+n;if(Math.abs(next)>99999)throw new RoomError('Life total is out of range.');player.life=next;text=`${n>0?'+':''}${n} life → ${next}`;}
   else if(input.field==='poison'){const next=player.poison+n;if(next<0||next>999)throw new RoomError('Poison cannot go below 0 or above 999.');player.poison=next;text=`${n>0?'+':''}${n} poison → ${next}`;}
   else if(input.field==='damage'){
    if(input.loseLife!==undefined&&typeof input.loseLife!=='boolean')throw new RoomError('Choose whether life should also be adjusted.');
    const source=commanderSources(s).find(c=>c.key===input.key);if(!source)throw new RoomError('Choose a commander at this table.');
    const next=(player.damage[source.key]||0)+n;if(next<0||next>999)throw new RoomError('Commander damage cannot go below 0 or above 999.');player.damage[source.key]=next;
    if(input.loseLife){if(Math.abs(player.life-n)>99999)throw new RoomError('Life total is out of range.');player.life-=n;}
    text=`${n>0?'+':''}${n} combat damage from ${source.name} (${source.owner})${input.loseLife?' · life adjusted':''}`;
   }else if(input.field==='counter'){
    const key=label(input.key,24);if(['__proto__','constructor','prototype'].includes(key.toLowerCase()))throw new RoomError('Choose a different counter name.');
    if(!Object.hasOwn(player.counters,key)&&Object.keys(player.counters).length>=8)throw new RoomError('Use up to 8 custom counters.');
    const next=(Object.hasOwn(player.counters,key)?player.counters[key]:0)+n;if(next<0||next>9999)throw new RoomError('Counter is out of range.');player.counters[key]=next;text=`${n>0?'+':''}${n} ${key} → ${next}`;
   }else throw new RoomError('Unknown counter.');
  }else throw new RoomError('Unknown action.');
 }
 for(const p of s.players){const was=original.players.find(old=>old.id===p.id);if(was&&!commanderEliminated(was)&&commanderEliminated(p))text+=` · ${p.name} eliminated (${p.conceded?'conceded':commanderWarnings(p).join(', ')})`;else if(was&&commanderEliminated(was)&&!commanderEliminated(p)&&input.type!=='reset')text+=` · ${p.name} restored after correction`;}
 text+=settleFirstPlayer(s);
 if(s.turnOrder?.length&&s.turn&&activeCommanderPlayers(s).length>=2&&s.players.some(p=>p.id===currentTurnPlayer(s)&&commanderEliminated(p))){do{s.turn++;}while(s.players.some(p=>p.id===currentTurnPlayer(s)&&commanderEliminated(p)));text+=` · turn ${s.turn}: ${s.players.find(p=>p.id===currentTurnPlayer(s))?.name}`;}
 if(commanderGameOver(s)&&!commanderGameOver(original)){const winner=activeCommanderPlayers(s)[0];text+=winner?` · ${winner.name} wins; game over`:' · no active players remain; game over';}
 s.revision++;s.log=[{id:requestId,at:now,player:player!.name,text},...s.log].slice(0,80);return s;
}
