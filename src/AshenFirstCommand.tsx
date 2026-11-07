import {useEffect,useRef,useState} from 'react';
import {ArrowRight,BookOpen,ChevronLeft} from 'lucide-react';
import AshenCardFrame from './AshenCardFrame';
import AshenReference from './AshenReference';
import {ashenStarterCards} from './ashenDecks';
import './ashenFirstCommand.css';

const unit = ashenStarterCards.find(card => card.id === 'ashen-noble-shieldbearer-noble')!;
const regions = [
 {id:'name', label:'Name', explanation:'The name identifies the card. This is Shieldbearer Noble.'},
 {id:'cost', label:'Essence cost', explanation:'The symbols beside the name tell you what Essence to spend to play this card.'},
 {id:'type', label:'Card type', explanation:'The line below the artwork tells you this is a Unit. Units deploy to your Frontline.'},
 {id:'stats', label:'Attack and Defense', explanation:'Attack is how much damage the Unit deals in combat. Defense is how much damage it takes to destroy it.'},
 {id:'ability', label:'Ability text', explanation:'Keywords appear in bold at the top of the card’s text box. This card has Standfast. You’ll see how it works in battle later.'},
] as const;

export default function AshenFirstCommand({onComplete,onSkip,onExit}:{onComplete:()=>void;onSkip:()=>void;onExit:()=>void}) {
 const [step,setStep] = useState(0);
 const [showKeywords,setShowKeywords] = useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 const nextButton=useRef<HTMLButtonElement>(null);
 const region = regions[step];
 useEffect(()=>{
  const element=dialog.current;
  element?.showModal();
  return ()=>element?.close();
 },[]);
 const advance=()=>{
  setStep(current=>current+1);
  nextButton.current?.focus();
 };
 return (
  <dialog ref={dialog} className="afc-lesson" aria-labelledby="afc-title" onCancel={event=>{event.preventDefault();onExit();}}>
   <header><p>The First Command · Lesson 1</p><h1 id="afc-title">Card anatomy and Essence cost</h1></header>
   <div className="afc-card">
    <AshenCardFrame card={unit} publishedArtOnly/>
    {region&&<button key={region.id} type="button" className={`afc-region afc-${region.id}`} aria-label={`Read ${region.label}`} onClick={advance}/>}
   </div>
   <div>
    <p role="status">{step>0?regions[step-1].explanation:'This is the Unit you’ll read before your first battle.'}</p>
    {region&&<p>Select the highlighted {region.label.toLowerCase()} on the card or use the button below.</p>}
    <button ref={nextButton} type="button" className="afc-button afc-primary" onClick={region?advance:onComplete}>
     {region?`Read ${region.label.toLowerCase()}`:'Continue to Ley Fonts'} <ArrowRight size={18} aria-hidden="true"/>
    </button>
    <div className="afc-actions">
     <button type="button" className="afc-button" onClick={()=>setShowKeywords(true)}><BookOpen size={17} aria-hidden="true"/> Keyword Appendix</button>
     <button type="button" className="afc-button" onClick={onSkip}>Skip to practice</button>
     <button type="button" className="afc-button" onClick={onExit}><ChevronLeft size={17} aria-hidden="true"/> Back</button>
    </div>
   </div>
   {showKeywords&&<AshenReference kind="keywords" onClose={()=>setShowKeywords(false)}/>}
  </dialog>
 );
}
