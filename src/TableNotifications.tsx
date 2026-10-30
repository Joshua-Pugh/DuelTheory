import {createPortal} from 'react-dom';
import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {soundManager} from './audio/SoundManager';
import {tableNotifications} from './table/notifications';
import type {TableRoomState} from './table/model';

export default function TableNotifications({state,connected,settingsContainer}:{state:TableRoomState;connected:boolean;settingsContainer?:HTMLElement|null}){
 const previous=useRef<TableRoomState|null>(null),[messages,setMessages]=useState<string[]>([]);
 const settings=useSyncExternalStore(soundManager.subscribe,soundManager.snapshot,soundManager.snapshot);
 useEffect(()=>{
  const activate=()=>{void soundManager.unlock().then(ready=>{if(ready)soundManager.preloadTable();});};
  const hide=()=>{previous.current=null;if(document.hidden)soundManager.stop();};
  for(const event of ['pointerup','touchend','click','keydown'])window.addEventListener(event,activate,{capture:true,passive:true});
  document.addEventListener('visibilitychange',hide);
  return()=>{for(const event of ['pointerup','touchend','click','keydown'])window.removeEventListener(event,activate,true);document.removeEventListener('visibilitychange',hide);soundManager.stop();};
 },[]);
 useEffect(()=>{
  if(!connected||document.hidden){previous.current=null;return;}
  const notice=tableNotifications(previous.current,state);previous.current=state;
  if(notice.messages.length)setMessages(notice.messages);if(notice.cues.length)soundManager.play(notice.cues);
 },[state,connected]);
 useEffect(()=>{if(!messages.length)return;const timer=setTimeout(()=>setMessages([]),8000);return()=>clearTimeout(timer);},[messages]);
 const controls=<div className="ct-notifications"><details className="ct-panel"><summary>Table sounds · {settings.enabled&&settings.volume>0?'on':'muted'}</summary>
   <label><input type="checkbox" checked={settings.enabled} onChange={e=>soundManager.update({enabled:e.target.checked})}/> Table sound effects</label>
   <label>Volume<input aria-label="Table sound volume" type="range" min="0" max="100" value={Math.round(settings.volume*100)} onChange={e=>soundManager.update({volume:Number(e.target.value)/100})}/></label>
   <button type="button" onClick={async()=>{if(await soundManager.unlock())soundManager.play([{event:'tableTitle'}]);}}>Preview table sound</button>
   <p>Dice, life changes, title changes, eliminations and the final result. Saved on this device. Sounds play while the table is visible, after your first tap.</p>
  </details></div>;
 return <section className="ct-notifications" aria-label="Table notifications">{settingsContainer===undefined?controls:settingsContainer?createPortal(controls,settingsContainer):null}
  <div className="ct-notice" role="status" aria-live="polite" aria-atomic="true">{messages.map((message,i)=><p key={i}>{message}</p>)}</div>
 </section>;
}
