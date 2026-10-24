import {useEffect,useRef,useState} from 'react';
import {keepTableAwake,type AwakeStatus} from './commander/wakeLock';

export default function TableWakeLock(){
 const [enabled,setEnabled]=useState(()=>{try{return localStorage.getItem('dueltheory.table.keep-awake.v1')!=='off';}catch{return true;}}),[status,setStatus]=useState<AwakeStatus>('off'),[reason,setReason]=useState('');
 const controller=useRef<ReturnType<typeof keepTableAwake>|null>(null);
 useEffect(()=>{
  try{localStorage.setItem('dueltheory.table.keep-awake.v1',enabled?'on':'off');}catch{/* Storage is optional. */}
  if(!enabled){setStatus('off');setReason('');return;}
  const active=keepTableAwake({request:'wakeLock' in navigator?()=>navigator.wakeLock.request('screen'):undefined,visible:()=>document.visibilityState==='visible',listen:listener=>{document.addEventListener('visibilitychange',listener);window.addEventListener('pageshow',listener);window.addEventListener('focus',listener);return()=>{document.removeEventListener('visibilitychange',listener);window.removeEventListener('pageshow',listener);window.removeEventListener('focus',listener);};}},(next,detail)=>{setStatus(next);setReason(detail||'');});
  const gesture=()=>active.retry(false);window.addEventListener('pointerup',gesture,true);window.addEventListener('keydown',gesture,true);
  controller.current=active;return()=>{controller.current=null;window.removeEventListener('pointerup',gesture,true);window.removeEventListener('keydown',gesture,true);active.dispose();};
 },[enabled]);
 return <section className={`ct-awake ct-awake-${status}`} aria-label="Screen awake settings"><label className="ct-check"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> Keep screen awake</label><span role="status">{!enabled?'Off':status==='active'?'Active · wake lock granted':status==='paused'?'Paused · wake lock released':status==='unavailable'?'Not active · request declined or unsupported':'Requesting screen wake lock…'}</span>{enabled&&(status==='paused'||status==='unavailable')&&<button onClick={()=>controller.current?.retry()}>Retry awake</button>}{reason&&enabled&&<small>{reason}</small>}<small>Keep this Safari/browser tab visible. Leaving Table Companion releases the wake lock.</small></section>;
}
