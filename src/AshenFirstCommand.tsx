import {useState} from 'react';
import AshenCardFrame from './AshenCardFrame';
import {ashenStarterCards} from './ashenDecks';
import './ashenFirstCommand.css';

const unit = ashenStarterCards.find(card => card.id === 'ashen-noble-shieldbearer-noble')!;
const regions = [
 {id:'name', label:'Name', explanation:'The name identifies the card. This is Shieldbearer Noble.'},
 {id:'cost', label:'Essence cost', explanation:'The symbols beside the name tell you what Essence to spend to play this card.'},
 {id:'type', label:'Card type', explanation:'The line below the artwork tells you this is a Unit. Units deploy to your Frontline.'},
 {id:'stats', label:'Attack and Defense', explanation:'Attack is how much damage the Unit deals in combat. Defense is how much damage it takes to destroy it.'},
 {id:'ability', label:'Ability text', explanation:'The text box explains what the card can do and when those abilities apply.'},
] as const;

export default function AshenFirstCommand({onComplete,onSkip,onExit}:{onComplete:()=>void;onSkip:()=>void;onExit:()=>void}) {
 const [step,setStep] = useState(0);
 const region = regions[step];
 return (
  <section className="afc-lesson" aria-labelledby="afc-title">
   <header><p>The First Command · Lesson 1</p><h1 id="afc-title">Card anatomy and Essence cost</h1></header>
   <div className="afc-card">
    <AshenCardFrame card={unit} publishedArtOnly/>
    {region&&<button key={region.id} className={`afc-region afc-${region.id}`} aria-label={`Read ${region.label}`} onClick={()=>setStep(step+1)}/>}
   </div>
   <div>
    <p role="status">{step>0?regions[step-1].explanation:'This is the Unit you’ll read before your first battle.'}</p>
    {region?<p>Select the highlighted {region.label.toLowerCase()} on the card.</p>:<button type="button" className="primary" onClick={onComplete}>Continue to Ley Fonts</button>}
    <div className="afc-actions"><button type="button" onClick={onSkip}>Skip to practice</button><button type="button" onClick={onExit}>Back</button></div>
   </div>
  </section>
 );
}
