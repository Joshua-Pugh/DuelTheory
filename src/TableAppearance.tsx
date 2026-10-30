import {useState} from 'react';
import {TABLE_THEMES,savedAppearance,saveAppearance,validTheme,type TableTheme} from './table/appearance';
import {savedBackgroundBlob,prepareBackground,setRoomBackground,savedBackground,rememberBackground,backgroundDataUrl} from './table/backgrounds';
import type {RoomSeat} from './table/client';
import type {RoomCommand,TableRoomState} from './table/model';
export default function TableAppearance({state,seat,busy,onChange,onState}:{state:TableRoomState;seat:RoomSeat;busy:boolean;onChange:(command:RoomCommand)=>Promise<boolean>;onState:(state:TableRoomState)=>void}){
 const me=state.players.find(p=>p.id===seat.playerId),[theme,setTheme]=useState<TableTheme>(me?.theme??savedAppearance().theme),[accent,setAccent]=useState(me?.accent??savedAppearance().accent),[working,setWorking]=useState(false),[message,setMessage]=useState(''),[saved,setSaved]=useState(savedBackground);
 if(!me)return null;
 const upload=async(blob:Blob|null)=>{if(working||busy)return;setWorking(true);setMessage('');try{const reply=await setRoomBackground(seat,blob);onState(reply.state);if(blob){const data=await backgroundDataUrl(blob);try{rememberBackground(data);setSaved(data);setMessage('Background shared with this table and saved on this device.');}catch{setMessage('Background shared. This device could not save a reusable copy.');}}else setMessage('Background removed from this table.');}catch(e){setMessage(e instanceof Error?e.message:'Could not update background.');}finally{setWorking(false);}};
 return <details className="ct-panel ct-appearance"><summary>Appearance · colors, theme & background</summary>
  {seat.playerId===state.host&&<label>Shared table theme<select value={state.theme??'forge'} disabled={busy||working} onChange={e=>{if(validTheme(e.target.value))void onChange({type:'tableTheme',theme:e.target.value});}}>{Object.entries(TABLE_THEMES).map(([id,t])=><option key={id} value={id}>{t.label}</option>)}</select></label>}
  <label>Your life-panel theme<select value={theme} onChange={e=>{if(validTheme(e.target.value))setTheme(e.target.value);}}>{Object.entries(TABLE_THEMES).map(([id,t])=><option key={id} value={id}>{t.label}</option>)}</select></label>
  <label>Your accent<input type="color" value={accent} onChange={e=>setAccent(e.target.value)}/></label><button disabled={busy||working} onClick={async()=>{if(await onChange({type:'appearance',theme,accent})){try{saveAppearance({theme,accent});}catch{}setMessage('Your colors are shared with this table.');}}}>Apply your colors</button>
  <label>Upload your life-panel background<input disabled={busy||working} type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file){setWorking(true);void prepareBackground(file).then(blob=>{setWorking(false);return uploadPrepared(blob);}).catch(err=>{setWorking(false);setMessage(err instanceof Error?err.message:'Could not prepare image.');});}}}/></label>
  {saved&&<><button disabled={busy||working} onClick={()=>{try{void upload(savedBackgroundBlob(saved));}catch{setMessage('The saved image could not be opened. Upload it again.');}}}>Use saved background</button><button disabled={working} onClick={()=>{rememberBackground(null);setSaved(null);setMessage('Reusable image removed from this device.');}}>Forget saved image</button></>}
  {me.backgroundVersion&&<button disabled={busy||working} onClick={()=>void upload(null)}>Remove table background</button>}
  <p>JPG, PNG or WebP, up to 6 MB. Resized to fit before upload. Everyone in this room can see it. Your image is removed from the room when you leave or the room closes; a saved reusable copy stays on this device. Colors and themes are shared for this room.</p>
  {message&&<p role="status">{message}</p>}
 </details>;
 async function uploadPrepared(blob:Blob){setWorking(false);await upload(blob);}
}
