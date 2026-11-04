import {useEffect,useRef,useState} from 'react';
import {eventRequest,eventToken} from './client';
import type {EventState} from './model';
export type SavedHub={code:string;name:string;deletedAt?:number};
export default function EventSavedHubs({hubs,open,change}:{hubs:SavedHub[];open:(code:string)=>void;change:(hubs:SavedHub[])=>void}){
 const [review,setReview]=useState<EventState|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const mounted=useRef(true);useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const run=async(h:SavedHub,confirm=false,restore=false)=>{
  setBusy(true);setError('');try{
   const token=eventToken(h.code),current=await eventRequest(h.code,token,'read');
   if(!current.state)throw Error('Open this event in its organizer browser to manage it.');
   if(!confirm&&!restore){setReview(current.state);return;}
   const revision=restore?current.state.revision:review?.revision;
   const next=await eventRequest(h.code,token,'action',{type:restore?'restoreEvent':'deleteEvent',revision});
   if(mounted.current){change(hubs.map(x=>x.code===h.code?{...x,deletedAt:next.state?.deletedAt}:x));setReview(null);}
  }catch(e){if(mounted.current)setError(e instanceof Error?e.message:'Could not update this event.');}finally{if(mounted.current)setBusy(false);}
 };
 const row=(h:SavedHub)=><div className="eh-saved-row" key={h.code}><button onClick={()=>open(h.code)}>{h.name} · {h.code}</button><button disabled={busy} onClick={()=>void run(h,false,Boolean(h.deletedAt))}>{h.deletedAt?'Restore event':'Delete event'}</button></div>;
 return <><div>{hubs.filter(h=>!h.deletedAt).map(row)}</div>{hubs.some(h=>h.deletedAt)&&<details><summary>Deleted events · restore</summary>{hubs.filter(h=>h.deletedAt).map(row)}</details>}{error&&<p role="alert">{error}</p>}{review&&<section className="eh-review" aria-label="Review event deletion"><h3>Delete {review.name}?</h3><p>This closes every table and disconnects {review.tables.reduce((n,t)=>n+(t.deletedAt?0:t.state.players.length),0)} occupied seats. Games stay archived. You can restore this event later with fresh seats and the same QR codes.</p><button disabled={busy} onClick={()=>void run({code:review.code,name:review.name},true)}>Delete event & close tables</button><button disabled={busy} onClick={()=>setReview(null)}>Cancel</button></section>}</>;
}
