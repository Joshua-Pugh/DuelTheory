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
 const reset=()=>{setObserved(null);setAttempt(n=>n+1);};
 if(showIntro)return <>
  <AshenBattlefield initialState={initial} mobile={mobile} playmat={!mobile} learning={false} practice={{panel:null,onChange:setObserved}} onAgain={reset} onExit={onExit}/>
  <AshenFirstCommand onExit={onExit} onSkip={()=>{reset();setFontsLesson(false);setShowIntro(false);}} onComplete={()=>{
  try{localStorage.setItem('ashen-first-command-anatomy','complete');}catch{/* The lesson can continue without saved progress. */}
  setShowIntro(false);
 }}/></>;
 if(fontsLesson){
  const panel=<><div><strong>The First Command · Lesson 2 · Ley Fonts and Burning</strong>
   <p role="status">{gainedEssence?'You gained one Fury Essence. It’s ready to spend this turn.':font?.zone==='ley'?'Select your Fury Font on the battlefield to burn it.':'Select Fury Font in your hand and play it.'}</p>
  </div><div><button onClick={reset}>Restart lesson</button><button onClick={()=>{reset();setFontsLesson(false);}}>Open practice</button><button disabled={!gainedEssence} onClick={onExit}>Finish lesson</button></div></>;
  return <AshenBattlefield key={`fonts-${attempt}`} initialState={initial} mobile={mobile} playmat={!mobile} learning={false} practice={{panel,onChange:setObserved}} onAgain={reset} onExit={onExit}/>;
 }
 const panel=<><div><strong>{lesson.title}</strong><p className="ab-practice-setup">{lesson.setup}</p><details><summary>Steps and why this works</summary><p>{lesson.steps}</p><p>{lesson.reason}</p></details></div><div><label>Situation <select value={index} onChange={e=>{setIndex(Number(e.target.value));setObserved(null);}}>{practiceLessons.map((l,i)=><option key={l.id} value={i}>{i+1}. {l.title}</option>)}</select></label><span role="status">{complete?'Goal reached. Check the result on the board.':lesson.goal}</span><button onClick={()=>{setIndex(0);reset();setFontsLesson(true);setShowIntro(true);}}>Review card basics</button><button onClick={reset}>Reset situation</button><button disabled={!complete||index===practiceLessons.length-1} onClick={()=>{setObserved(null);setIndex(i=>i+1);}}>Next situation</button></div></>;
 return <AshenBattlefield key={`${index}-${attempt}`} initialState={initial} mobile={mobile} playmat={!mobile} learning={false} practice={{panel,onChange:setObserved}} onAgain={reset} onExit={onExit}/>;
}

