import {useEffect,useRef,useState} from 'react';
import {ASHEN_RULES,ASHEN_KEYWORDS} from './games/ashen/reference';
import {ashenCardMap} from './ashenDecks';

export default function AshenReference({kind,onClose}:{kind:'rules'|'keywords';onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),[query,setQuery]=useState(''),[tab,setTab]=useState(kind);
 useEffect(()=>{const element=dialog.current;element?.showModal();return()=>element?.close();},[]);
 const matches=(...text:string[])=>text.join(' ').toLowerCase().includes(query.trim().toLowerCase());
 return <dialog ref={dialog} className="ab-reference" aria-label="Ashen Throne prototype reference" onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><header><div><small>ASHEN THRONE · BRUTES & NOBLES</small><h2>{tab==='rules'?'Complete prototype rules':'Keyword reference'}</h2></div><button autoFocus onClick={onClose}>Close reference ✕</button></header><nav aria-label="Reference sections"><button aria-pressed={tab==='rules'} onClick={()=>setTab('rules')}>Rules</button><button aria-pressed={tab==='keywords'} onClick={()=>setTab('keywords')}>Keywords</button><input aria-label="Search reference" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a rule, keyword, or card…"/></nav><div className="ab-reference-body">
 {tab==='rules'?<><p>This guide covers the current two-seat Command Siege prototype and both supported decks. Opening it does not advance the duel.</p>{ASHEN_RULES.filter(rule=>matches(rule.title,rule.text)).map(rule=><section key={rule.title}><h3>{rule.title}</h3><p>{rule.text}</p></section>)}<h3>Brute & Noble card text</h3><p>Printed card text from the current prototype catalog. Search by name or effect; the deck rulings above record creator clarifications.</p>{[...ashenCardMap.values()].filter(card=>matches(card.name,card.effectText,card.faction)).map(card=><details key={card.id}><summary>{card.name} · {card.faction} · {card.type}</summary><p className="ab-reference-card-text">{card.effectText||'No additional effect text.'}</p></details>)}</>:<>{ASHEN_KEYWORDS.filter(([name,text])=>matches(name,text)).map(([name,text])=><section key={name}><h3>{name}</h3><p>{text}</p></section>)}</>}
 {query&&!(tab==='rules'?ASHEN_RULES.some(r=>matches(r.title,r.text))||[...ashenCardMap.values()].some(c=>matches(c.name,c.effectText,c.faction)):ASHEN_KEYWORDS.some(([name,text])=>matches(name,text)))&&<p>No matching entries.</p>}
 </div></dialog>;
}
