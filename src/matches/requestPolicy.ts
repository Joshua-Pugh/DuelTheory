/** 80 idle reads/minute leaves room for actions within the existing 180/minute seat budget. */
export const MATCH_POLL_MS=750;
export const MATCH_AUTO_STEP_MS=150;
export const automaticRetryDelay=(cooldownRemaining=0)=>Math.max(1000,cooldownRemaining);
/** Independent seat budgets prevent two friends on one connection sharing a gameplay limit. */
export const matchRateKey=(code:string,hash:string,method:string,ip:string)=>['create','join','info'].includes(method)?`entry:${ip}`:`seat:${code}:${hash}`;
export function pollDelay(failures:number,retryAfterMs=0){return Math.max(Math.min(30000,2000*2**Math.min(failures,4)),Math.min(60000,retryAfterMs));}
export const automaticActionKey=(revision:number,action:unknown)=>`${revision}:${JSON.stringify(action)}`;
/** A failed automatic step cannot be resubmitted on each busy-state render. */
export class AutomaticActionGate{
 private key='';private retryAt=0;
 ready(key:string,now=Date.now()){return key!==this.key||now>=this.retryAt;}
 claim(key:string,now=Date.now()){if(!this.ready(key,now))return false;this.key=key;this.retryAt=Infinity;return true;}
 retryAfter(key:string,delay:number,now=Date.now()){if(key===this.key)this.retryAt=now+delay;}
}
