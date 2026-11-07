import {useId,useLayoutEffect,useState,type RefObject} from 'react';
import type {Battlefield} from '../../../ashenBattlefieldState';
import type {BlockDrag} from './useBlockDrag';
import {combatLinks,type CombatLink} from './combatView';

type Line=CombatLink&{x1:number;y1:number;x2:number;y2:number};
/** Geometry only: paths follow public battlefield cards and update as lanes scroll. */
export default function AshenCombatConnections({state,selected,board,seat,playmat,drag}:{state:Battlefield;selected:string[];board:RefObject<HTMLDivElement|null>;seat:0|1;playmat?:boolean;drag?:BlockDrag|null}){
 const uid=useId().replace(/:/g,''),[lines,setLines]=useState<Line[]>([]);
 const selection=selected.join('|');
 useLayoutEffect(()=>{
  const root=board.current;if(!root)return;let frame=0;
  const measure=()=>{const bounds=root.getBoundingClientRect(),cards=new Map(Array.from(root.querySelectorAll<HTMLElement>('[data-ashen-card]')).map(e=>[e.dataset.ashenCard!,e.getBoundingClientRect()]));
   setLines(combatLinks(state,selection?selection.split('|'):[]).flatMap(link=>{const a=cards.get(link.from),b=cards.get(link.to);if(!a||!b||!a.width||!b.width)return [];const direction=b.top>a.top?1:-1;
   const y1=direction===1?a.bottom:a.top,y2=direction===1?b.top:b.bottom;
   const x1=a.x+a.width/2-bounds.x;
   return [{...link,x1,y1:y1-bounds.y,x2:playmat&&link.kind==='attack'?x1:b.x+b.width/2-bounds.x,y2:(playmat&&link.kind==='attack'?y1+direction*Math.min(20,Math.abs(y2-y1)/2):y2)-bounds.y}];}));
  };
  const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);};measure();
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(update):undefined;observer?.observe(root);
  root.addEventListener('scroll',update,true);window.addEventListener('resize',update);
  return()=>{cancelAnimationFrame(frame);observer?.disconnect();root.removeEventListener('scroll',update,true);window.removeEventListener('resize',update);};
 },[state,selection,board,seat,playmat]);
 const root=board.current,bounds=drag&&root?.getBoundingClientRect();
 const source=drag&&Array.from(root?.querySelectorAll<HTMLElement>('[data-ashen-card]')||[]).find(card=>card.dataset.ashenCard===drag.from)?.getBoundingClientRect();
 if(!lines.length&&!drag)return null;
 return <svg className="ab-combat-connections" aria-hidden="true"><defs>{(['attack','block'] as const).map(kind=><marker key={kind} id={`${uid}-${kind}`} markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" refX="8" refY="4" orient="auto"><path className={`ab-link-${kind}`} d="M0 0 8 4 0 8Z"/></marker>)}</defs>{lines.map((line,i)=>{
  const middle=(line.y1+line.y2)/2;
  return <path key={`${line.from}-${line.to}-${i}`} className={`ab-combat-link ab-link-${line.kind}${line.preview?' ab-link-preview':''}`} d={`M${line.x1},${line.y1} C${line.x1},${middle} ${line.x2},${middle} ${line.x2},${line.y2}`} markerEnd={`url(#${uid}-${line.kind})`}/>;
 })}{drag&&source&&bounds&&<path className="ab-combat-link ab-link-block ab-link-preview" d={`M${source.x+source.width/2-bounds.x},${source.top-bounds.y} L${drag.x-bounds.x},${drag.y-bounds.y}`} markerEnd={`url(#${uid}-block)`}/>}</svg>;
}
