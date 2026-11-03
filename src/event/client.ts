import {TABLE_API,newSeatToken} from '../table/client';
import {publicInviteBase} from '../platform/publicUrl';
import {requestSignal} from '../platform/polling';
import type {EventReply} from './model';
export const EVENT_API=(import.meta as ImportMeta & {env:Record<string,string>}).env.VITE_EVENT_API_URL||TABLE_API;
export function eventLink(code:string,table?:number,display=false){const url=publicInviteBase();url.searchParams.set('event',code);if(table)url.searchParams.set('eventTable',String(table));if(display)url.searchParams.set('display','1');else url.searchParams.set('player','1');url.hash='/event-hub';return url.toString();}
export function eventToken(code:string,display=false){const key=`dt.event.${display?'display':'access'}.${code}`;let token=localStorage.getItem(key);if(!token){token=newSeatToken();localStorage.setItem(key,token);}return token;}
/** Reuse legacy guest seats; organizer browsers receive a separate, unprivileged player identity. */
export async function resolveEventToken(code:string,display=false,player=false,signal?:AbortSignal){
 if(display||!player)return eventToken(code,display);
 const key=`dt.event.player.${code}`,saved=localStorage.getItem(key);if(saved)return saved;
 const legacy=localStorage.getItem(`dt.event.access.${code}`);
 let token:string;
 if(legacy){const reply=await eventRequest(code,legacy,'read',{},signal);token=reply.state?newSeatToken():legacy;}else token=newSeatToken();
 if(signal?.aborted)throw new DOMException('Request cancelled','AbortError');
 // Two tabs resolving together must converge on the first saved player credential.
 token=localStorage.getItem(key)||token;localStorage.setItem(key,token);
 if(!localStorage.getItem(`dt.event.access.${code}`))localStorage.setItem(`dt.event.access.${code}`,token);
 return token;
}
export async function eventRequest(code:string,token:string,method:'read'|'create'|'action'|'history',input:Record<string,unknown>={},signal?:AbortSignal):Promise<EventReply>{
 const id=crypto.randomUUID();
 for(let attempt=0;attempt<2;attempt++){
  const timeout=requestSignal(10000,signal);
  try{
   const reading=method==='read'||method==='history';
   const r=await fetch(`${EVENT_API}/events/${code}/${method}${method==='history'?`?cursor=${Number(input.cursor??0)}`:''}`,{method:reading?'GET':'POST',headers:{Authorization:`Bearer ${token}`,...(reading?{}:{'Content-Type':'application/json','X-Request-ID':id})},...(reading?{}:{body:JSON.stringify(input)}),signal:timeout.signal});
   const data=await r.json();if(r.status>=500&&attempt===0)continue;if(!r.ok)throw Error(data.error||'Could not update this event.');return data;
  }catch(e){if(signal?.aborted)throw e;if(attempt===0&&e instanceof TypeError)continue;throw e;}finally{timeout.dispose();}
 }
 throw Error('Could not confirm this change. Refresh before trying again.');
}
