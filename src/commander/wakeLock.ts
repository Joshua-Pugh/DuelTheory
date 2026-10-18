export type AwakeStatus='off'|'active'|'paused'|'unavailable';
export type ScreenLock={released:boolean;release:()=>Promise<void>;addEventListener:(event:'release',listener:()=>void)=>void;removeEventListener:(event:'release',listener:()=>void)=>void};
export type WakeEnvironment={request?:()=>Promise<ScreenLock>;visible:()=>boolean;listen:(listener:()=>void)=>()=>void};

/** One visible table owns one lock; late requests are released after leaving. */
export function keepTableAwake(env:WakeEnvironment,onStatus:(status:AwakeStatus)=>void){
 let disposed=false,pending=false,resumePending=false,lock:ScreenLock|null=null,removeRelease:(()=>void)|undefined;
 const release=()=>{const previous=lock;lock=null;removeRelease?.();removeRelease=undefined;if(previous)void previous.release().catch(()=>{});};
 const acquire=async()=>{
  if(disposed||pending||lock||!env.visible())return;
  if(!env.request){onStatus('unavailable');return;}
  pending=true;let hiddenDuringRequest=false;
  try{
   const next=await env.request();
   if(disposed||!env.visible()){hiddenDuringRequest=!disposed;await next.release().catch(()=>{});return;}
   if(next.released){onStatus('paused');return;}
   lock=next;
   const released=()=>{if(lock!==next||disposed)return;lock=null;removeRelease?.();removeRelease=undefined;onStatus('paused');};
   next.addEventListener('release',released);removeRelease=()=>next.removeEventListener('release',released);onStatus('active');
  }catch{if(!disposed)onStatus(env.visible()?'unavailable':'paused');}
  finally{pending=false;const resume=hiddenDuringRequest||resumePending;resumePending=false;if(resume&&!disposed&&env.visible()&&!lock)void acquire();}
 };
 const visibility=()=>{if(disposed)return;if(env.visible()){if(pending)resumePending=true;else void acquire();}else{release();onStatus('paused');}};
 const unlisten=env.listen(visibility);onStatus(env.visible()?'off':'paused');void acquire();
 return {retry:()=>void acquire(),dispose:()=>{disposed=true;unlisten();release();}};
}
