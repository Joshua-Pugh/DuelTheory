import type {Card, Deck, DeckZone, LegalityIssue} from './types';
import {copyLimit, periodStatus, FORMAT} from '../data/goat';
export const emptyDeck = ():Deck => ({id:crypto.randomUUID(),name:'Untitled GOAT Deck',main:[],side:[],extra:[]});
export const isExtra = (card:Card) => /Fusion Monster/i.test(card.type);
export const isModernExtra = (card:Card) => /Synchro|Xyz|Link/i.test(card.type);
export const isValidMain = (card:Card) => !isExtra(card) && !isModernExtra(card) && !/Pendulum/i.test(card.type);
export function additionIssue(deck:Deck,card:Card,requestedZone:DeckZone='main'):string|null {
  const zone=isExtra(card)?'extra':requestedZone;
  if(isModernExtra(card)||/Pendulum/i.test(card.type))return `${card.name} is not supported in GOAT Format.`;
  if(zone==='extra'&&!isExtra(card))return `${card.name} cannot go in the Fusion Deck.`;
  if(zone==='side'&&isExtra(card))return `${card.name} belongs in the Fusion Deck.`;
  const limit=copyLimit(card.name);
  const copies=[...deck.main,...deck.side,...deck.extra].filter(id=>id===card.id).length;
  if(copies>=limit)return limit===0?`${card.name} is forbidden in GOAT Format.`:`${card.name} is ${limit===1?'Limited':'limited'} to ${limit} ${limit===1?'copy':'copies'} across your Main, Side and Fusion Decks.`;
  if(zone==='main'&&deck.main.length>=FORMAT.mainMax)return `Main Deck has reached the ${FORMAT.mainMax}-card simulator cap.`;
  if(zone==='side'&&deck.side.length>=FORMAT.sideMax)return 'Side Deck is full.';
  if(zone==='extra'&&deck.extra.length>=FORMAT.extraMax)return 'Fusion Deck has reached its simulator cap.';
  return null;
}
export function addCard(deck:Deck, card:Card, zone:DeckZone='main'):Deck {
  if(additionIssue(deck,card,zone))return deck;
  if(isExtra(card))zone='extra';
  return {...deck, [zone]:[...deck[zone],card.id]};
}
export function removeCard(deck:Deck, id:number, zone:DeckZone):Deck {
  const list=deck[zone]; const i=list.indexOf(id); if(i<0)return deck;
  return {...deck,[zone]:list.filter((_,idx)=>idx!==i)};
}
export function validateDeck(deck:Deck, catalog:Map<number,Card>):LegalityIssue[] {
  const issues:LegalityIssue[]=[];
  if(deck.main.length<FORMAT.mainMin||deck.main.length>FORMAT.mainMax)issues.push({kind:'error',message:`Main Deck must contain ${FORMAT.mainMin}–${FORMAT.mainMax} cards (currently ${deck.main.length}).`});
  if(deck.side.length!==0&&deck.side.length!==FORMAT.sideMax)issues.push({kind:'warning',message:`Tournament Side Deck is usually 0 or ${FORMAT.sideMax} cards; currently ${deck.side.length}.`});
  if(deck.extra.length>FORMAT.extraMax)issues.push({kind:'error',message:'Fusion Deck exceeds the optional 15-card simulator profile; historically GOAT Fusion Decks were unlimited.'});
  const counts=new Map<number,number>();
  for(const id of [...deck.main,...deck.side,...deck.extra])counts.set(id,(counts.get(id)||0)+1);
  for(const [id,count] of counts){
    const card=catalog.get(id);
    if(!card){issues.push({kind:'error',message:`Card ${id} is missing from local catalog.`});continue;}
    const limit=copyLimit(card.name);
    if(count>limit)issues.push({kind:'error',message:`${card.name}: ${count} copies, limit ${limit}.`});
    if(periodStatus(card)==='needs-review')issues.push({kind:'warning',message:`${card.name}: historical print eligibility not verified; review before tournament play.`});
    if(deck.main.includes(id)&&isExtra(card))issues.push({kind:'error',message:`${card.name} must be in the Fusion Deck.`});
    if(deck.extra.includes(id)&&!isExtra(card))issues.push({kind:'error',message:`${card.name} is not a Fusion Monster.`});
    if([...deck.main,...deck.side].includes(id)&&!isValidMain(card))issues.push({kind:'error',message:`${card.name} cannot be in a GOAT Main/Side Deck.`});
    if(deck.side.includes(id)&&isExtra(card))issues.push({kind:'error',message:`${card.name}: Fusion Monsters belong in the Fusion Deck, not the Side Deck (prototype convention).`});
  }
  return issues;
}
export const isReadyForTournament = (issues:LegalityIssue[])=>issues.length===0;
