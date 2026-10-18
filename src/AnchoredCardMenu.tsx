import {useLayoutEffect,useRef,useState,type ReactNode} from 'react';
export function clampCardMenu(x:number,y:number,width:number,height:number,viewportWidth:number,viewportHeight:number){
 return {left:Math.max(8,Math.min(x,viewportWidth-width-8)),top:Math.max(8,Math.min(y,viewportHeight-height-8))};
}
/** Measure the actual menu, including manual actions, rather than guessing its height. */
export default function AnchoredCardMenu({x,y,children}:{x:number;y:number;children:ReactNode}){
 const ref=useRef<HTMLDivElement>(null),[position,setPosition]=useState({left:8,top:8});
 useLayoutEffect(()=>{const fit=()=>{const box=ref.current?.getBoundingClientRect();if(!box)return;const next=clampCardMenu(x,y,box.width,box.height,window.innerWidth,window.innerHeight);setPosition(old=>old.left===next.left&&old.top===next.top?old:next);};fit();window.addEventListener('resize',fit);return()=>window.removeEventListener('resize',fit);},[x,y,children]);
 return <div ref={ref} className="dt-card-menu" role="menu" aria-label="Card actions" style={position}>{children}</div>;
}
