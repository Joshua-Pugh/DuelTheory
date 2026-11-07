import {useEffect,useState,type RefObject} from 'react';

/** Match the visible browser area, including Safari's expanding toolbars. */
export function useArenaDisplay(ref:RefObject<HTMLElement|null>,active:boolean){
 const [fullscreen,setFullscreen]=useState(false),[displayNotice,setDisplayNotice]=useState('');
 const canFullscreen=typeof document!=='undefined'&&!!document.fullscreenEnabled;
 useEffect(()=>{
  const target=ref.current;if(!active||!target)return;
  const viewport=window.visualViewport;
  const update=()=>{if(viewport&&viewport.scale!==1)return;target.style.setProperty('--arena-view-height',`${viewport?.height??window.innerHeight}px`);target.style.setProperty('--arena-view-width',`${viewport?.width??window.innerWidth}px`);target.style.setProperty('--arena-view-top',`${viewport?.offsetTop??0}px`);target.style.setProperty('--arena-view-left',`${viewport?.offsetLeft??0}px`);};
  update();window.addEventListener('resize',update);viewport?.addEventListener('resize',update);viewport?.addEventListener('scroll',update);
  return()=>{window.removeEventListener('resize',update);viewport?.removeEventListener('resize',update);viewport?.removeEventListener('scroll',update);for(const name of ['height','width','top','left'])target.style.removeProperty('--arena-view-'+name);};
 },[active,ref]);
 useEffect(()=>{const update=()=>setFullscreen(!!document.fullscreenElement);document.addEventListener('fullscreenchange',update);return()=>document.removeEventListener('fullscreenchange',update);},[]);
 const enterFullscreen=async()=>{
  setDisplayNotice('');
  try{
   if(document.fullscreenElement){await document.exitFullscreen();return;}
   await ref.current?.requestFullscreen();
   const orientation=screen.orientation as ScreenOrientation&{lock?:(value:'landscape')=>Promise<void>};
   if(orientation?.lock)try{await orientation.lock('landscape');}catch{setDisplayNotice('Fullscreen is on. Turn your phone sideways for more room.');}
  }catch{setDisplayNotice('Fullscreen is unavailable here. Turn your phone sideways, or open DuelTheory from your Home Screen.');}
 };
 return {canFullscreen,fullscreen,enterFullscreen,displayNotice};
}
