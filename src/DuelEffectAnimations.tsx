import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import type {Card} from './core/types';
import type {DuelState} from './engine/model';
import './duelEffectAnimations.css';

export const DIE_ROLL_DURATION=2200;
const PIPS:Record<number,number[]>={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
const ANGLES:Record<number,[number,number]>={1:[0,0],2:[-90,0],3:[0,-90],4:[0,90],5:[90,0],6:[0,180]};
export function ZorcDieRoll({result,label='DARK MASTER · ZORC',manual=false}:{result:number;label?:string;manual?:boolean}){
 const [landed,setLanded]=useState(false);
 useEffect(()=>{const timer=window.setTimeout(()=>setLanded(true),window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:1650);return()=>window.clearTimeout(timer);},[]);
 const [x,y]=ANGLES[result];
 return <div className="dt-die-overlay" role="status" aria-live="polite"><div className="dt-die-heading"><small>{label}</small><h2>{landed?`Rolled ${result}`:'Rolling the die…'}</h2><p>{manual?'Tabletop roll · apply the result yourself.':landed?'Applying the result…':'The effect resolves after the die lands.'}</p></div><div className="dt-die-travel"><div className="dt-die-cube" style={{'--die-x':`${x}deg`,'--die-y':`${y}deg`} as CSSProperties}>{[1,2,3,4,5,6].map(value=><div className={`dt-die-face face-${value}`} key={value} aria-hidden="true">{Array.from({length:9},(_,index)=><i key={index} className={PIPS[value].includes(index)?'pip':''}/>)}</div>)}</div></div><div className="dt-die-shadow"/></div>;
}

export function graveyardMoves(before:DuelState|undefined,after:DuelState):string[]{
 if(!before||after.events.length<before.events.length)return [];
 return Object.keys(after.cards).filter(id=>after.cards[id].location==='graveyard'&&['monster','spell'].includes(before.cards[id]?.location));
}
type Rect={x:number;y:number;width:number;height:number};
type Flight=Rect&{key:string;dx:number;dy:number;image?:string;name:string};
export function GraveyardAnimations({state,catalog}:{state:DuelState;catalog:readonly Card[]}){
 const previous=useRef<DuelState|undefined>(undefined),positions=useRef(new Map<string,Rect>()),timers=useRef<number[]>([]),[flights,setFlights]=useState<Flight[]>([]);
 useEffect(()=>()=>{timers.current.forEach(window.clearTimeout);},[]);
 useLayoutEffect(()=>{
  const ids=graveyardMoves(previous.current,state);previous.current=state;
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
   const next=ids.flatMap((id,index)=>{
    const from=positions.current.get(id),owner=state.cards[id].owner,to=document.querySelector(`.dt-field-pile[data-owner="${owner}"].graveyard`)?.getBoundingClientRect(),card=catalog.find(c=>c.id===state.cards[id].cardId);
    return from&&to?[{...from,key:`${state.events.length}-${id}-${index}`,dx:to.x+(to.width-from.width)/2-from.x,dy:to.y+(to.height-from.height)/2-from.y,image:card?.image,name:card?.name??'Card'}]:[];
   });
   if(next.length){setFlights(old=>[...old,...next]);const keys=new Set(next.map(f=>f.key));timers.current.push(window.setTimeout(()=>setFlights(old=>old.filter(f=>!keys.has(f.key))),850));}
  }
  const updated=new Map<string,Rect>();
  document.querySelectorAll<HTMLElement>('.dt-field-zone [data-instance]').forEach(element=>{const id=element.dataset.instance;if(id){const r=element.getBoundingClientRect();updated.set(id,{x:r.x,y:r.y,width:r.width,height:r.height});}});positions.current=updated;
 },[state,catalog]);
 return <div className="dt-graveyard-flights" aria-hidden="true">{flights.map(f=><div key={f.key} className="dt-graveyard-flight" style={{left:f.x,top:f.y,width:f.width,height:f.height,'--gy-x':`${f.dx}px`,'--gy-y':`${f.dy}px`} as CSSProperties}>{f.image?<img src={f.image} alt=""/>:<span>{f.name}</span>}</div>)}</div>;
}
