/** Portable, data-only settings. No game engine, card catalog or artwork dependencies. */
export type TrackerDefinition={label:string;start:number;defeatAt:number|null};
export type TableProfile={schemaVersion:1;name:string;health:{label:string;start:number;defeatAt:number|null};counters:TrackerDefinition[];sourceDamage:{enabled:boolean;label:string;defeatAt:number|null};};
export const DUEL_PROFILE:TableProfile={schemaVersion:1,name:'Classic Duel',health:{label:'Life',start:20,defeatAt:0},counters:[],sourceDamage:{enabled:false,label:'Source damage',defeatAt:null}};
export const MULTIPLAYER_PROFILE:TableProfile={schemaVersion:1,name:'Multiplayer Table',health:{label:'Vitality',start:30,defeatAt:0},counters:[{label:'Energy',start:0,defeatAt:null}],sourceDamage:{enabled:true,label:'Source damage',defeatAt:null}};
const reserved=['__proto__','prototype','constructor'];
export function validateTableProfile(input:unknown):TableProfile{
 const fail=():never=>{throw Error('Invalid table profile. Use version 1, labels up to 24 characters, whole-number values, and up to 8 unique counters.');};
 if(!input||typeof input!=='object')return fail();
 const p=input as TableProfile;
 const label=(s:unknown,max=24):s is string=>typeof s==='string'&&s.trim().length>0&&s.trim().length<=max&&!reserved.includes(s.trim().toLowerCase());
 const number=(n:unknown,min:number,max:number):n is number=>Number.isInteger(n)&&Number(n)>=min&&Number(n)<=max;
 const threshold=(n:unknown)=>n===null||number(n,0,99999);
 if(p.schemaVersion!==1||!label(p.name,50)||!p.health||!label(p.health.label)||!number(p.health.start,1,99999)||!threshold(p.health.defeatAt)||(p.health.defeatAt!==null&&p.health.start<=p.health.defeatAt)||!Array.isArray(p.counters)||p.counters.length>8||!p.sourceDamage||typeof p.sourceDamage.enabled!=='boolean'||!label(p.sourceDamage.label)||!(p.sourceDamage.defeatAt===null||number(p.sourceDamage.defeatAt,1,999)))return fail();
 const seen=new Set<string>();
 const counters=p.counters.map(c=>{if(!c||!label(c.label)||!number(c.start,0,9999)||!(c.defeatAt===null||number(c.defeatAt,1,9999))||(c.defeatAt!==null&&c.start>=c.defeatAt)||seen.has(c.label.trim().toLowerCase()))return fail();seen.add(c.label.trim().toLowerCase());return {label:c.label.trim(),start:c.start,defeatAt:c.defeatAt};});
 return {schemaVersion:1,name:p.name.trim(),health:{label:p.health.label.trim(),start:p.health.start,defeatAt:p.health.defeatAt},counters,sourceDamage:{enabled:p.sourceDamage.enabled,label:p.sourceDamage.label.trim(),defeatAt:p.sourceDamage.defeatAt}};
}
const key='dueltheory.table.profiles.v1';
export function savedTableProfiles():TableProfile[]{try{const raw=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(raw)?raw.slice(0,20).flatMap(p=>{try{return [validateTableProfile(p)];}catch{return [];}}):[];}catch{return [];}}
export function saveTableProfile(profile:TableProfile){const p=validateTableProfile(profile),all=savedTableProfiles().filter(x=>x.name.toLowerCase()!==p.name.toLowerCase());localStorage.setItem(key,JSON.stringify([...all,p].slice(-20)));}
export function updateTableProfile(previousName:string,profile:TableProfile){const p=validateTableProfile(profile),all=savedTableProfiles();const index=all.findIndex(x=>x.name===previousName);if(index<0)throw Error('This saved profile is no longer on this device. Save it as new.');if(all.some((x,i)=>i!==index&&x.name.toLowerCase()===p.name.toLowerCase()))throw Error('A different saved profile already has this name. Choose another name.');all[index]=p;localStorage.setItem(key,JSON.stringify(all));}
export function profileFromGame(definition:{name:string;healthLabel:string;startingHealth:number}):TableProfile{return validateTableProfile({...DUEL_PROFILE,name:definition.name.slice(0,50),health:{label:definition.healthLabel.slice(0,24),start:definition.startingHealth,defeatAt:0}});}
