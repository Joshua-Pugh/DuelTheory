import {useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import type {DuelState,Seat} from './engine/model';
type Flight={key:string;x:number;y:number;dx:number;dy:number;width:number;height:number;delay:number};
export function drawnInstances(before:DuelState|undefined,after:DuelState):{id:string;seat:Seat}[]{
 if(!before)return ([0,1] as Seat[]).flatMap(seat=>after.players[seat].hand.map(id=>({id,seat})));
 if(after.events.length<before.events.length)return [];
 const events=after.events.slice(before.events.length);
 return ([0,1] as Seat[]).flatMap(seat=>events.some(e=>e.type==='DRAW'&&e.seat===seat)?after.players[seat].hand.filter(id=>before.players[seat].deck.includes(id)).map(id=>({id,seat})):[]);
}
export default function DrawAnimations({state}:{state:DuelState}){
 const previous=useRef<DuelState|undefined>(undefined),[flights,setFlights]=useState<Flight[]>([]);
 useLayoutEffect(()=>{
  const drawn=drawnInstances(previous.current,state);previous.current=state;
  if(!drawn.length)return;
  const next:Flight[]=drawn.flatMap(({id,seat},i)=>{
   const deck=document.querySelector(`.dt-field-pile[data-owner="${seat}"].deck`)?.getBoundingClientRect();
   const card=document.querySelector(`.dt-field-hand [data-instance="${id}"]`)?.getBoundingClientRect();
   if(!deck||!card)return [];
   const x=deck.x+(deck.width-card.width)/2,y=deck.y+(deck.height-card.height)/2;
   return [{key:`${state.events.length}-${id}`,x,y,dx:card.x-x,dy:card.y-y,width:card.width,height:card.height,delay:(i%5)*100}];
  });
  setFlights(next);
  const timer=window.setTimeout(()=>setFlights([]),1150);return()=>window.clearTimeout(timer);
 },[state]);
 return <div className="dt-draw-flights" aria-hidden="true">{flights.map(f=><div key={f.key} className="dt-draw-flight" style={{left:f.x,top:f.y,width:f.width,height:f.height,animationDelay:`${f.delay}ms`,'--draw-x':`${f.dx}px`,'--draw-y':`${f.dy}px`} as CSSProperties}><span className="dt-card-back"><span className="dt-back-orbit"/><img src="/branding/dueltheory-crest.png" alt=""/></span></div>)}</div>;
}
