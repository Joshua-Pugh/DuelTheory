import type {GameDefinition,TabletopInput} from './CreatorTabletop';
import {validResourceCost,type ResourceCost} from '../ashenPresentation';
export type CreatorCard=TabletopInput & {description?:string;flavorText?:string;rulesOverride?:boolean;faction?:string;frameFaction?:string;rarity?:string;subtype?:string;resourceCost?:ResourceCost;outfitCost?:number|null;cost?:string;attack?:number;defense?:number;quantity?:number;template?:string};
export type CreatorProject={schemaVersion:1;id:string;name:string;definition:GameDefinition;cards:CreatorCard[];decks?:[{name:string;entries:Record<string,number>},{name:string;entries:Record<string,number>}];updatedAt:string};
export function normalizedDecks(project:CreatorProject){return project.decks??[{name:'Player 1 Deck',entries:Object.fromEntries(project.cards.map(c=>[c.cardId,1]))},{name:'Player 2 Deck',entries:Object.fromEntries(project.cards.map(c=>[c.cardId,1]))}] as [{name:string;entries:Record<string,number>},{name:string;entries:Record<string,number>}];}

export const PROJECTS_KEY='dueltheory-creator-projects-v1';
const forbidden=new Set(['deck','hand','graveyard','banished']);
export function validateProject(project:CreatorProject):string[]{
 const errors:string[]=[];
 if(project.schemaVersion!==1)errors.push('Unsupported project schema.');
 if(!project.name.trim()||project.name.length>80)errors.push('Game name must be between 1 and 80 characters.');
 const d=project.definition;
 if(!Number.isInteger(d.startingHand)||d.startingHand<0||d.startingHand>20)errors.push('Starting hand must be 0–20.');
 if(!Number.isInteger(d.startingHealth)||d.startingHealth<1||d.startingHealth>100000)errors.push('Starting health must be 1–100,000.');
 if(!d.healthLabel.trim()||d.healthLabel.length>30)errors.push('Health label is required (30 characters maximum).');
 if(!d.zones.length||d.zones.length>20)errors.push('Define 1–20 zones.');
 const seen=new Set<string>();
 for(const z of d.zones){if(!/^[a-z][a-z0-9-]{0,30}$/.test(z.id)||forbidden.has(z.id)||seen.has(z.id))errors.push(`Invalid, duplicate or reserved zone ID: ${z.id}`);seen.add(z.id);if(!z.label.trim()||z.label.length>50)errors.push(`Invalid label for ${z.id}`);if(!Number.isInteger(z.slots)||z.slots<1||z.slots>100)errors.push(`Invalid capacity for ${z.id}`);}
 if(project.cards.length>500)errors.push('500 distinct card entries maximum.');
 const ids=new Set<string>();
 for(const c of project.cards){if(!c.cardId||ids.has(c.cardId))errors.push(`Duplicate or missing card ID: ${c.cardId}`);ids.add(c.cardId);if(!c.name.trim()||c.name.length>100)errors.push(`Invalid card name: ${c.cardId}`);if(c.image&&!/^data:image\/(png|jpeg|webp);base64,/.test(c.image))errors.push(`Only embedded image data is supported: ${c.cardId}`);if(c.resourceCost!==undefined&&!validResourceCost(c.resourceCost))errors.push(`Invalid resource cost: ${c.cardId}`);if(c.outfitCost!=null&&(!Number.isInteger(c.outfitCost)||c.outfitCost<0||c.outfitCost>99))errors.push(`Invalid Outfit cost: ${c.cardId}`);}
 for(const deck of normalizedDecks(project)){if(!deck.name||deck.name.length>80)errors.push('Each deck needs a name.');for(const [id,count] of Object.entries(deck.entries)){if(!ids.has(id))errors.push(`Deck references missing card: ${id}`);if(!Number.isInteger(count)||count<0||count>100)errors.push(`Invalid card quantity: ${id}`);}}
 return errors;
}
export function newCreatorProject():CreatorProject{
 const id=`creator-${crypto.randomUUID()}`;
 return {schemaVersion:1,id,name:'Untitled Card Game',definition:{schemaVersion:1,id,version:'0.1.0',name:'Untitled Card Game',startingHand:5,startingHealth:20,healthLabel:'HP',zones:[{id:'battlefield',label:'Battlefield',slots:7},{id:'support',label:'Support',slots:5}]},cards:[],decks:[{name:'Player 1 Deck',entries:{}},{name:'Player 2 Deck',entries:{}}],updatedAt:new Date().toISOString()};
}
export function loadCreatorProjects():CreatorProject[]{try{const parsed=JSON.parse(localStorage.getItem(PROJECTS_KEY)||'[]');return Array.isArray(parsed)?parsed.filter(p=>p?.schemaVersion===1&&p?.definition?.zones&&Array.isArray(p.cards)):[];}catch{return []}}
export function persistCreatorProjects(projects:CreatorProject[]):boolean{try{localStorage.setItem(PROJECTS_KEY,JSON.stringify(projects));return true;}catch{return false}}
export function projectDeck(project:CreatorProject,seat:0|1=0):TabletopInput[]{const deck=normalizedDecks(project)[seat];return project.cards.flatMap(card=>Array.from({length:deck.entries[card.cardId]||0},()=>({cardId:card.cardId,name:card.name,type:card.type,image:card.image,presentation:{...card,setName:project.name}})));} 

