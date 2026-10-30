import {validTheme,type TableTheme} from '../table/appearance';
import {validateTableProfile,type TableProfile} from '../table/profiles';
export type PlayerSetup={schemaVersion:1;displayName:string;accent:string;theme?:TableTheme};
export type SavedSetup={id:string;kind:'game'|'player';name:string;data:TableProfile|PlayerSetup;revision:number;updated_at:string};
export function validatePlayerSetup(value:unknown):PlayerSetup{
 const p=value as PlayerSetup;
 if(!p||p.schemaVersion!==1||typeof p.displayName!=='string'||!p.displayName.trim()||p.displayName.length>32||!/^#[0-9a-f]{6}$/i.test(p.accent))throw Error('Use a name up to 32 characters and a six-digit color.');
 if(p.theme!==undefined&&!validTheme(p.theme))throw Error('Choose a supported theme.');
 return {schemaVersion:1,displayName:p.displayName.trim(),accent:p.accent,...(p.theme?{theme:p.theme}:{})};
}
export function validateSavedSetup(value:unknown):SavedSetup{
 const r=value as SavedSetup;
 if(!r||typeof r.id!=='string'||!['game','player'].includes(r.kind)||typeof r.name!=='string'||!r.name.trim()||r.name.length>50||!Number.isInteger(r.revision)||r.revision<1||typeof r.updated_at!=='string')throw Error('Invalid saved setup.');
 return {...r,data:r.kind==='game'?validateTableProfile(r.data):validatePlayerSetup(r.data)};
}
