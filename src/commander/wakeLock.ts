export type AwakeStatus='off'|'requesting'|'active'|'paused'|'unavailable';
export type ScreenLock={released:boolean;release:()=>Promise<void>;addEventListener:(event:'release',listener:()=>void)=>void;removeEventListener:(event:'release',listener:()=>void)=>void};
export type WakeEnvironment={request?:()=>Promise<ScreenLock>;visible:()=>boolean;listen:(listener:()=>void)=>()=>void};

/** One visible table owns one lock; late requests are released after leaving. */
export function keepTableAwake(env:WakeEnvironment,onStatus:(status:AwakeStatus,reason?:string)=>void){
 let disposed=false,pending=false,resumePending=false,lock:ScreenLock|null=null,removeRelease:(()=>void)|undefined,recoveries=0,retryAfter=0;
 let recoveryTimer:ReturnType<typeof setTimeout>|undefined;
 const clearRecovery=()=>{clearTimeout(recoveryTimer);recoveryTimer=undefined;};
 const release=()=>{const previous=lock;lock=null;removeRelease?.();removeRelease=undefined;if(previous)void previous.release().catch(()=>{});};
 const recover=()=>{if(disposed||!env.visible()||recoveries>=2)return;clearRecovery();recoveries++;recoveryTimer=setTimeout(()=>void acquire(),1000);};
 const acquire=async()=>{
  if(disposed||pending||lock||!env.visible())return;
  if(!env.request){onStatus('unavailable','Screen wake lock is not supported here. Use an updated browser over HTTPS.');return;}
  pending=true;retryAfter=Date.now()+5000;let hiddenDuringRequest=false;onStatus('requesting');
  try{
   const next=await env.request();
   if(disposed||!env.visible()){hiddenDuringRequest=!disposed;await next.release().catch(()=>{});return;}
   if(next.released){onStatus('paused','The phone released the lock. Tap Retry awake if it does not reconnect.');recover();return;}
   lock=next;const acquiredAt=Date.now();
   const released=()=>{if(lock!==next||disposed)return;lock=null;removeRelease?.();removeRelease=undefined;if(Date.now()-acquiredAt>=30000)recoveries=0;onStatus('paused',env.visible()?'The phone released the lock. Retrying when possible.':'Return to this tab to keep the screen awake.');recover();};
   next.addEventListener('release',released);removeRelease=()=>next.removeEventListener('release',released);onStatus('active');
  }catch{if(!disposed)onStatus(env.visible()?'unavailable':'paused','The browser or device declined the request. Keep this page visible, check power-saving settings, then tap Retry awake.');}
  finally{pending=false;const resume=hiddenDuringRequest||resumePending;resumePending=false;if(resume&&!disposed&&env.visible()&&!lock)void acquire();}
 };
 const visibility=()=>{if(disposed)return;clearRecovery();if(env.visible()){recoveries=0;if(pending)resumePending=true;else void acquire();}else{release();onStatus('paused','Return to this tab to keep the screen awake.');}};
 const unlisten=env.listen(visibility);onStatus(env.visible()?'off':'paused');void acquire();
 return {retry:(explicit=true)=>{if(!explicit&&Date.now()<retryAfter)return;if(explicit)recoveries=0;clearRecovery();void acquire();},dispose:()=>{disposed=true;clearRecovery();unlisten();release();}};
}
