export const DISPLAY_NAME_KEY='dueltheory.display-name.v1';
export function normalizeDisplayName(value:unknown){return typeof value==='string'?value.trim().slice(0,32):'';}
export function loadDisplayName():string{try{return normalizeDisplayName(localStorage.getItem(DISPLAY_NAME_KEY));}catch{return '';}}
export function saveDisplayName(name:string):boolean{try{const value=normalizeDisplayName(name);localStorage.setItem(DISPLAY_NAME_KEY,value);return true;}catch{return false;}}
/** Adopt only this device's authenticated seat name; never overwrite an explicit saved preference. */
export function rememberSeatName(name:unknown){try{if(localStorage.getItem(DISPLAY_NAME_KEY)===null&&normalizeDisplayName(name))saveDisplayName(normalizeDisplayName(name));}catch{/* Optional nickname storage never blocks joining a room. */}}
