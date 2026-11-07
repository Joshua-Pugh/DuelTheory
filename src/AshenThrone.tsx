import {useState} from 'react';
import catalog from './ashenCatalog.json';
import AshenCardFrame from './AshenCardFrame';
import {ashenStarterCards as cards} from './ashenDecks';

export default function AshenThrone({onPlay,initialSection='cards'}:{onPlay?:()=>void;initialSection?:'cards'|'decks'}={}){
 const [section,setSection]=useState(initialSection);
 const [faction,setFaction]=useState<'All'|'Brute'|'Noble'>('All');
 const [query,setQuery]=useState('');
 const [selectedId,setSelectedId]=useState(cards[0].id);
 const [cardType,setCardType]=useState('All');
 const selected=cards.find(card=>card.id===selectedId)??cards[0];
 const filtered=cards.filter(card=>(faction==='All'||card.faction===faction)&&(cardType==='All'||card.type===cardType)&&card.name.toLowerCase().includes(query.trim().toLowerCase())).sort((a,b)=>a.name.localeCompare(b.name));
 const availableTypes=['All',...new Set(cards.map(card=>card.type))];
 return <div className="ashen-page">
 <header className="ashen-hero"><div><span className="dt-kicker">ASHEN THRONE · COMMAND SIEGE</span><h1>{section==='cards'?'Card Library':'Starter Decks'}</h1><p>Meet the Brutes of the Broken Fist and the Nobles of the Crown.</p>{onPlay&&<button className="primary" onClick={onPlay}>Play Ashen Throne</button>}</div></header>
 <nav className="ashen-section-nav" aria-label="Ashen Throne guide"><a className="secondary" href="#/rules">Rules</a><button aria-pressed={section==='cards'} onClick={()=>setSection('cards')}>Cards</button><button aria-pressed={section==='decks'} onClick={()=>setSection('decks')}>Starter decks</button></nav>
 {section==='cards'&&<div className="ashen-catalog">
  <aside className="ashen-inspector"><h2>{selected.name}</h2><AshenCardFrame card={selected} publishedArtOnly/></aside>
  <div className="ashen-card-browser"><div className="ashen-card-controls"><input aria-label="Search Ashen Throne cards" placeholder="Search cards by name..." value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Filter faction" value={faction} onChange={e=>setFaction(e.target.value as 'All'|'Brute'|'Noble')}><option>All</option><option>Brute</option><option>Noble</option></select><select aria-label="Filter type" value={cardType} onChange={e=>setCardType(e.target.value)}>{availableTypes.map(t=><option key={t}>{t}</option>)}</select></div><p className="ashen-count">{filtered.length} cards · select one to read it</p><div className="ashen-card-gallery">{filtered.map(c=><button key={c.id} className={'ashen-gallery-card '+c.faction.toLowerCase()+(selected.id===c.id?' selected':'')} onClick={()=>setSelectedId(c.id)} title={c.name}><AshenCardFrame card={c} size="mini" publishedArtOnly/><strong>{c.name}</strong><small>{c.type} · {c.rarity}</small></button>)}</div></div>
 </div>}
 {section==='decks'&&<div className="ashen-deck-gallery">{Object.entries(catalog.decks).map(([side,deck])=><section className={'ashen-deck-sheet '+side.toLowerCase()} key={side}><span>{side.toUpperCase()} · COMMAND SIEGE</span><h2>{deck.name}</h2><p>The current 60-card starter deck. Select a card below to read it. Your Command Station is separate from the draw deck.</p><p><strong>{deck.entries.reduce((n,e)=>n+e.count,0)}</strong> cards · {deck.entries.length} different cards</p><div>{deck.entries.map(entry=>{const card=cards.find(c=>c.id===entry.cardId);return <button key={entry.cardId} onClick={()=>{setSelectedId(entry.cardId);setSection('cards')}}><b>{entry.count}×</b><span>{card?.name||entry.cardId}</span></button>})}</div></section>)}</div>}
 </div>;
}
