import {sharedTableTitle,tableEliminated,tableGameOver,activeTablePlayers,type TableRoomState} from './model';
import type {SoundCue} from '../audio/soundEvents';
export type TableNotice={messages:string[];cues:SoundCue[]};
/** Compare confirmed room snapshots. No initial/reconnected history, resets or repeated polls. */
export function tableNotifications(before:TableRoomState|null,after:TableRoomState):TableNotice{
 const empty={messages:[],cues:[]};
 if(!before||before.code!==after.code||after.revision<=before.revision||!after.started||!before.started)return empty;
 if(before.log.length&&!after.log.some(e=>before.log.some(old=>old.id===e.id)))return empty;
 // A new game may already have started between two polls. Never announce old eliminations.
 if(after.log.filter(e=>!before.log.some(old=>old.id===e.id)).some(e=>e.text.startsWith('reset the table')))return empty;
 const messages:string[]=[],cues:SoundCue[]=[];
 const oldTitle=sharedTableTitle(before),title=sharedTableTitle(after);
 if(oldTitle.holder!==title.holder){
  messages.push(title.holder?`${after.players.find(p=>p.id===title.holder)?.name??'A player'} holds ${title.label}.`:`${title.label} is now unclaimed.`);
  cues.push({event:'tableTitle'});
 }
 const eliminated=after.players.filter(p=>{const old=before.players.find(o=>o.id===p.id);return old&&!tableEliminated(old,before)&&tableEliminated(p,after);});
 for(const player of eliminated)messages.push(`${player.name} is eliminated.`);
 if(tableGameOver(after)&&!tableGameOver(before)){
  const winner=activeTablePlayers(after)[0];messages.push(winner?`${winner.name} wins. Game over.`:'Game over. No active players remain.');
  cues.splice(0,cues.length,{event:winner?'victory':'tableEliminated'});
 }else if(eliminated.length)cues.splice(0,cues.length,{event:'tableEliminated'});
 return {messages,cues};
}
