import {useState} from 'react';
import AshenCardFrame from '../../AshenCardFrame';
import {ashenStarterCards} from '../../ashenDecks';
import {ASHEN_KEYWORDS} from './reference';
import './ashenRulesPage.css';

const chapters=[
 {id:'setup',title:'Set up the duel',paragraphs:[
  'Each player chooses a 60-card starter deck and sets its matching Command Station apart from the deck at 20 HP. Shuffle and draw six cards each. Randomly decide who goes first. That player skips their first draw.',
  'The first player decides whether to keep or redraw, then the other player does the same. To redraw, shuffle your whole hand back into your deck. Your first redraw is free and gives you six cards. Each later redraw gives you one fewer card, down to one. Once both players keep, begin play.',
  'Reduce the opposing Station to 0 HP to win. If both Stations reach 0 together, the duel is a draw. If both decks empty, the player with more Station HP wins. Equal HP is a draw.'
 ]},
 {id:'field',title:'The battlefield and the Ley',paragraphs:[
  'Units fight from the Frontline. Ley Fonts have their own row, and Runes and Relics stay in play in the support area. Your Command Station has its own space. Discarded and destroyed cards go to the Ossuary. Banished cards go to a separate pile.',
  'You may play one Ley Font during either of your Main Phases. It enters Ready unless its card says it enters Spent. Burn a Ready Font by turning it face down and adding its printed Essence to your Ley Basin. You can Burn Ready Fonts when you have an opportunity to respond.',
  'Oath and Fury are the currents of the Noble and Brute starters. Colored costs require matching Essence. Any Essence can pay a generic cost, including Untuned Essence. Both players lose unspent Essence at the end of each turn.'
 ]},
 {id:'turn',title:'Take a turn',steps:[
  ['Start','Resolve Start Phase effects, ready your cards and draw one card. The player who goes first skips their first draw.'],
  ['Main I','Play cards and use abilities. You can play your one Ley Font now or save that play for Main II.'],
  ['Skirmish','Declare attackers. Your opponent assigns blockers, then combat damage is dealt.'],
  ['Main II','Play more cards and use abilities after the fight.'],
  ['End','Resolve end-of-turn effects, remove damage from surviving Units and clear effects that last this turn. If you have more than seven cards in hand, discard down to seven.']
 ]},
 {id:'readiness',title:'Unready and Fatigued Units',paragraphs:[
  'Every Unit enters the Frontline Unready. It cannot attack, block or Exhaust. Charge allows an Unready Unit to attack. Standfast allows an Unready Unit to block.',
  'Attacking makes a Unit Fatigued unless it has Standfast. Paying an Exhaust cost still makes a Standfast Unit Fatigued. A Fatigued Unit cannot attack, block or Exhaust, even if it has Charge or Standfast.',
  'Both states clear in the Unit’s controller’s next Start Phase. A Unit can have both states at once. Removing Fatigue alone leaves any deployment restriction in place.'
 ],examples:['ashen-brute-frenzied-grunt','ashen-noble-crown-archer']},
 {id:'combat',title:'Fight a Skirmish',paragraphs:[
  'Choose which eligible Units attack. A Unit with Reckless must attack if able. Resolve attack triggers before the defender assigns blockers.',
  'A Unit can block only one attacker. Several Units can block the same attacker. Soar attackers require a Soar or Ranged blocker. Ranged attackers require a Ranged blocker. Units with Siege cannot block either, and a Unit with Evade cannot be blocked.',
  'An unblocked attacker deals its Attack to the enemy Station. A blocked attacker assigns damage to its blockers in order, up to each blocker’s remaining Defense. Blockers strike back. Duelist’s Edge strikes in an earlier damage wave, so a Unit destroyed in that wave cannot strike later.',
  'An attacker stays blocked even if its blockers leave combat. Pierce carries excess damage through to the Station. Siege doubles combat damage dealt to a Station.'
 ]},
 {id:'clash',title:'Respond in the Clash',paragraphs:[
  'When a play, ability or trigger enters the Clash, players may respond with a legal Tactic or ability. Pay costs and choose required targets when you announce a play. Outfit is used during your Main Phase.',
  'After both players pass, resolve the newest entry first. In DuelTheory, a player with no legal response passes automatically. Nullify removes the chosen entry before it resolves. Spent Essence and other paid costs stay spent.'
 ]}
] as const;

const definitions:Record<string,string>={
 Command:'Each time you Plan or Refine this turn reduces this card’s generic cost by one, down to zero. Colored costs stay the same.',
 'Exhaust / Fatigue':'To Exhaust a Ready card, mark it Fatigued as the cost of its ability. Fatigued Units cannot attack, block or Exhaust. Clear Fatigue during the controller’s next Start Phase.',
 Outfit:'During your Main Phase, pay the listed cost to attach the Relic to a legal friendly Unit. It grants its printed bonuses or abilities while attached.',
 Reckless:'This Unit must attack if able.',
 Sacrifice:'Move a card you control to its owner’s Ossuary as the cost or effect directs.',
 Siege:'This Unit deals double combat damage to Command Stations. It cannot block Soar or Ranged attackers.',
 'Tokens and named counters':'Tokens have the type, faction, stats and keywords named by the effect that creates them. Fury, Momentum and Dominion counters follow the instructions on their cards. Counters are separate from Essence.'
};

export default function AshenRulesPage(){
 const [section,setSection]=useState(chapters[0].id as string);
 const jump=(id:string)=>{setSection(id);document.getElementById(id)?.scrollIntoView({block:'start'});document.getElementById(id)?.focus({preventScroll:true});};
 return <article className="ashen-rules-page">
  <header className="ashen-rule-banner">
   <p className="dt-kicker">ASHEN THRONE · COMMAND SIEGE</p>
   <h1>How to Play</h1>
   <p>Raise your Frontline, burn Ley Fonts for Essence and bring down your rival’s Command Station. Command Siege is the two-player format played with the Brute and Noble starter decks.</p>
   <nav aria-label="Explore Ashen Throne"><a href="#/play">Play Ashen Throne</a><a href="#/decks">Starter decks</a><a href="#/cards">Card library</a></nav>
  </header>
  <div className="ashen-rule-layout">
   <nav className="ashen-rule-index" aria-label="On this page"><strong>On this page</strong>{[...chapters,{id:'keywords',title:'Keyword reference'}].map(chapter=><button key={chapter.id} aria-current={section===chapter.id?'location':undefined} onClick={()=>jump(chapter.id)}>{chapter.title}</button>)}</nav>
   <div className="ashen-rule-chapters">
    {chapters.map((chapter,index)=><section key={chapter.id} id={chapter.id} tabIndex={-1}>
     <p className="ashen-rule-number">0{index+1}</p><h2>{chapter.title}</h2>
     {'paragraphs' in chapter&&chapter.paragraphs.map(paragraph=><p key={paragraph}>{paragraph}</p>)}
     {'steps' in chapter&&<ol>{chapter.steps.map(([name,description])=><li key={name}><strong>{name}</strong><p>{description}</p></li>)}</ol>}
     {'examples' in chapter&&<div className="ashen-rule-examples">{chapter.examples.map(id=>{const card=ashenStarterCards.find(card=>card.id===id);return card&&<figure key={id}><AshenCardFrame card={card} publishedArtOnly/><figcaption>{card.name}</figcaption></figure>;})}</div>}
    </section>)}
    <section id="keywords" tabIndex={-1}><p className="ashen-rule-number">07</p><h2>Keyword reference</h2><dl>{ASHEN_KEYWORDS.map(([term,definition])=><div key={term}><dt>{term}</dt><dd>{definitions[term]??definition}</dd></div>)}</dl></section>
   </div>
  </div>
 </article>;
}
