import {useState} from 'react';
import {TABLE_THEMES,savedAppearance,saveAppearance,type TableTheme} from '../table/appearance';
import type {RoomCommand,TablePlayer} from '../table/model';
export default function EventPlayerAppearance({player,busy,change}:{player:TablePlayer;busy:boolean;change:(c:RoomCommand)=>Promise<boolean>}){
 const [theme,setTheme]=useState<TableTheme>(player.theme??savedAppearance().theme),[accent,setAccent]=useState(player.accent??savedAppearance().accent);
 return <form onSubmit={async e=>{e.preventDefault();if(await change({type:'appearance',theme,accent}))saveAppearance({theme,accent});}}><h3>Your colors</h3><label>Player card<select value={theme} onChange={e=>setTheme(e.target.value as TableTheme)}>{Object.entries(TABLE_THEMES).map(([key,value])=><option key={key} value={key}>{value.label}</option>)}</select></label><label>Accent<input type="color" value={accent} onChange={e=>setAccent(e.target.value)}/></label><button disabled={busy}>Apply colors</button></form>;
}
