import {useEffect,useState} from 'react';
import type {EventRound} from './model';
export function EventRoundNotice({round,offset}:{round:EventRound;offset:number}){return <section className="eh-announcement" aria-label="Event round"><strong>{round.phase==='seating'?`Seating for round ${round.number+1}`:`Round ${round.number} · ${round.phase==='active'?'in progress':'ended'}`}</strong>{round.phase!=='seating'&&<p><EventClock start={round.startedAt} end={round.endedAt} minutes={round.durationMinutes} offset={offset}/></p>}{round.phase==='ended'&&<p>Your game is saved. Stay here while the organizer prepares the next round.</p>}</section>;}
export function elapsedText(start:number,end:number){const seconds=Math.max(0,Math.floor((end-start)/1000));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
export default function EventClock({start,end,offset=0,minutes}:{start?:number;end?:number;offset?:number;minutes?:number}){
 const [now,setNow]=useState(Date.now());useEffect(()=>{if(!start||end)return;const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id);},[start,end]);
 if(!start)return <span>Timing begins when seats are locked.</span>;
 const at=end??now+offset,expired=minutes!==undefined&&at-start>=minutes*60000;
 return <span className={expired?'eh-time-expired':''}>{elapsedText(start,at)} elapsed{minutes!==undefined?` · ${minutes} min round${expired?' · time reached':''}`:''}</span>;
}
