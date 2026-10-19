import {useEffect,useSyncExternalStore} from 'react';
import {soundManager,type AudioSettings} from './SoundManager';
import './audio.css';
export default function DuelAudioControls(){
 const settings=useSyncExternalStore(soundManager.subscribe,soundManager.snapshot,soundManager.snapshot);
 useEffect(()=>{
  const unlock=()=>{void soundManager.unlock();};
  const visibility=()=>{if(document.hidden)soundManager.stop();};
  // Touch pointerdown is not an activation gesture in every mobile browser.
  const gestures=['pointerdown','pointerup','touchend','click','keydown'] as const;
  for(const event of gestures)window.addEventListener(event,unlock,{capture:true,passive:true});
  document.addEventListener('visibilitychange',visibility);
  return()=>{for(const event of gestures)window.removeEventListener(event,unlock,true);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 return <details className="dt-audio"><summary>Audio · {settings.enabled?'On':'Muted'}</summary><div className="dt-audio-panel"><label><input type="checkbox" checked={settings.enabled} onChange={e=>soundManager.update({enabled:e.target.checked})}/>Sound effects</label><label>Master volume · {Math.round(settings.volume*100)}%<input aria-label="Duel audio volume" type="range" min="0" max="100" value={Math.round(settings.volume*100)} onChange={e=>soundManager.update({volume:Number(e.target.value)/100})}/></label><label>Sound pack<select value={settings.pack} onChange={e=>soundManager.update({pack:e.target.value as AudioSettings['pack']})}><option value="classic">Classic TCG</option><option value="cinematic">Cinematic</option><option value="minimal">Minimal tabletop</option></select></label><button className="secondary" type="button" onClick={async()=>{await soundManager.unlock();soundManager.play([{event:'special'}]);}}>Preview sound</button><small>Saved on this device. Audio starts after a tap or key press.</small></div></details>;
}
