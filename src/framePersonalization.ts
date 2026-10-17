export type FrameLook={accent:string;paper:string;zoom:number;panX:number;panY:number};
export const DEFAULT_LOOK:FrameLook={accent:'#b18a55',paper:'#f0e2c6',zoom:1,panX:50,panY:50};
const STORAGE='dueltheory-frame-look-v1';
export function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,Number.isFinite(value)?value:min));}
export function normalizeLook(value:unknown):FrameLook{
 const p=value&&typeof value==='object'?value as Partial<FrameLook>:{};
 const color=(input:unknown,fallback:string)=>typeof input==='string'&&/^#[0-9a-fA-F]{6}$/.test(input)?input:fallback;
 return {accent:color(p.accent,DEFAULT_LOOK.accent),paper:color(p.paper,DEFAULT_LOOK.paper),zoom:clamp(Number(p.zoom??1),1,2),panX:clamp(Number(p.panX??50),0,100),panY:clamp(Number(p.panY??50),0,100)};
}
export function loadLook():FrameLook{try{return normalizeLook(JSON.parse(localStorage.getItem(STORAGE)||'null'));}catch{return {...DEFAULT_LOOK};}}
export function saveLook(look:FrameLook){try{localStorage.setItem(STORAGE,JSON.stringify(normalizeLook(look)));return true;}catch{return false;}}
