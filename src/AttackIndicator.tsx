import {useId,useLayoutEffect,useMemo,useRef,useState} from 'react';
import type {DuelState} from './engine/model';
import {attackPath,battleVisuals} from './attackPresentation';
import './attackIndicator.css';
type Point={x:number;y:number};type Line={from:Point;to:Point;completed:boolean;key:string};
/** Draw all completed attacks this Battle Phase, plus the live declaration. */
export default function AttackIndicator({state,viewer}:{state:DuelState;viewer:0|1}){
 const ref=useRef<SVGSVGElement>(null),positions=useRef(new Map<string,Point>()),[lines,setLines]=useState<Line[]>([]),marker=useId().replace(/[^a-zA-Z0-9]/g,'');
 const visuals=useMemo(()=>battleVisuals(state),[state]);
 useLayoutEffect(()=>{const board=ref.current?.closest('.dt-duel-board');if(!board)return;
  const measure=()=>{const origin=board.getBoundingClientRect();for(const node of board.querySelectorAll<HTMLElement>('.dt-field-zone[data-zone-card]')){const r=node.getBoundingClientRect();positions.current.set(node.dataset.zoneCard!,{x:r.x+r.width/2-origin.x,y:r.y+r.height/2-origin.y});}
   const zonePoint=(owner:0|1,index:number|undefined)=>{if(index===undefined)return;const r=board.querySelector(`[data-zone-owner="${owner}"][data-zone-kind="monster"][data-zone-index="${index}"]`)?.getBoundingClientRect();return r?{x:r.x+r.width/2-origin.x,y:r.y+r.height/2-origin.y}:undefined;};
   const next=visuals.flatMap(v=>{const a=v.attack;if(a.replay)return [];const from=(v.completed?zonePoint(a.attacker,v.result?.attackerZone):undefined)??positions.current.get(a.attackerId);let to=a.targetId?((v.completed?zonePoint(a.defender,v.result?.targetZone):undefined)??positions.current.get(a.targetId)):undefined;if(!a.targetId){const r=board.querySelector(`[data-player="${a.defender}"]`)?.getBoundingClientRect();if(r)to={x:r.x+r.width/2-origin.x,y:r.y+r.height/2-origin.y};}return from&&to?[{from,to,completed:v.completed,key:v.key}]:[];});setLines(old=>JSON.stringify(old)===JSON.stringify(next)?old:next);
  };measure();const frame=requestAnimationFrame(measure);board.addEventListener('load',measure,true);const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;observer?.observe(board);window.addEventListener('resize',measure);window.addEventListener('scroll',measure,true);window.visualViewport?.addEventListener('resize',measure);
  return()=>{cancelAnimationFrame(frame);board.removeEventListener('load',measure,true);observer?.disconnect();window.removeEventListener('resize',measure);window.removeEventListener('scroll',measure,true);window.visualViewport?.removeEventListener('resize',measure);};
 },[state,visuals,viewer]);
 return <svg ref={ref} className="dt-attack-line" data-attack-stage={visuals.some(v=>!v.completed)?'active':'last'} data-attack-count={visuals.length} aria-hidden="true"><defs><marker id={marker} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M 0 0 L 9 4.5 L 0 9 Z" fill="#ff5a59"/></marker></defs>{lines.map(l=><g key={l.key} className={l.completed?'dt-last-attack-line':'dt-current-attack-line'}><path className="dt-attack-shadow" d={attackPath(l.from,l.to)}/><path className="dt-attack-stroke" d={attackPath(l.from,l.to)} markerEnd={`url(#${marker})`}/><circle cx={l.from.x} cy={l.from.y} r="5" fill="#ff6664"/></g>)}</svg>;
}
