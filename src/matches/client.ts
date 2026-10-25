import {requestSignal} from '../platform/polling';
import {publicInviteBase} from '../platform/publicUrl';
import {COMMANDER_API,newSeatToken} from '../commander/client';
import type {MatchView,MatchCommand,Game} from './model';
export const MATCH_API=COMMANDER_API.replace('dueltheory-commander','dueltheory-matches');
export type Credential={code:string;token:string};
export function savedMatch(code:string):Credential|null{try{return JSON.parse(localStorage.getItem('dt-match:'+code)||'null');}catch{return null;}}
export function forgetMatch(code:string){localStorage.removeItem('dt-match:'+code);}
export function rememberMatch(c:Credential){localStorage.setItem('dt-match:'+c.code,JSON.stringify(c));}
export const matchCredential=(code:string)=>savedMatch(code)||{code,token:newSeatToken()};
export class MatchRequestError extends Error{constructor(message:string,public status:number,public retryAfterMs=0){super(message);}}
export async function requestMatch<T=MatchView>(c:Credential,method:'create'|'join'|'info'|'read'|'action',input:unknown={},id=crypto.randomUUID(),signal?:AbortSignal):Promise<T>{const since=method==='read'&&input&&typeof input==='object'&&'since'in input&&Number.isSafeInteger(input.since)&&Number(input.since)>=0?`&since=${input.since}`:'';const timeout=requestSignal(15000,signal);try{const response=await fetch(`${MATCH_API}/matches/${c.code}/${method}?v=2${since}`,{cache:'no-store',method:method==='read'||method==='info'?'GET':'POST',headers:{Authorization:`Bearer ${c.token}`,'Content-Type':'application/json','X-Request-ID':id},...(method==='read'||method==='info'?{}:{body:JSON.stringify(input)}),signal:timeout.signal});const data=await response.json().catch(()=>({}));if(!response.ok){const seconds=Number(response.headers.get('Retry-After'));throw new MatchRequestError(data.error||(response.status===429?'Room requests are temporarily limited. Reconnecting shortly.':'Unable to update room.'),response.status,Number.isFinite(seconds)&&seconds>0?seconds*1000:response.status===429?15000:0);}return data;}finally{timeout.dispose();}}
export type RoomInfo={game:Game;full:boolean;phase:string;mode?:'single'|'best3'};
export const matchCommand=(c:Credential,revision:number,command:MatchCommand)=>requestMatch(c,'action',{revision,command});
export function matchInvite(code:string){const u=publicInviteBase();u.search='';u.hash=`/private/${code}`;return u.toString();}
