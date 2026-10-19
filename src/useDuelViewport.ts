import {useLayoutEffect,type RefObject} from 'react';
/** Safari's visible viewport changes with browser chrome, rotation and the on-screen keyboard. */
export function bindDuelViewport(element:HTMLElement,host:Window=window){
 const viewport=host.visualViewport;
 const fit=()=>{const height=viewport?.height&&viewport.height>0?viewport.height:host.innerHeight,width=viewport?.width&&viewport.width>0?viewport.width:host.innerWidth;const values={'--dt-view-top':Math.max(0,viewport?.offsetTop??0),'--dt-view-left':Math.max(0,viewport?.offsetLeft??0),'--dt-view-height':height,'--dt-view-width':width};for(const [key,value] of Object.entries(values))element.style.setProperty(key,`${value}px`);};
 fit();host.addEventListener('resize',fit);viewport?.addEventListener('resize',fit);viewport?.addEventListener('scroll',fit);
 return()=>{host.removeEventListener('resize',fit);viewport?.removeEventListener('resize',fit);viewport?.removeEventListener('scroll',fit);for(const key of ['--dt-view-top','--dt-view-left','--dt-view-height','--dt-view-width'])element.style.removeProperty(key);};
}
export function useDuelViewport(ref:RefObject<HTMLElement|null>){useLayoutEffect(()=>ref.current?bindDuelViewport(ref.current):undefined,[ref]);}
