import {useEffect,useRef,useState,type ReactNode} from 'react';
import type {DuelState} from './engine/model';
import {openingCoin,duelResult} from './duelLifecycle';

function LifecycleDialog({title,children}:{title:string;children:ReactNode}){
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;ref.current?.querySelector<HTMLElement>('button:not(:disabled)')?.focus();return()=>previous?.focus();},[]);
 return <div className="dt-lifecycle-backdrop"><div ref={ref} className="dt-lifecycle-dialog" role="dialog" aria-modal="true" aria-label={title} onKeyDown={e=>{
  if(e.key!=='Tab')return;
  const items=Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled)')??[]),first=items[0],last=items[items.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
 }}>{children}</div></div>;
}
export function OpeningCoinDialog({seed,onBegin,onExit}:{seed:number;onBegin:()=>void;onExit:()=>void}){
 const {face,firstSeat}=openingCoin(seed),[revealed,setRevealed]=useState(false);
 useEffect(()=>{const timer=window.setTimeout(()=>setRevealed(true),window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:1200);return()=>window.clearTimeout(timer);},[]);
 return <LifecycleDialog title="Opening coin toss"><small>DUELTHEORY · FIRST TURN</small><h2>Let the coin decide</h2><p className="dt-toss-assignments">Heads · Player 1 <span> / </span> Tails · Player 2</p><div className="dt-coin-stage" aria-hidden="true"><div className={`dt-opening-coin ${face.toLowerCase()}${revealed?' revealed':' tossing'}`}><div className="dt-coin-face dt-coin-heads"><img src="/branding/dt-coin-crest.svg" alt=""/><span>Heads</span></div><div className="dt-coin-face dt-coin-tails"><svg viewBox="0 0 100 100" focusable="false"><path className="dt-coin-shield" d="M50 10 78 22v28c0 18-15 31-28 39C37 81 22 68 22 50V22Z"/><g className="dt-coin-swords"><path d="m25 15 8 3 39 48-6 6-39-48Z M20 65l15 12 M23 78l10-12 M75 15l-8 3-39 48 6 6 39-48Z M80 65 65 77 M77 78 67 66"/></g><path className="dt-coin-spark" d="m50 32 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z"/></svg><span>Tails</span></div></div></div><div className="dt-toss-result" role="status" aria-live="polite">{revealed?<><strong>{face}</strong><p>Player {firstSeat+1} goes first.</p></>:<p>Flipping the coin…</p>}</div><div className="dt-lifecycle-actions"><button className="dt-modal-primary" disabled={!revealed} onClick={onBegin}>Begin duel</button><button onClick={onExit}>Exit duel</button></div></LifecycleDialog>;
}
export function DuelEndedDialog({state,onAgain,onExit}:{state:DuelState;onAgain:()=>void;onExit:()=>void}){
 const result=duelResult(state);if(!result)return null;
 return <LifecycleDialog title="Duel complete"><small>DUELTHEORY · DUEL COMPLETE</small><img className="dt-result-crest" src="/branding/dt-forge-crest.svg" alt=""/><h2>{result.title}</h2><p>{result.reason}</p><div className="dt-lifecycle-actions"><button className="dt-modal-primary" onClick={onAgain}>Play again</button><button onClick={onExit}>Exit duel</button></div></LifecycleDialog>;
}
