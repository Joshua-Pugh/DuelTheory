export const TABLE_THEMES={forge:{label:'Forge green',background:'#183529'},obsidian:{label:'Obsidian',background:'#20232b'},wine:{label:'Burgundy',background:'#402332'},ocean:{label:'Deep blue',background:'#17374b'}} as const;
export type TableTheme=keyof typeof TABLE_THEMES;
export const validTheme=(value:unknown):value is TableTheme=>typeof value==='string'&&Object.hasOwn(TABLE_THEMES,value);
export function validAccent(value:unknown):value is string{return typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);}
export const MAX_BACKGROUND_BYTES=128*1024;
export function savedAppearance():{theme:TableTheme;accent:string}{try{const value=JSON.parse(localStorage.getItem('dueltheory.table.appearance.v1')||'null');if(validTheme(value?.theme)&&validAccent(value?.accent))return value;}catch{}return {theme:'forge',accent:'#ddc57a'};}
export function saveAppearance(value:{theme:TableTheme;accent:string}){if(!validTheme(value.theme)||!validAccent(value.accent))throw Error('Invalid appearance.');localStorage.setItem('dueltheory.table.appearance.v1',JSON.stringify(value));}
export function autoAppearanceEnabled(){try{return localStorage.getItem('dueltheory.table.auto-appearance.v1')==='true';}catch{return false;}}
export function saveAutoAppearance(enabled:boolean){localStorage.setItem('dueltheory.table.auto-appearance.v1',String(enabled));}
/** Only bounded raster files; served through authenticated room access, never as HTML/SVG. */
export function backgroundMime(data:Uint8Array):'image/jpeg'|'image/png'|'image/webp'|null{
 if(data.length<12||data.length>MAX_BACKGROUND_BYTES)return null;
 if(data[0]===255&&data[1]===216&&data[2]===255)return 'image/jpeg';
 if([137,80,78,71,13,10,26,10].every((n,i)=>data[i]===n))return 'image/png';
 const text=(a:number,b:number)=>String.fromCharCode(...data.slice(a,b));return text(0,4)==='RIFF'&&text(8,12)==='WEBP'?'image/webp':null;
}
