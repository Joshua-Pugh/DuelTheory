import {useState} from 'react';
import {BookOpen,ChevronLeft,ChevronRight,Swords,Users} from 'lucide-react';
import type {AshenFaction} from '../../../ashenDecks';
import './ashenStartScreen.css';

type Props={
  decks:[AshenFaction,AshenFaction];
  onDeck:(seat:0|1,faction:AshenFaction)=>void;
  learning:boolean;
  onLearning:(value:boolean)=>void;
  onStart:()=>void;
  onPractice:()=>void;
  onSkirmish?:()=>void;
  onResume?:()=>void;
  legacySave?:boolean;
};
const factions={
  Brute:{name:'Broken Fist',title:'Brutes',essence:'Fury',icon:'fury',art:'ashen-brute-skarn-the-unchained',description:'Build an attacking Frontline and keep the pressure on.'},
  Noble:{name:'Crown’s Might',title:'Nobles',essence:'Oath',icon:'oath',art:'ashen-noble-oath-sanctum',description:'Plan your turns. Refine your hand. Fortify your forces.'},
} as const;

/** A launch surface only. Every mode continues into the existing rules engine. */
export default function AshenStartScreen({decks,onDeck,learning,onLearning,onStart,onPractice,onSkirmish,onResume,legacySave}:Props){
  const [mode,setMode]=useState<'home'|'local'>('home');
  const installed=typeof window!=='undefined'&&window.matchMedia('(display-mode: standalone)').matches;
  return <section className="at-start" data-mode={mode} aria-label="Ashen Throne start screen">
    <div className="at-start-scenery" aria-hidden="true"/>
    <div className="at-start-content">
      <header className="at-start-heading"><p>ASHEN FORGE GAMES · COMMAND SIEGE</p><h1>Ashen Throne</h1><span>Wield the Ley. Break the throne.</span></header>
      {mode==='home'?<>
        <div className="at-start-modes" aria-label="Choose how to play">
          <button className="at-start-mode at-start-featured" onClick={onPractice}><BookOpen/><span><small>START HERE</small><strong>Learn to play</strong><span>Play prepared hands and real battlefield situations. No opponent needed.</span></span><ChevronRight/></button>
          <button className="at-start-mode" onClick={()=>setMode('local')}><Swords/><span><small>ON THIS DEVICE</small><strong>Local duel</strong><span>Choose two starter decks. Play both sides or share the screen.</span></span><ChevronRight/></button>
          <a className="at-start-mode" href="#/private/ashen"><Users/><span><small>ON TWO DEVICES</small><strong>Play a friend</strong><span>Create a room or join by code. Each player sees their own hand.</span></span><ChevronRight/></a>
        </div>
        {onSkirmish&&<button className="at-start-resume" onClick={onSkirmish}>Try the new battlefield · Skirmish <ChevronRight size={18}/></button>}
        {onResume&&<button className="at-start-resume" onClick={onResume}>Resume local duel <ChevronRight size={18}/></button>}
        {onResume&&legacySave&&<p className="at-start-note">Your saved duel uses an older deck list. Start a new local duel to test the updated starters.</p>}
        {!installed&&<details className="at-install-help"><summary>More room to play on your phone</summary><p>Turn your phone sideways for a wider battlefield.</p><p>On iPhone, open Safari’s Share menu, choose <strong>Add to Home Screen</strong>, and turn on <strong>Open as Web App</strong> if shown. Launch DuelTheory from that icon to play without Safari’s tabs and address bar.</p><p>On Android, use <strong>Enter fullscreen</strong> in the duel’s settings when available.</p></details>}<p className="at-start-note">Two playable starter decks · Brutes & Nobles<br/>Working prototype. Computer opponents are still in development.</p>
      </>:<section className="at-start-setup" aria-labelledby="at-deck-title">
        <div className="at-start-setup-heading"><button onClick={()=>setMode('home')}><ChevronLeft size={16}/> Back</button><h2 id="at-deck-title">Choose your sides</h2><span>Local duel · one device</span></div>
        <div className="at-starter-seats">{([0,1] as const).map(seat=>{
          const faction=factions[decks[seat]];
          return <section className="at-starter-seat" key={seat} aria-label={`Player ${seat+1} deck`}>
            <div className="at-starter-art"><img src={`/ashen/artwork/${faction.art}.webp`} alt={decks[seat]==='Brute'?'Skarn the Unchained':'Oath Sanctum'}/><span>PLAYER {seat+1}</span></div>
            <div className="at-starter-description"><p><img src={`/ashen/costs/${faction.icon}.png`} alt=""/>{faction.essence} · {faction.title}</p><h3>{faction.name}</h3><p>{faction.description}</p><div className="at-starter-choices" role="group" aria-label={`Player ${seat+1} faction`}>{(['Brute','Noble'] as const).map(value=><button key={value} aria-pressed={decks[seat]===value} onClick={()=>onDeck(seat,value)}>{factions[value].title}</button>)}</div></div>
          </section>;
        })}</div>
        <footer className="at-start-launch"><label><input type="checkbox" checked={learning} onChange={event=>onLearning(event.target.checked)}/><span>Show play guidance<small>Explain the current phase while you play.</small></span></label><button className="at-start-begin" onClick={onStart}><Swords size={20}/> Flip for first</button><p>The coin decides who starts. Both players may redraw their opening hands.</p></footer>
      </section>}
    </div>
  </section>;
}
