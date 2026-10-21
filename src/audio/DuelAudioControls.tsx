import {useEffect,useState,useSyncExternalStore} from 'react';
import {soundManager,type AudioSettings} from './SoundManager';
import './audio.css';
export default function DuelAudioControls(){
 const [status,setStatus]=useState('');
 const settings=useSyncExternalStore(soundManager.subscribe,soundManager.snapshot,soundManager.snapshot);
 useEffect(()=>{
  const unlock=()=>{void soundManager.unlock();};
  const visibility=()=>{if(document.hidden)soundManager.stop();else void soundManager.unlock();};
  // Touch pointerdown is not an activation gesture in every mobile browser.
  const gestures=['pointerdown','pointerup','touchend','click','keydown'] as const;
  for(const event of gestures)window.addEventListener(event,unlock,{capture:true,passive:true});
  document.addEventListener('visibilitychange',visibility);
  return()=>{for(const event of gestures)window.removeEventListener(event,unlock,true);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 return <details className="dt-audio"><summary>Audio · {settings.enabled&&settings.volume>0?'On':'Muted'}</summary><div className="dt-audio-panel"><label><input type="checkbox" checked={settings.enabled} onChange={e=>soundManager.update({enabled:e.target.checked})}/>Sound effects</label><label>Master volume · {Math.round(settings.volume*100)}%<input aria-label="Duel audio volume" type="range" min="0" max="100" value={Math.round(settings.volume*100)} onChange={e=>soundManager.update({volume:Number(e.target.value)/100})}/></label><label>Sound pack<select value={settings.pack} onChange={e=>soundManager.update({pack:e.target.value as AudioSettings['pack']})}><option value="classic">Classic TCG</option><option value="cinematic">Cinematic</option><option value="minimal">Minimal tabletop</option></select></label><button className="secondary" type="button" onClick={async()=>{setStatus('Starting audio…');const ready=await soundManager.unlock();setStatus(!settings.enabled||settings.volume===0?'Audio is muted. Use Enable / recover audio to turn it on.':ready?'Playing preview.':'Browser audio is paused. Try Enable / recover audio.');if(ready)soundManager.play([{event:'special'}]);}}>Preview sound</button><button className="secondary" type="button" onClick={async()=>{setStatus('Restarting audio…');soundManager.update({enabled:true,volume:settings.volume>0?settings.volume:0.65});const ready=await soundManager.recover();setStatus(ready?'Audio restarted. Playing preview.':'The browser could not start audio. Check this tab’s sound permission.');if(ready)soundManager.play([{event:'special'}]);}}>Enable / recover audio</button>{status&&<small role="status">{status}</small>}<small>Saved on this device. Audio starts after a tap or key press.</small></div></details>;
}
