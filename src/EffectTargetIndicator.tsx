import {useId,useLayoutEffect,useMemo,useRef,useState} from 'react';
import type {Card} from './core/types';import type {DuelState,Seat} from './engine/model';
import {effectTargets} from './effectTargetPresentation';import {attackPath} from './attackPresentation';
import './effectTargets.css';
type Point={x:number;y:number};type Line={key:string;number:number;from:Point;to:Point};
export default function EffectTargetIndicator({state,catalog,viewer}:{state:DuelState;catalog:ReadonlyMap<number,Card>;viewer:Seat}){
 const ref=useRef<SVGSVGElement>(null),marker=useId().replace(/[^a-zA-Z0-9]/g,'');const [lines,setLines]=useState<Line[]>([]);
 const effects=useMemo(()=>effectTargets(state,catalog,viewer),[state,catalog,viewer]);
 useLayoutEffect(()=>{const board=ref.current?.closest('.dt-duel-board');if(!board)return;
  const measure=()=>{const origin=board.getBoundingClientRect();const point=(id:string)=>{const c=state.cards[id];if(!c)return;const node=Array.from(board.querySelectorAll<HTMLElement>('[data-instance]')).find(n=>n.dataset.instance===id)??Array.from(board.querySelectorAll<HTMLElement>('.dt-field-pile')).find(n=>n.dataset.owner===String(c.owner)&&n.classList.contains(c.location));if(!node)return;const r=node.getBoundingClientRect();return {x:r.x+r.width/2-origin.x,y:r.y+r.height/2-origin.y};};
   const next=effects.flatMap(e=>e.targets.flatMap(t=>{const from=point(e.sourceId),to=point(t.id);return from&&to&&e.sourceId!==t.id?[{key:`${e.number}-${t.id}`,number:e.number,from,to}]:[];}));setLines(old=>JSON.stringify(old)===JSON.stringify(next)?old:next);
  };measure();const frame=requestAnimationFrame(measure),observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(measure);observer?.observe(board);board.addEventListener('load',measure,true);window.addEventListener('resize',measure);window.addEventListener('scroll',measure,true);window.visualViewport?.addEventListener('resize',measure);
  return()=>{cancelAnimationFrame(frame);observer?.disconnect();board.removeEventListener('load',measure,true);window.removeEventListener('resize',measure);window.removeEventListener('scroll',measure,true);window.visualViewport?.removeEventListener('resize',measure);};
 },[state,effects]);
 return <><svg ref={ref} className="dt-effect-lines" aria-hidden="true"><defs><marker id={marker} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 Z" fill="#b9a1ff"/></marker></defs>{lines.map(l=><g key={l.key}><path d={attackPath(l.from,l.to)} markerEnd={`url(#${marker})`}/><circle cx={l.to.x} cy={l.to.y} r="11"/><text x={l.to.x} y={l.to.y+4}>{l.number}</text></g>)}</svg>{effects.length>0&&<div className="dt-chain-targets" role="status" aria-label="Active effects and targets"><strong>CHAIN · highest link resolves first</strong>{[...effects].reverse().map(e=><p key={e.number}>{e.label}</p>)}</div>}</>;
}
