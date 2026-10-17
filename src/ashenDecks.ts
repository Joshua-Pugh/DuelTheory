import catalog from './ashenCatalog.json';

export type AshenFaction='Brute'|'Noble';
export type AshenDeck={id:string;name:string;faction:AshenFaction;commandStationId:string;entries:{cardId:string;count:number}[];updatedAt:string};
export const ASHEN_STORAGE_KEY='dueltheory-ashen-command-decks-v1';
export const ashenCardMap=new Map(catalog.cards.map(c=>[c.id,c]));
export function starterDeck(faction:AshenFaction):AshenDeck{
 const source=catalog.decks[faction];
 const station=catalog.cards.find(c=>c.faction===faction&&c.type==='Command Station');
 return {id:`prototype-${faction.toLowerCase()}`,name:source.name,faction,commandStationId:station?.id||'',entries:source.entries.map(e=>({...e})),updatedAt:new Date().toISOString()};
}
export function deckCount(deck:AshenDeck){return deck.entries.reduce((sum,e)=>sum+e.count,0)}
export function changeAshenQuantity(deck:AshenDeck,cardId:string,delta:number):AshenDeck{
 const card=ashenCardMap.get(cardId);
 if(!card||card.type==='Command Station'||card.faction!==deck.faction||!Number.isInteger(delta))return deck;
 const current=deck.entries.find(e=>e.cardId===cardId)?.count||0;
 const next=current+delta;
 if(next<0||next>60||deckCount(deck)+delta>60)return deck;
 const entries=deck.entries.filter(e=>e.cardId!==cardId);
 if(next)entries.push({cardId,count:next});
 return {...deck,entries,updatedAt:new Date().toISOString()};
}
export function inspectAshenDeck(deck:AshenDeck){
 const issues:string[]=[];
 const total=deckCount(deck);
 if(total!==60)issues.push(`Command Siege requires 60 cards; this deck has ${total}.`);
 const station=ashenCardMap.get(deck.commandStationId);
 if(!station||station.type!=='Command Station'||station.faction!==deck.faction)issues.push('Select a matching Command Station.');
 const seen=new Set<string>();
 let fonts=0;let unreviewed=0;
 for(const entry of deck.entries){
  const card=ashenCardMap.get(entry.cardId);
  if(!card||card.type==='Command Station'||card.faction!==deck.faction)issues.push(`Invalid entry: ${entry.cardId}`);
  if(!Number.isInteger(entry.count)||entry.count<1)issues.push(`Invalid quantity: ${entry.cardId}`);
  if(seen.has(entry.cardId))issues.push(`Duplicate entry row: ${entry.cardId}`);
  seen.add(entry.cardId);
  if(card?.type==='Ley Font')fonts+=entry.count;
  if(card?.effectStatus==='needs-review')unreviewed++;
 }
 if(fonts<16||fonts>22)issues.push(`The rules recommend 16–22 Ley Fonts; this deck has ${fonts} (advisory only).`);
 return {total,fonts,unreviewed,issues,valid:issues.filter(i=>!i.includes('recommend')).length===0};
}
export function safeLoadAshenDecks():AshenDeck[]{
 try {const data=JSON.parse(localStorage.getItem(ASHEN_STORAGE_KEY)||'[]');return Array.isArray(data)?data.filter(d=>d&&typeof d.id==='string'&&Array.isArray(d.entries)):[]}catch{return []}
}
