import {useEffect,useRef} from 'react';import type {Card} from './core/types';import {useDuelViewport} from './useDuelViewport';import './publicCardReveal.css';
/** Presentation only: any game adapter can request a public reveal acknowledgement. */
export default function PublicCardReveal({cards,title,onContinue}:{cards:readonly Card[];title:string;onContinue:()=>void}){
 const root=useRef<HTMLDivElement>(null),button=useRef<HTMLButtonElement>(null);useDuelViewport(root);
 useEffect(()=>{button.current?.focus();},[]);
 return <div ref={root} className="dt-public-reveal-backdrop"><section className="dt-public-reveal" role="dialog" aria-modal="true" aria-label={title} onKeyDown={e=>{if(e.key==='Tab'){e.preventDefault();button.current?.focus();}}}><header><h2>{title}</h2><p>These cards were publicly revealed by the effect.</p></header><div className="dt-public-reveal-cards">{cards.map((card,i)=><article key={`${card.id}-${i}`}>{card.image&&<img src={card.fullImage||card.image} alt={card.name}/>}<strong>{card.name}</strong><p>{card.desc}</p></article>)}</div><footer><button ref={button} className="primary" onClick={onContinue}>Continue duel</button></footer></section></div>;
}
