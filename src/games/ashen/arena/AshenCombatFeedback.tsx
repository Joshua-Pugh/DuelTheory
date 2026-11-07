import {useEffect,useLayoutEffect,useRef,useState,type RefObject} from 'react';
import type {Battlefield} from '../../../ashenBattlefieldState';
type Feedback={key:string;x:number;y:number;text:string};
/** Receipts are emitted by the engine. Loading/reconnecting/undoing never replays an old hit. */
export default function AshenCombatFeedback({state,board}:{state:Battlefield;board:RefObject<HTMLDivElement|null>}){
 const report=state.rules?.duel?.combat?.report,signature=report?`${report.serial}:${report.hits.length}:${report.fallen.length}`:'';
 const previous=useRef({signature,serial:report?.serial,hits:report?.hits.length||0,fallen:report?.fallen.length||0}),positions=useRef(new Map<string,{x:number;y:number}>());
 const [items,setItems]=useState<Feedback[]>([]),timer=useRef<number|undefined>(undefined);
 useEffect(()=>()=>window.clearTimeout(timer.current),[]);
 useLayoutEffect(()=>{
  const root=board.current;if(!root)return;
  const bounds=root.getBoundingClientRect(),current=new Map(Array.from(root.querySelectorAll<HTMLElement>('[data-ashen-card]')).map(e=>{const r=e.getBoundingClientRect();return [e.dataset.ashenCard!,{x:r.x+r.width/2-bounds.x,y:r.y+r.height/2-bounds.y}] as const;}));
  const old=previous.current;
  if(report&&signature!==old.signature&&(old.serial===undefined||report.serial>=old.serial)){
   const same=old.serial===report.serial,next:Feedback[]=[];
   const totals=new Map<string,number>();for(const hit of report.hits.slice(same?old.hits:0))totals.set(hit.target,(totals.get(hit.target)||0)+hit.amount);
   for(const [id,amount] of totals){const point=current.get(id)||positions.current.get(id);if(point)next.push({...point,key:`${signature}-${id}`,text:`−${amount}`});}
   for(const card of report.fallen.slice(same?old.fallen:0)){const point=positions.current.get(card.id)||current.get(card.id);if(point)next.push({...point,key:`${signature}-dead-${card.id}`,text:'Destroyed'});}
   if(next.length){setItems(next);window.clearTimeout(timer.current);timer.current=window.setTimeout(()=>setItems([]),1800);}
  }else if(!report||report.serial!==(old.serial??report.serial)){setItems([]);}
  previous.current={signature,serial:report?.serial,hits:report?.hits.length||0,fallen:report?.fallen.length||0};positions.current=current;
 },[state,signature,report,board]);
 return <div className="ab-combat-feedback" role="status" aria-label="Combat damage">{items.map(item=><span key={item.key} className={item.text==='Destroyed'?'ab-destroyed-pop':'ab-damage-pop'} style={{left:item.x,top:item.y}}>{item.text}</span>)}</div>;
}
