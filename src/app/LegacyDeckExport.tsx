import {useState} from 'react';
/** Copies only named deck data, never account, seat or developer credentials. */
export function legacyDeckData(storage:Pick<Storage,'getItem'>){
 const parse=(key:string)=>{try{return JSON.parse(storage.getItem(key)||'null');}catch{return null;}};
 return {kind:'dueltheory-legacy-decks',version:1,activeDeck:parse('ygo-sandbox-deck-v1'),decks:parse('ygo-sandbox-saved-decks-v1')};
}
export default function LegacyDeckExport(){
 const [message,setMessage]=useState('');let available=false;try{available=!!(localStorage.getItem('ygo-sandbox-deck-v1')||localStorage.getItem('ygo-sandbox-saved-decks-v1'));}catch{return null;}
 if(!available)return null;
 return <section className="panel padded"><h2>Previous simulator decks</h2><p>Your earlier deck saves are still in this browser. Download a copy to move them to the private development site.</p><button className="secondary" onClick={()=>{try{const data=legacyDeckData(localStorage),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='DuelTheory-previous-decks.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Deck copy downloaded. Your existing saves are unchanged.');}catch{setMessage('Could not export these saves. Browser storage may be unavailable.');}}}>Download previous decks</button><p role="status">{message}</p></section>;
}
