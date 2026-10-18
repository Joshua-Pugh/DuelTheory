import {COMMANDER_API,newSeatToken} from '../commander/client';
import type {MatchView,MatchCommand,Game} from './model';
export const MATCH_API=COMMANDER_API.replace('dueltheory-commander','dueltheory-matches');
export type Credential={code:string;token:string};
export function savedMatch(code:string):Credential|null{try{return JSON.parse(localStorage.getItem('dt-match:'+code)||'null');}catch{return null;}}
export function rememberMatch(c:Credential){localStorage.setItem('dt-match:'+c.code,JSON.stringify(c));}
export const matchCredential=(code:string)=>savedMatch(code)||{code,token:newSeatToken()};
export async function requestMatch<T=MatchView>(c:Credential,method:'create'|'join'|'info'|'read'|'action',input:unknown={},id=crypto.randomUUID()):Promise<T>{const response=await fetch(`${MATCH_API}/matches/${c.code}/${method}`,{method:method==='read'||method==='info'?'GET':'POST',headers:{Authorization:`Bearer ${c.token}`,'Content-Type':'application/json','X-Request-ID':id},...(method==='read'||method==='info'?{}:{body:JSON.stringify(input)}),signal:AbortSignal.timeout(15000)});const data=await response.json();if(!response.ok)throw Error(data.error||'Unable to update room.');return data;}
export type RoomInfo={game:Game;full:boolean;phase:string};
export const matchCommand=(c:Credential,revision:number,command:MatchCommand)=>requestMatch(c,'action',{revision,command});
export function matchInvite(code:string){const u=new URL(location.href);u.search='';u.hash=`/private/${code}`;return u.toString();}
