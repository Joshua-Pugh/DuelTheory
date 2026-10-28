import {useMemo,useState} from 'react';
import AshenBattlefield from './AshenBattlefield';
import {createPractice,practiceComplete,practiceLessons} from './ashenPracticeScenarios';
import type {Battlefield} from './ashenBattlefieldState';
export default function AshenPractice({mobile=false,onExit}:{mobile?:boolean;onExit:()=>void}){
 const [index,setIndex]=useState(0),[attempt,setAttempt]=useState(0),[observed,setObserved]=useState<Battlefield|null>(null);
 const initial=useMemo(()=>createPractice(index),[index,attempt]),lesson=practiceLessons[index];
 const complete=observed!==null&&practiceComplete(index,observed);
 const reset=()=>{setObserved(null);setAttempt(n=>n+1);};
 const panel=<><div><strong>Practice {index+1}/{practiceLessons.length} · {lesson.title}</strong><p className="ab-practice-setup">{lesson.setup}</p><p><b>Goal:</b> {lesson.goal}</p><details><summary>Steps and why this works</summary><p>{lesson.steps}</p><p>{lesson.reason}</p></details></div><div><label>Situation <select value={index} onChange={e=>{setIndex(Number(e.target.value));setObserved(null);}}>{practiceLessons.map((l,i)=><option key={l.id} value={i}>{i+1}. {l.title}</option>)}</select></label><span role="status">{complete?'Goal reached. Check the result on the board.':'Play the cards below to reach the goal.'}</span><button onClick={reset}>Reset situation</button><button disabled={!complete||index===practiceLessons.length-1} onClick={()=>{setObserved(null);setIndex(i=>i+1);}}>Next situation</button></div></>;
 return <AshenBattlefield key={`${index}-${attempt}`} initialState={initial} mobile={mobile} learning={false} practice={{panel,onChange:setObserved}} onAgain={reset} onExit={onExit}/>;
}

