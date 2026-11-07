import {useMemo,useState} from 'react';
import AshenBattlefield from './AshenBattlefield';
import AshenFirstCommand from './AshenFirstCommand';
import {createPractice,practiceComplete,practiceLessons} from './ashenPracticeScenarios';
import {moveAshenCard} from './games/ashen/adapter';
import type {Battlefield} from './ashenBattlefieldState';
export default function AshenPractice({mobile=false,onExit}:{mobile?:boolean;onExit:()=>void}){
 const [showIntro,setShowIntro]=useState(()=>{try{return localStorage.getItem('ashen-first-command-anatomy')!=='complete';}catch{return true;}});
 const [fontsLesson,setFontsLesson]=useState(true);
 const [index,setIndex]=useState(0),[attempt,setAttempt]=useState(0),[observed,setObserved]=useState<Battlefield|null>(null);
 const initial=useMemo(()=>{
  const state=createPractice(index);
  if(fontsLesson){
   const grunt=state.table.piles['0:hand'].find(id=>state.table.cards[id].cardId==='ashen-brute-frenzied-grunt');
   if(grunt)moveAshenCard(state,grunt,'deck');
  }
  return state;
 },[index,attempt,fontsLesson]),lesson=practiceLessons[index];
 const complete=observed!==null&&practiceComplete(index,observed);
 const deploymentCards=Object.values((observed??initial).table.cards);
 const font=deploymentCards.find(card=>card.controller===0&&card.cardId==='ashen-brute-fury-font'&&(card.zone==='hand'||card.zone==='ley'));
 const gainedEssence=!!font?.faceDown&&(observed?.basins[0].fury??0)>0;
 const state=observed??initial;
 const duel=state.rules?.duel;
 const own=(slug:string,zone:string)=>Object.values(state.table.cards).find(card=>card.controller===0&&card.zone===zone&&card.cardId.endsWith('-'+slug));
 const grunt=own('frenzied-grunt','unit');
 const combatStage=duel?.combat?.stage;
 const prompt=complete?{text:'Goal reached. Check the result on the board.'}
  :state.rules?.pending?{text:index===2?'Follow the effect prompt. For damage, choose the enemy Command Station.':index===1?'Follow the effect prompt. For Refine, choose one card to put on the bottom.':index===3?'Choose Shieldbearer Noble for Fortify.':'Make the choice shown to continue the attack.'}
  :duel?.priority?{text:'Use the highlighted response controls to continue.',phase:true}
  :index===0?(combatStage==='block'?{text:'Play the defender, then resolve combat with no blockers.',phase:true}
   :combatStage==='attack'?{text:'Select Frenzied Grunt, then attack with the selected Unit.',card:grunt?.instanceId,phase:true}
   :grunt?{text:'Charge lets the Grunt attack right away. Enter Skirmish.',phase:true}
   :font?.zone==='hand'?{text:'Select Fury Font in your hand and play it.',card:font.instanceId}
   :font&&!font.faceDown?{text:'Burn Fury Font to gain one Fury Essence.',card:font.instanceId}
   :{text:'Select Frenzied Grunt and play it for one Fury.',card:own('frenzied-grunt','hand')?.instanceId})
  :index===1?{text:'Play Shieldbearer Noble to Refine.',card:own('shieldbearer-noble','hand')?.instanceId}
  :index===2?{text:'Select Rune of Clarity. Exhaust it and spend one Oath to Refine.',card:own('rune-of-clarity','support')?.instanceId}
  :{text:'Play Court Strategist for two Oath. Your earlier Plan and Refine cover the generic cost.',card:own('court-strategist','hand')?.instanceId};
 const reset=()=>{setObserved(null);setAttempt(n=>n+1);};
 if(showIntro)return <>
  <AshenBattlefield initialState={initial} mobile={mobile} playmat={!mobile} learning={false} practice={{panel:null,onChange:setObserved}} onAgain={reset} onExit={onExit}/>
  <AshenFirstCommand onExit={onExit} onSkip={()=>{reset();setFontsLesson(false);setShowIntro(false);}} onComplete={()=>{
  try{localStorage.setItem('ashen-first-command-anatomy','complete');}catch{/* The lesson can continue without saved progress. */}
  setShowIntro(false);
 }}/></>;
 if(fontsLesson){
  const panel=<><div><strong>The First Command · Lesson 2 · Ley Fonts and Burning</strong>
   <p role="status">{gainedEssence?'You gained one Fury Essence. It’s ready to spend this turn.':font?.zone==='ley'?'Burn the highlighted Fury Font to add one Fury Essence to your Ley Basin.':'Select Fury Font in your hand and play it.'}</p>
  </div><div><button onClick={reset}>Restart lesson</button><button className="afc-button afc-primary" disabled={!gainedEssence} onClick={()=>{reset();setFontsLesson(false);}}>Continue to practice</button></div></>;
  return <AshenBattlefield key={`fonts-${attempt}`} initialState={initial} mobile={mobile} playmat={!mobile} learning={false} practice={{panel,highlightCard:gainedEssence?undefined:font?.instanceId,onChange:setObserved}} onAgain={reset} onExit={onExit}/>;
 }
 const panel=<><div><strong>{lesson.title}</strong><p role="status">{prompt.text}</p><details><summary>Steps and why this works</summary><p>{lesson.setup}</p><p>{lesson.goal}</p><p>{lesson.reason}</p></details></div><details className="ab-practice-options"><summary>Lesson options</summary><label>Situation <select value={index} onChange={e=>{setIndex(Number(e.target.value));setObserved(null);}}>{practiceLessons.map((l,i)=><option key={l.id} value={i}>{i+1}. {l.title}</option>)}</select></label><button onClick={()=>{setIndex(0);reset();setFontsLesson(true);setShowIntro(true);}}>Review card basics</button><button onClick={reset}>Reset situation</button></details>{complete&&index<practiceLessons.length-1&&<button className="afc-button afc-primary" onClick={()=>{setObserved(null);setIndex(i=>i+1);}}>Next situation</button>}</>;
 return <AshenBattlefield key={`${index}-${attempt}`} initialState={initial} mobile={mobile} playmat={!mobile} learning={false} practice={{panel,highlightCard:prompt.card,highlightPhase:prompt.phase,hint:prompt.text,onChange:setObserved}} onAgain={reset} onExit={onExit}/>;
}

