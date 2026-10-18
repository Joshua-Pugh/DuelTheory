import {useState} from 'react';
import {parseCommanderDamageInput} from './commander/damageInput';

export default function CommanderDamageControls({damage,disabled,sourceSelected=true,onAdjust}:{damage:number;disabled:boolean;sourceSelected?:boolean;onAdjust:(delta:number)=>void}){
 const [manual,setManual]=useState('');
 const text=manual.trim().replace('−','-');
 const delta=parseCommanderDamageInput(text);
 const valid=delta!==null;
 const belowZero=delta!==null&&damage+delta<0;
 const blocked=disabled||!sourceSelected;
 return <div className="ct-commander-adjust">
  <div className="ct-actions" role="group" aria-label="Quick commander damage changes">
   <button aria-label="Take 1 commander damage" disabled={blocked} onClick={()=>onAdjust(1)}>−1</button>
   <output aria-label="Selected commander damage">{damage} received</output>
   <button aria-label="Take 5 commander damage" disabled={blocked} onClick={()=>onAdjust(5)}>−5</button>
  </div>
  <form onSubmit={e=>{e.preventDefault();if(!blocked&&delta!==null&&!belowZero)onAdjust(delta);}}>
   <label>Manual damage or correction<input type="text" inputMode="text" maxLength={5} value={manual} onChange={e=>setManual(e.target.value)} placeholder="7 damage or +3 correction" autoComplete="off" aria-describedby="ct-manual-damage-hint"/></label>
   <button className="ct-primary" type="submit" disabled={blocked||!valid||belowZero}>Apply change</button>
  </form>
  <p className="ct-hint" id="ct-manual-damage-hint">{!sourceSelected?'Choose the commander that dealt the damage above, then apply your amount.':belowZero?'You cannot undo more damage than this commander has dealt.':text&&!valid?'Enter a whole number from 1 to 999. Use + only to correct damage already recorded.':delta!==null?delta>0?`Record ${delta} damage received. Life also decreases if linked above.`:`Remove ${-delta} recorded damage. Life also increases if linked above.`:'Enter 7 or −7 to take 7 damage; +3 removes 3 recorded damage. Linked life adjusts automatically.'}</p>
 </div>;
}
