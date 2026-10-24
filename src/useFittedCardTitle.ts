import {useLayoutEffect,type RefObject} from 'react';
export function fitCardTitle(title:HTMLHeadingElement,box:HTMLElement){
 let size=4.6;title.style.setProperty('--fit-title-size',`${size}cqi`);
 if(!title.clientWidth||!box.clientHeight)return;
 while((title.scrollWidth>title.clientWidth+.5||title.scrollHeight>box.clientHeight+.5)&&size>1){size=Math.max(1,size-.1);title.style.setProperty('--fit-title-size',`${size.toFixed(2)}cqi`);}
 title.dataset.titleFit=String(title.scrollWidth<=title.clientWidth+1&&title.scrollHeight<=box.clientHeight+1);
}
/** Fit the full name on one line in the space left by the printed cost. */
export default function useFittedCardTitle(ref:RefObject<HTMLHeadingElement|null>,key:string){
 useLayoutEffect(()=>{
  const title=ref.current,box=title?.parentElement;if(!title||!box)return;
  const fit=()=>fitCardTitle(title,box);
  fit();const observer=new ResizeObserver(fit);observer.observe(box);const costs=box.querySelector('.ashen-frame-topright');if(costs)observer.observe(costs);
  document.fonts?.ready.then(()=>{if(ref.current===title)fit();});return()=>observer.disconnect();
 },[ref,key]);
}
