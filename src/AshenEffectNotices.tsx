import {useEffect,useRef,useState} from 'react';
/** Event-driven notices persist long enough to read without pausing rules or moving the board. */
export default function AshenEffectNotices({events}:{events:string[]}){
 const previous=useRef<number|undefined>(undefined),[messages,setMessages]=useState<string[]>([]);
 useEffect(()=>{const index=previous.current;previous.current=events.length;if(index===undefined||events.length<index)return;const fresh=events.slice(index).filter(e=>e.startsWith('Triggered:')||e.startsWith('Damage:'));if(fresh.length)setMessages(fresh.slice(-6));},[events]);
 useEffect(()=>{if(!messages.length)return;const timer=window.setTimeout(()=>setMessages([]),10000);return()=>window.clearTimeout(timer);},[messages]);
 if(!messages.length)return null;
 const counts=new Map<string,number>();for(const message of messages)counts.set(message,(counts.get(message)||0)+1);
 return <section className="ab-effect-notices" role="status" aria-live="polite" aria-label="Effect and damage notices"><header><strong>Card effects</strong><button aria-label="Dismiss effect notices" onClick={()=>setMessages([])}>✕</button></header>{[...counts].map(([message,count])=><p key={message}>{message}{count>1&&<b> ×{count}</b>}</p>)}</section>;
}
