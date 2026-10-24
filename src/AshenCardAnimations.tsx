import {useEffect,useLayoutEffect,useRef,useState,type RefObject} from 'react';
import type {Battlefield} from './ashenBattlefieldState';
import CardMotionLayer,{motionBetween,type CardMotion,type MotionRect} from './duelUi/CardMotionLayer';
import {ashenVisualEvents} from './ashenVisualEvents';
import {ashenData} from './games/ashen/adapter';
import AshenCardFrame from './AshenCardFrame';
export default function AshenCardAnimations({state,seat,board}:{state:Battlefield;seat:0|1;board:RefObject<HTMLDivElement|null>}){
 const previous=useRef<Battlefield|undefined>(undefined),positions=useRef(new Map<string,MotionRect>()),serial=useRef(0),timers=useRef<number[]>([]);
 const [flights,setFlights]=useState<CardMotion[]>([]),[shuffles,setShuffles]=useState<(MotionRect&{key:string})[]>([]);
 useEffect(()=>()=>timers.current.forEach(window.clearTimeout),[]);
 useLayoutEffect(()=>{
  const root=board.current?.closest<HTMLElement>('.ab-shell');if(!root)return;const prior=previous.current;previous.current=state;
  const find=(selector:string)=>root.querySelector<HTMLElement>(selector)?.getBoundingClientRect();
  const events=ashenVisualEvents(prior,state),key=++serial.current;
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
   const next:CardMotion[]=[],mix:(MotionRect&{key:string})[]=[];
   for(const event of events){
    const deck=find(`[data-ashen-deck="${event.seat}"] .ab-card-back`);
    if(event.kind==='shuffle'){if(deck)mix.push({...deck,x:deck.x,y:deck.y,width:deck.width,height:deck.height,key:`${key}-${event.seat}`});continue;}
    const id=event.id!,card=state.table.cards[id],to=event.kind==='ossuary'?find(`[data-ashen-pile="${event.seat}:graveyard"]`):find(`[data-ashen-card="${id}"]`);
    const from=event.kind==='draw'&&deck&&to?{x:deck.x,y:deck.y,width:to.width,height:to.height}:positions.current.get(id)||(prior?.table.cards[id]?.zone==='graveyard'?find(`[data-ashen-pile="${event.seat}:graveyard"]`):undefined);
    if(!from||!to)continue;const data=ashenData(state,id),face=event.kind!=='draw'&&data&&!card.faceDown&&(card.zone!=='hand'||card.controller===seat);
    next.push({...motionBetween(from,to),key:`${key}-${id}`,delay:!prior?350+(next.length%6)*70:event.kind==='draw'?(next.length%5)*70:0,content:face?<AshenCardFrame card={data!} size="mini"/>:<span className="ab-card-back"><b>AT</b></span>});
   }
   if(next.length||mix.length){setFlights(old=>[...old,...next].slice(-24));setShuffles(old=>[...old,...mix].slice(-4));const keys=new Set(next.map(f=>f.key)),shuffleKeys=new Set(mix.map(f=>f.key));timers.current.push(window.setTimeout(()=>{setFlights(old=>old.filter(f=>!keys.has(f.key)));setShuffles(old=>old.filter(f=>!shuffleKeys.has(f.key)));},1500));}
  }
  // Keep hand origins while an Action waits in the Clash, so deployment still travels from hand.
  const updated=new Map<string,MotionRect>();for(const [id,rect] of positions.current)if(state.table.cards[id]?.zone==='clash')updated.set(id,rect);
  root.querySelectorAll<HTMLElement>('[data-ashen-card]').forEach(el=>{const r=el.getBoundingClientRect();updated.set(el.dataset.ashenCard!,{x:r.x,y:r.y,width:r.width,height:r.height});});positions.current=updated;
 },[state,seat,board]);
 return <CardMotionLayer flights={flights}>{shuffles.map(s=><div className="dt-shuffle-motion" key={s.key} style={{left:s.x,top:s.y,width:s.width,height:s.height}}>AT</div>)}</CardMotionLayer>;
}
