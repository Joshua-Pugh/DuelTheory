import {useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import type {DuelState,PendingAttack} from './engine/model';
import {attackPath} from './attackPresentation';
import './attackIndicator.css';
type Point={x:number;y:number};
/** Pointer-transparent, board-relative SVG; observes layout changes instead of assuming zone coordinates. */
export default function AttackIndicator({state,viewer}:{state:DuelState;viewer:0|1}){
 const ref=useRef<SVGSVGElement>(null),previous=useRef(state),positions=useRef(new Map<string,Point>()),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const [recent,setRecent]=useState<PendingAttack|null>(null),[line,setLine]=useState<{from:Point;to:Point}|null>(null);const marker=useId().replace(/[^a-zA-Z0-9]/g,'');
 useEffect(()=>{const before=previous.current;previous.current=state;
  if(state.pendingAttack||state.phase!=='BATTLE'||state.turn!==before.turn||state.events.length<before.events.length){clearTimeout(timer.current);setRecent(null);return;}
  const b=state.lastBattle,old=before.lastBattle;
  if(b&&(b.turn!==old?.turn||b.eventIndex!==old?.eventIndex||b.attackerId!==old?.attackerId)){
   clearTimeout(timer.current);const attacker=state.cards[b.attackerId]?.controller??0;setRecent({attackerId:b.attackerId,targetId:b.targetId,attacker,defender:attacker===0?1:0});timer.current=setTimeout(()=>setRecent(null),1000);
  }
 },[state]);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 const attack=state.pendingAttack??recent;
 useLayoutEffect(()=>{const board=ref.current?.closest('.dt-duel-board');if(!board)return;
  const measure=()=>{const origin=board.getBoundingClientRect(),nodes=Array.from(board.querySelectorAll<HTMLElement>('.dt-field-zone [data-instance]'));
   for(const node of nodes){const r=node.getBoundingClientRect();positions.current.set(node.dataset.instance!,{x:r.x+r.width/2-origin.x,y:r.y+r.height/2-origin.y});}
   let next:typeof line=null;
   if(attack&&!attack.replay){const from=positions.current.get(attack.attackerId);let to=attack.targetId?positions.current.get(attack.targetId):undefined;
    if(!attack.targetId){const r=board.querySelector(`[data-player="${attack.defender}"]`)?.getBoundingClientRect();if(r)to={x:r.x+r.width/2-origin.x,y:r.y+r.height/2-origin.y};}
    if(from&&to)next={from,to};
   }
   setLine(old=>JSON.stringify(old)===JSON.stringify(next)?old:next);
  };
  measure();const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;observer?.observe(board);window.addEventListener('resize',measure);window.addEventListener('scroll',measure,true);window.visualViewport?.addEventListener('resize',measure);
  return()=>{observer?.disconnect();window.removeEventListener('resize',measure);window.removeEventListener('scroll',measure,true);window.visualViewport?.removeEventListener('resize',measure);};
 },[state,attack,viewer]);
 return <svg ref={ref} className="dt-attack-line" aria-hidden="true"><defs><marker id={marker} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M 0 0 L 9 4.5 L 0 9 Z" fill="#ff5a59"/></marker></defs>{line&&<><path className="dt-attack-shadow" d={attackPath(line.from,line.to)}/><path className="dt-attack-stroke" d={attackPath(line.from,line.to)} markerEnd={`url(#${marker})`}/><circle cx={line.from.x} cy={line.from.y} r="5" fill="#ff6664"/></>}</svg>;
}
