import printData from './ashenPrintData.json';
import catalog from './ashenCatalog.json';
export const RESOURCES=['untuned','oath','fury','ash','veil'] as const;
export type Resource=typeof RESOURCES[number];
export type ResourceCost=Partial<Record<Resource,number>>;
export type FrameFaction='Noble'|'Brute'|'Neutral';
export type AshenCardData={id?:string;cardId?:string;name:string;type:string;subtype?:string;faction?:string;frameFaction?:string;rarity?:string;attack?:number|null;defense?:number|null;effectText?:string;description?:string;flavorText?:string;rulesOverride?:boolean;effectStatus?:string;image?:string;resourceCost?:ResourceCost;outfitCost?:number|null;cost?:string;setName?:string};
const sources=new Map<string,AshenCardData>(catalog.cards.map(card=>[card.id,card]));
export function rulesForCard(card:AshenCardData){
 const source=sources.get(card.id??card.cardId??'');
 let text=card.rulesOverride?(card.description??card.effectText??''):(card.effectText||card.description||source?.effectText||'');
 // Repair known transcription mistakes in older native copies, leaving explicit Studio overrides alone.
 if(source&&!card.rulesOverride){
  for(const [old,fixed] of [['under your,','under your control,'],['each Noble your control','each Noble you control'],['damage is delt.','damage is dealt.'],['to ant target.','to any target.'],['Kordath, Lord of Ruin','Korgath, Lord of Ruin'],['Whenever Plan, Refine, or Fortify','Whenever you Plan, Refine, or Fortify'],['Verdant Veil Font enters','Verdant Veil Fount enters']])text=text.replaceAll(old,fixed);
 }
 return {text,flavor:card.flavorText??(card.rulesOverride?'':source?.flavorText??'')};
}
export function cleanTypeLine(card:AshenCardData){
 let value=(card.subtype||card.type).replace(/\s+/g,' ').replace(/--|–/g,'—').trim();
 const start=value.search(new RegExp(`(?:Legendary )?${card.type.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`));
 if(start>0)value=value.slice(start);
 value=value.split('Ashen Throne')[0].replace(/\s+(?:Iron|Bronze|Brozne|Silver)\b.*$/,'').replace(/\s+A\s*\d+\s*\/.*$/,'').trim();
 return value;
}
type PrintData={resourceCost:ResourceCost;frameFaction:string;outfitCost?:number;costSource:string};
const printed=printData as Record<string,PrintData>;
export function cardPresentation(card:AshenCardData){
 const source=printed[card.id??card.cardId??''];
 const affinity=(card.frameFaction??source?.frameFaction??card.faction??'').trim().toLowerCase();
 const faction:FrameFaction=/^nobles?$/.test(affinity)?'Noble':/^brutes?$/.test(affinity)?'Brute':'Neutral';
 const printedCost=source&&Object.keys(source.resourceCost).length?source.resourceCost:undefined;
 return {faction,resourceCost:card.resourceCost??printedCost??parseLegacyCost(card.cost??''),outfitCost:card.outfitCost===null?undefined:card.outfitCost??source?.outfitCost,costSource:source?.costSource};
}
export function parseLegacyCost(text:string):ResourceCost|undefined{
 if(!text.trim())return undefined;
 if(/^\d+$/.test(text.trim()))return {untuned:Number(text)};
 const cost:ResourceCost={};
 for(const part of text.toLowerCase().split(/\s*(?:\+|,)\s*/)){const m=part.trim().match(/^(\d+)\s*(untuned|oath|fury|ash|veil)$/);if(!m)return undefined;const r=m[2] as Resource;cost[r]=(cost[r]??0)+Number(m[1]);}
 return cost;
}
export function validResourceCost(value:unknown):value is ResourceCost{return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([key,count])=>RESOURCES.includes(key as Resource)&&Number.isInteger(count)&&Number(count)>=0&&Number(count)<=99);}
