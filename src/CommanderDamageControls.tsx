import {useState} from 'react';

export default function CommanderDamageControls({damage,disabled,onAdjust}:{damage:number;disabled:boolean;onAdjust:(delta:number)=>void}){
 const [manual,setManual]=useState('');
 const text=manual.trim().replace('−','-');
 const value=/^[+-]\d+$/.test(text)?Number(text):NaN;
 const valid=Number.isInteger(value)&&value!==0&&Math.abs(value)<=999;
 const belowZero=valid&&damage-value<0;
 return <div className="ct-commander-adjust">
  <div className="ct-actions" role="group" aria-label="Quick commander damage changes">
   <button aria-label="Take 1 commander damage" disabled={disabled} onClick={()=>onAdjust(1)}>−1</button>
   <output aria-label="Selected commander damage">{damage} received</output>
   <button aria-label="Take 5 commander damage" disabled={disabled} onClick={()=>onAdjust(5)}>−5</button>
  </div>
  <form onSubmit={e=>{e.preventDefault();if(!disabled&&valid&&!belowZero)onAdjust(-value);}}>
   <label>Manual hit or correction<input type="text" inputMode="text" maxLength={5} value={manual} onChange={e=>setManual(e.target.value)} placeholder="−7 hit or +3 correction" autoComplete="off" aria-describedby="ct-manual-damage-hint"/></label>
   <button className="ct-primary" type="submit" disabled={disabled||!valid||belowZero}>Apply change</button>
  </form>
  <p className="ct-hint" id="ct-manual-damage-hint">{belowZero?'You cannot undo more damage than this commander has dealt.':text&&!valid?'Enter + or − followed by a whole number from 1 to 999.':'Use − for a hit or + to correct damage already recorded. Hits increase commander damage received and, when enabled, subtract life.'}</p>
 </div>;
}
