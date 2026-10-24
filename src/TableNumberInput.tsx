import {useEffect,useState} from 'react';
/** Keep an empty edit empty; never coerce a cleared field into a visible zero. */
export default function TableNumberInput({value,onChange,min,max,placeholder}:{value:number|null;onChange:(n:number|null)=>void;min:number;max:number;placeholder?:string}){
 const display=(n:number|null)=>n===null||!Number.isFinite(n)?'':String(n);
 const [draft,setDraft]=useState(()=>display(value));
 useEffect(()=>setDraft(display(value)),[value]);
 return <input type="text" inputMode="numeric" pattern="[0-9]*" value={draft} placeholder={placeholder} maxLength={8} title={`Enter a whole number from ${min} to ${max}`} onFocus={e=>e.currentTarget.select()} onChange={e=>{const raw=e.target.value;if(raw!==''&&!/^\d+$/.test(raw))return;setDraft(raw);onChange(raw===''?null:Number(raw));}} onBlur={()=>{if(draft!=='')setDraft(String(Number(draft)));}}/>;
}
