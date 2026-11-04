import {useEffect,useState} from 'react';
import type {EventReply} from './model';
export type EventNotice={id:string;title:string;text:string;table?:number};
export function eventNotices(reply:EventReply):EventNotice[]{
 if(reply.event.deletedAt)return [];
 if(reply.state)return reply.state.tables.filter(t=>!t.deletedAt&&t.help).map(t=>({id:`help:${t.number}:${t.round}:${t.helpId??t.help}`,title:`Table ${t.number} needs assistance`,text:`${t.help} called the organizer.`,table:t.number}));
 const notices:EventNotice[]=[];
 if(reply.event.announcement)notices.push({id:`event:${reply.event.announcementId??reply.event.announcement}`,title:'From the organizer',text:reply.event.announcement});
 if(reply.table?.announcement)notices.push({id:`table:${reply.table.number}:${reply.table.announcementId??reply.table.announcement}`,title:`Message for Table ${reply.table.number}`,text:reply.table.announcement});
 return notices;
}
/** Non-modal alerts never block tracking. A tab remembers notices already shown across reloads. */
export default function EventAlerts({reply,select}:{reply:EventReply;select:(table:number)=>void}){
 const scope=`dt.event.notices.${reply.event.code}.${reply.state?'organizer':'player'}`;
 const [seen]=useState(()=>{try{return new Set<string>(JSON.parse(sessionStorage.getItem(scope)||'[]'));}catch{return new Set<string>();}});
 const [queue,setQueue]=useState<EventNotice[]>([]),[paused,setPaused]=useState(false),current=queue[0];
 const incoming=JSON.stringify(eventNotices(reply));
 useEffect(()=>{const notices=JSON.parse(incoming) as EventNotice[],added=notices.filter(n=>!seen.has(n.id));for(const n of added)seen.add(n.id);try{sessionStorage.setItem(scope,JSON.stringify([...seen].slice(-300)));}catch{/* Alerts still work without session storage. */}setQueue(q=>[...q.filter(n=>notices.some(active=>active.id===n.id)),...added]);},[incoming,scope,seen]);
 const dismiss=()=>setQueue(q=>q.slice(1));
 useEffect(()=>{if(!current||paused)return;const timer=setTimeout(()=>setQueue(q=>q.slice(1)),10000);return()=>clearTimeout(timer);},[current?.id,paused]);
 if(!current)return null;
 return <aside className="eh-popup" aria-label="Event notification" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocus={()=>setPaused(true)} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setPaused(false);}}><div role="status" aria-live="polite" aria-atomic="true"><strong>{current.title}</strong><p>{current.text}</p></div><small>Closes after 10 seconds. {current.table?'The assistance request stays on the table until resolved.':'The message remains on the event page.'}</small><div>{current.table&&<button onClick={()=>{select(current.table!);dismiss();}}>View Table {current.table}</button>}<button onClick={dismiss}>Dismiss{queue.length>1?` · ${queue.length-1} more`:''}</button></div></aside>;
}
