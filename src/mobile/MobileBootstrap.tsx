import {useEffect,useState,type ComponentType} from 'react';
import './mobileLaunch.css';
const loadApp=()=>import('./MobileApp');
/** App code loads behind the intro. No network request or fabricated percentage. */
export default function MobileBootstrap({load=loadApp}:{load?:()=>Promise<{default:ComponentType}>}){
 const [App,setApp]=useState<ComponentType|null>(null),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  let disposed=false;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let introTimer:ReturnType<typeof setTimeout>,deadline:ReturnType<typeof setTimeout>;
  const intro=new Promise<void>(resolve=>{introTimer=setTimeout(resolve,reduced?0:1400);});
  const timeout=new Promise<never>((_,reject)=>{deadline=setTimeout(()=>reject(Error('Startup timed out')),15000);});
  Promise.race([Promise.all([load(),intro]),timeout]).then(result=>{if(!disposed)setApp(()=>result[0].default);}).catch(()=>{if(!disposed)setFailed(true);}).finally(()=>{clearTimeout(introTimer);clearTimeout(deadline);});
  return()=>{disposed=true;clearTimeout(introTimer);clearTimeout(deadline);};
 },[load,attempt]);
 if(App)return <App/>;
 return <section className="mobile-launch" aria-label="DuelTheory startup" aria-busy={!failed}>
  <img className="launch-crest" src="/branding/dt-forge-crest.svg" alt="" width="100" height="112"/>
  <img className="launch-wordmark" src="/branding/dt-wordmark.svg" alt="DuelTheory" width="280" height="70"/>
  <h1 aria-label="Build. Simulate. Master."><span aria-hidden="true">Build.</span><span aria-hidden="true">Simulate.</span><span aria-hidden="true">Master.</span></h1>
  {failed?<div role="alert"><p>Couldn’t open DuelTheory. Try again.</p><button onClick={()=>{setFailed(false);setAttempt(n=>n+1);}}>Retry</button></div>:<div role="status" className="launch-loading"><span className="launch-spinner" aria-hidden="true"/><span>Opening Table Companion…</span></div>}
  <small>Ashen Forge Games</small>
 </section>;
}
