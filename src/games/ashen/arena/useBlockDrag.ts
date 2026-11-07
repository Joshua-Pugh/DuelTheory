import {useRef,useState,type PointerEvent} from 'react';
import type {Battlefield} from '../../../ashenBattlefieldState';
import {inspectAshenBlocker} from '../duel';

type Gesture={blocker:string;pointer:number;x:number;y:number;active:boolean};
export type BlockDrag={from:string;x:number;y:number};

export function useBlockDrag(state:Battlefield,seat:0|1,enabled:boolean,assign:(attacker:string,blocker:string)=>void,report:(reason:string)=>void){
 const gesture=useRef<Gesture|null>(null);
 const swallowClick=useRef(false);
 const [drag,setDrag]=useState<BlockDrag|null>(null);
 const legal=(blocker:string)=>(state.rules?.duel?.combat?.attackers||[]).filter(attacker=>inspectAshenBlocker(state,attacker,blocker).allowed);
 const eligible=(id:string)=>enabled&&state.table.active!==seat&&state.table.cards[id]?.controller===seat&&legal(id).length>0;
 const cardAt=(event:PointerEvent<HTMLDivElement>)=>{
  const element=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLElement>('[data-ashen-card]');
  return element&&event.currentTarget.contains(element)?element.dataset.ashenCard:undefined;
 };
 const stop=()=>{gesture.current=null;setDrag(null);};
 return {
  drag,eligible,
  validTarget:(id:string)=>!!drag&&inspectAshenBlocker(state,id,drag.from).allowed,
  handlers:{
   onPointerDown:(event:PointerEvent<HTMLDivElement>)=>{
    swallowClick.current=false;
    if(event.button!==0||!event.isPrimary||gesture.current)return;
    const blocker=(event.target as Element).closest<HTMLElement>('[data-ashen-card]')?.dataset.ashenCard;
    if(blocker&&eligible(blocker))gesture.current={blocker,pointer:event.pointerId,x:event.clientX,y:event.clientY,active:false};
   },
   onPointerMove:(event:PointerEvent<HTMLDivElement>)=>{
    const current=gesture.current;
    if(!current||current.pointer!==event.pointerId)return;
    if(!current.active){
     if(Math.hypot(event.clientX-current.x,event.clientY-current.y)<7)return;
     current.active=true;
     event.currentTarget.setPointerCapture(event.pointerId);
    }
    setDrag({from:current.blocker,x:event.clientX,y:event.clientY});
   },
   onPointerUp:(event:PointerEvent<HTMLDivElement>)=>{
    const current=gesture.current;
    if(!current||current.pointer!==event.pointerId)return;
    if(current.active){
     swallowClick.current=true;
     const target=cardAt(event);
     if(target&&target!==current.blocker){
      const check=inspectAshenBlocker(state,target,current.blocker);
      if(check.allowed)assign(target,current.blocker);
      else report(check.reason);
     }
    }
    stop();
   },
   onPointerCancel:stop,
   onLostPointerCapture:(event:PointerEvent<HTMLDivElement>)=>{if(event.target===event.currentTarget)stop();},
   onPointerLeave:()=>{if(!gesture.current?.active)stop();},
   onClickCapture:(event:React.MouseEvent<HTMLDivElement>)=>{
    if(!swallowClick.current||event.detail===0)return;
    swallowClick.current=false;
    event.preventDefault();
    event.stopPropagation();
   },
  },
 };
}
