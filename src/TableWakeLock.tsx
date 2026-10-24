import {useEffect,useRef,useState} from 'react';
import {keepTableAwake,type AwakeStatus} from './commander/wakeLock';

export default function TableWakeLock(){
 const [enabled,setEnabled]=useState(true),[status,setStatus]=useState<AwakeStatus>('off');
 const controller=useRef<ReturnType<typeof keepTableAwake>|null>(null);
 useEffect(()=>{
  if(!enabled){setStatus('off');return;}
  const active=keepTableAwake({request:'wakeLock' in navigator?()=>navigator.wakeLock.request('screen'):undefined,visible:()=>document.visibilityState==='visible',listen:listener=>{document.addEventListener('visibilitychange',listener);return()=>document.removeEventListener('visibilitychange',listener);}},setStatus);
  controller.current=active;return()=>{controller.current=null;active.dispose();};
 },[enabled]);
 return <section className="ct-awake" aria-label="Screen awake settings"><label className="ct-check"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> Keep screen awake</label><span role="status">{!enabled?'Off':status==='active'?'Active · screen stays awake':status==='paused'?'Paused · return to this tab to resume':status==='unavailable'?'Unavailable · your browser or phone declined the request':'Requesting screen wake lock…'}</span>{enabled&&(status==='paused'||status==='unavailable')&&<button onClick={()=>controller.current?.retry()}>Try again</button>}<small>Keep Table Companion visible. Leaving this screen releases the wake lock.</small></section>;
}
