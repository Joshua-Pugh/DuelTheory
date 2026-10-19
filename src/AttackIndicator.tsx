import {useId,useLayoutEffect,useMemo,useRef,useState} from 'react';
import type {DuelState} from './engine/model';
import {attackPath,battleVisual} from './attackPresentation';
import './attackIndicator.css';
type Point={x:number;y:number};
/** Pointer-transparent, board-relative SVG; observes layout changes instead of assuming zone coordinates. */
export default function AttackIndicator({state,viewer}:{state:DuelState;viewer:0|1}){
 const ref=useRef<SVGSVGElement>(null),positions=useRef(new Map<string,Point>());
 const [line,setLine]=useState<{from:Point;to:Point}|null>(null);const marker=useId().replace(/[^a-zA-Z0-9]/g,'');
 const visual=useMemo(()=>battleVisual(state),[state]),attack=visual?.attack;
 useLayoutEffect(()=>{const board=ref.current?.closest('.dt-duel-board');if(!board)return;
  const measure=()=>{const origin=board.getBoundingClientRect(),nodes=Array.from(board.querySelectorAll<HTMLElement>('.dt-field-zone[data-zone-card]'));
   for(const node of nodes){const r=node.getBoundingClientRect();positions.current.set(node.dataset.zoneCard!,{x:r.x+r.width/2-origin.x,y:r.y+r.height/2-origin.y});}
   let next:typeof line=null;
   if(attack&&!attack.replay){const zonePoint=(owner:0|1,index:number|undefined)=>{if(index===undefined)return;const r=board.querySelector(`[data-zone-owner="${owner}"][data-zone-kind="monster"][data-zone-index="${index}"]`)?.getBoundingClientRect();return r?{x:r.x+r.width/2-origin.x,y:r.y+r.height/2-origin.y}:undefined;};
    const b=visual?.completed?state.lastBattle:undefined;
    const from=positions.current.get(attack.attackerId)??zonePoint(attack.attacker,b?.attackerZone);let to=attack.targetId?(positions.current.get(attack.targetId)??zonePoint(attack.defender,b?.targetZone)):undefined;
    if(!attack.targetId){const r=board.querySelector(`[data-player="${attack.defender}"]`)?.getBoundingClientRect();if(r)to={x:r.x+r.width/2-origin.x,y:r.y+r.height/2-origin.y};}
    if(from&&to)next={from,to};
   }
   setLine(old=>JSON.stringify(old)===JSON.stringify(next)?old:next);
  };
  measure();const frame=requestAnimationFrame(measure);board.addEventListener('load',measure,true);const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;observer?.observe(board);window.addEventListener('resize',measure);window.addEventListener('scroll',measure,true);window.visualViewport?.addEventListener('resize',measure);
  return()=>{cancelAnimationFrame(frame);board.removeEventListener('load',measure,true);observer?.disconnect();window.removeEventListener('resize',measure);window.removeEventListener('scroll',measure,true);window.visualViewport?.removeEventListener('resize',measure);};
 },[state,attack,viewer]);
 return <svg ref={ref} className={`dt-attack-line${visual?.completed?' dt-last-attack-line':''}`} data-attack-stage={visual?.completed?'last':'active'} aria-hidden="true"><defs><marker id={marker} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M 0 0 L 9 4.5 L 0 9 Z" fill="#ff5a59"/></marker></defs>{line&&<><path className="dt-attack-shadow" d={attackPath(line.from,line.to)}/><path className="dt-attack-stroke" d={attackPath(line.from,line.to)} markerEnd={`url(#${marker})`}/><circle cx={line.from.x} cy={line.from.y} r="5" fill="#ff6664"/></>}</svg>;
}
