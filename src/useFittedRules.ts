import {useLayoutEffect,type RefObject} from 'react';
/** Fit actual rendered paragraphs and glyphs; never replace overflow with a scrollbar. */
export default function useFittedRules(ref:RefObject<HTMLDivElement|null>,contentKey:string){
 useLayoutEffect(()=>{
  const box=ref.current;if(!box)return;
  const fit=()=>{
   let size=parseFloat(getComputedStyle(box).getPropertyValue('--rules-max-size'))||4.2;
   const needed=()=>{
    const style=getComputedStyle(box);
    const children=Array.from(box.children) as HTMLElement[];
    const height=children.reduce((sum,child)=>sum+child.getBoundingClientRect().height,0);
    return height+parseFloat(style.paddingTop)+parseFloat(style.paddingBottom)+parseFloat(style.rowGap||'0')*Math.max(0,children.length-1);
   };
   box.style.setProperty('--fit-rules-size',`${size}cqi`);
   while(needed()>box.clientHeight+.5&&size>1){size=Math.max(1,size-.1);box.style.setProperty('--fit-rules-size',`${size.toFixed(2)}cqi`);}
   box.dataset.rulesFit=String(needed()<=box.clientHeight+1);
  };
  fit();const observer=new ResizeObserver(fit);observer.observe(box);
  document.fonts.ready.then(()=>{if(ref.current===box)fit();});
  return()=>observer.disconnect();
 },[ref,contentKey]);
}
