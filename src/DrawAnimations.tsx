import CardMotionLayer from './duelUi/CardMotionLayer';
import {useLayoutEffect,useRef,useState} from 'react';
import type {DuelState,Seat} from './engine/model';
type Flight={id:string;key:string;x:number;y:number;dx:number;dy:number;width:number;height:number;delay:number};
export function drawnInstances(before:DuelState|undefined,after:DuelState):{id:string;seat:Seat}[]{
 if(!before)return ([0,1] as Seat[]).flatMap(seat=>after.players[seat].hand.map(id=>({id,seat})));
 if(after.events.length<before.events.length)return [];
 return ([0,1] as Seat[]).flatMap(seat=>after.players[seat].hand.filter(id=>before.players[seat].deck.includes(id)).map(id=>({id,seat})));
}
export default function DrawAnimations({state}:{state:DuelState}){
 const previous=useRef<DuelState|undefined>(undefined),[flights,setFlights]=useState<Flight[]>([]);
 useLayoutEffect(()=>{if(!flights.length)return;const timer=window.setTimeout(()=>setFlights([]),1150);return()=>window.clearTimeout(timer);},[flights]);
 useLayoutEffect(()=>{
  const drawn=drawnInstances(previous.current,state);previous.current=state;
  if(!drawn.length||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const next:Flight[]=drawn.flatMap(({id,seat},i)=>{
   const deck=document.querySelector(`.dt-field-pile[data-owner="${seat}"].deck`)?.getBoundingClientRect();
   const card=document.querySelector(`.dt-field-hand [data-instance="${id}"]`)?.getBoundingClientRect();
   if(!deck||!card)return [];
   const x=deck.x+(deck.width-card.width)/2,y=deck.y+(deck.height-card.height)/2;
   return [{id,key:`${state.events.length}-${id}`,x,y,dx:card.x-x,dy:card.y-y,width:card.width,height:card.height,delay:(i%5)*100}];
  });
  setFlights(next);

 },[state]);
 return <CardMotionLayer flights={flights.map(f=>({...f,content:<span className="dt-card-back"><span className="dt-back-orbit"/><img src="/branding/dt-forge-crest.svg" alt=""/></span>}))}><style>{flights.map(f=>`.dt-field-hand [data-instance="${f.id}"]{animation:dt-card-arrival ${f.delay+600}ms ease-out}`).join("\n")}</style></CardMotionLayer>;
}
