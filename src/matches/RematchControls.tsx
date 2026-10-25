import {useEffect,useState} from 'react';
import type {MatchView,MatchCommand} from './model';
export default function RematchControls({room,busy,send}:{room:MatchView;busy:boolean;send:(command:MatchCommand)=>Promise<boolean>}){
 const [now,setNow]=useState(Date.now);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 if(room.phase!=='complete')return null;
 if(!room.members.every(p=>p&&!p.left))return <p>A player has left. Create a new room to play again.</p>;
 const accepted=!!room.rematch&&room.rematch.expiresAt>now&&room.rematch.accepted[room.seat];
 const other=!!room.rematch&&room.rematch.expiresAt>now&&room.rematch.accepted[room.seat===0?1:0];
 return <section aria-label="Play again"><p>{accepted?'Waiting for your opponent to accept…':other?'Your opponent wants to play again.':'Play another match in this room?'} Both players must accept within one minute. You can pick decks again before the next coin flip.</p><button className="primary" disabled={busy} onClick={()=>void send({type:'rematch',accept:!accepted})}>{accepted?'Cancel rematch request':other?'Accept new match':'New match / duel'}</button></section>;
}
