import type {CommanderRoomState,RoomCommand} from './model';
export type RoomSeat={code:string;token:string;playerId:string;api:string};
export type RoomReply={state:CommanderRoomState;playerId:string;serverNow?:number};
export const TABLE_API=(import.meta as ImportMeta & {env:Record<string,string>}).env.VITE_TABLE_API_URL||(import.meta as ImportMeta & {env:Record<string,string>}).env.VITE_COMMANDER_API_URL||'https://dueltheory-commander.cfpadvantage.workers.dev';
export const COMMANDER_API=TABLE_API; // Original endpoint alias for existing clients.
const storageKey='dueltheory-commander-seat-v1';
export function savedRoomSeat(code?:string):RoomSeat|null{try{const s=JSON.parse(localStorage.getItem(code?storageKey+':'+code:storageKey)||'null');return s&&typeof s.code==='string'&&typeof s.token==='string'&&typeof s.playerId==='string'&&typeof s.api==='string'?s:null;}catch{return null;}}
export const saveRoomSeat=(s:RoomSeat|null)=>{if(s){localStorage.setItem(storageKey,JSON.stringify(s));localStorage.setItem(storageKey+':'+s.code,JSON.stringify(s));}else localStorage.removeItem(storageKey);};
export function newRoomCode(){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return Array.from(crypto.getRandomValues(new Uint8Array(8)),b=>alphabet[b%alphabet.length]).join('');}
export const newSeatToken=()=>crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
export async function roomRequest(api:string,code:string,token:string,method:'create'|'join'|'read'|'action',input:unknown={},requestId=crypto.randomUUID()):Promise<RoomReply>{
 if(!api)throw Error('The shared room service has not been configured.');
 for(let attempt=0;attempt<2;attempt++){
  let response:Response;
  try{response=await fetch(`${api.replace(/\/$/,'')}/rooms/${code}/${method}`,{method:method==='read'?'GET':'POST',headers:{Authorization:`Bearer ${token}`,...(method==='read'?{}:{'Content-Type':'application/json','X-Request-ID':requestId})},...(method==='read'?{}:{body:JSON.stringify(input)}),signal:AbortSignal.timeout(10000)});}catch{if(attempt===0)continue;throw Error('Connection lost. Check your refreshed totals before entering that change again.');}
  const body=await response.json();if(response.status>=500&&attempt===0)continue;if(!response.ok)throw Error(body.error||'Unable to update this room.');return body as RoomReply;
 }
 throw Error('Unable to confirm the room update.');
}
export function roomInvite(code:string){const url=new URL(location.href);url.search='';url.searchParams.set('table',code);url.hash='';return url.toString();}
export type CounterCommand=Extract<RoomCommand,{type:'adjust'}>;
