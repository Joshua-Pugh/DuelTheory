import catalog from '../ashenCatalog.json';
import {cardPresentation} from '../ashenPresentation';
import {ASHEN_TABLETOP} from './CreatorTabletop';
import {newCreatorProject,type CreatorProject,type CreatorCard} from './CreatorProjects';
export function newAshenCreatorProject():CreatorProject{
 const project=newCreatorProject();
 const cards:CreatorCard[]=catalog.cards.map(c=>{const printed=cardPresentation(c);return {cardId:c.id,name:c.name,type:c.type,subtype:c.subtype,faction:printed.faction,frameFaction:printed.faction,rarity:c.rarity,description:c.effectText,flavorText:c.flavorText,attack:c.attack??undefined,defense:c.defense??undefined,template:'ornate',resourceCost:printed.resourceCost,outfitCost:printed.outfitCost};});
 const decks=(['Brute','Noble'] as const).map(f=>({name:catalog.decks[f].name,entries:Object.fromEntries([...catalog.decks[f].entries.map(e=>[e.cardId,e.count] as const),...catalog.cards.filter(c=>c.faction===f&&c.type==='Command Station').map(c=>[c.id,1] as const)])})) as NonNullable<CreatorProject['decks']>;
 return {...project,name:'Ashen Throne',definition:structuredClone(ASHEN_TABLETOP),cards,decks};
}
