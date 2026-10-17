import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import type {Card} from './core/types';
import type {DuelState} from './engine/model';
type Rect={x:number;y:number;width:number;height:number};
type Flight=Rect&{key:string;id:string;dx:number;dy:number;image?:string};
export function playedInstances(before:DuelState|undefined,after:DuelState):string[]{
 if(!before||after.events.length<before.events.length)return [];
 return Object.keys(after.cards).filter(id=>before.cards[id]?.location==='hand'&&['monster','spell'].includes(after.cards[id].location));
}
export default function HandPlayAnimations({state,catalog}:{state:DuelState;catalog:readonly Card[]}){
 const before=useRef<DuelState|undefined>(undefined),positions=useRef(new Map<string,Rect>()),timers=useRef<number[]>([]),[flights,setFlights]=useState<Flight[]>([]);
 useEffect(()=>()=>timers.current.forEach(window.clearTimeout),[]);
 useLayoutEffect(()=>{
  const prior=before.current,ids=playedInstances(prior,state);before.current=state;
  if(prior&&state.events.length<prior.events.length)setFlights([]);
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
   const next=ids.flatMap(id=>{const from=positions.current.get(id),to=document.querySelector(`.dt-field-zone [data-instance="${id}"]`)?.getBoundingClientRect();if(!from||!to)return [];const c=state.cards[id];return [{...from,id,key:`${state.events.length}-${id}`,dx:to.x-from.x,dy:to.y-from.y,image:c.faceDown?undefined:catalog.find(card=>card.id===c.cardId)?.image}];});
   if(next.length){setFlights(old=>[...old,...next]);const keys=new Set(next.map(f=>f.key));timers.current.push(window.setTimeout(()=>setFlights(old=>old.filter(f=>!keys.has(f.key))),650));}
  }
  const rects=new Map<string,Rect>();document.querySelectorAll<HTMLElement>('.dt-field-hand [data-instance]').forEach(e=>{const r=e.getBoundingClientRect();rects.set(e.dataset.instance!,{x:r.x,y:r.y,width:r.width,height:r.height});});positions.current=rects;
 },[state,catalog]);
 return <div className="dt-draw-flights" aria-hidden="true"><style>{flights.map(f=>`.dt-field-zone [data-instance="${f.id}"]{visibility:hidden}`).join('\n')}</style>{flights.map(f=><div key={f.key} className="dt-draw-flight" style={{left:f.x,top:f.y,width:f.width,height:f.height,'--draw-x':`${f.dx}px`,'--draw-y':`${f.dy}px`} as CSSProperties}>{f.image?<img className="dt-moving-card-image" src={f.image} alt=""/>:<span className="dt-card-back"><span className="dt-back-orbit"/><img src="/branding/dueltheory-crest.png" alt=""/></span>}</div>)}</div>;
}
