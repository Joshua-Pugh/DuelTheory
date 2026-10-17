import {describe,it,expect} from 'vitest';
import catalog from './ashenCatalog.json';
import {cardPresentation,parseLegacyCost,validResourceCost} from './ashenPresentation';
import {newAshenCreatorProject} from './services/AshenCreatorProject';
import {projectDeck,validateProject} from './services/CreatorProjects';
import {createTabletop} from './services/CreatorTabletop';
const card=(name:string,faction='Noble')=>catalog.cards.find(c=>c.name===name&&c.faction===faction)!;
describe('printed AT presentation',()=>{
 it('uses printed colored and generic symbols rather than guessed costs',()=>{
  expect(cardPresentation(card('Court Scribe')).resourceCost).toEqual({oath:1});
  expect(cardPresentation(card('Banner Guard')).resourceCost).toEqual({untuned:1,oath:2});
  expect(cardPresentation(card('Frenzied Grunt','Brute')).resourceCost).toEqual({fury:1});
 });
 it('keeps generic relics neutral even when included in a faction source deck',()=>{
  for(const f of ['Noble','Brute'])expect(cardPresentation(card('Ring of the Ley',f))).toMatchObject({faction:'Neutral',resourceCost:{untuned:1}});
  expect(cardPresentation(card('Ashenfield Lance'))).toMatchObject({faction:'Neutral',resourceCost:{untuned:2},outfitCost:1});
  expect(cardPresentation(card('Flamebelcher Rig','Brute'))).toMatchObject({faction:'Neutral',outfitCost:1});
 });
 it('uses neutral styling for every factionless card type',()=>{
  for(const type of ['Relic','Rune','Tactic','Strategy'])expect(cardPresentation({name:'Test',type}).faction).toBe('Neutral');
  expect(cardPresentation({name:'N',type:'Unit',faction:'Nobles'}).faction).toBe('Noble');
 });
 it('keeps source-free fonts unpriced and can preserve unknown legacy cost text',()=>{
  expect(cardPresentation(card('Oath Font')).resourceCost).toBeUndefined();
  expect(parseLegacyCost('2 Untuned + 1 Oath')).toEqual({untuned:2,oath:1});
  expect(parseLegacyCost('X special')).toBeUndefined();
  expect(validResourceCost({oath:-1})).toBe(false);
 });
 it('carries editable costs and Outfit through Studio decks and saved tabletop data',()=>{
  const p=newAshenCreatorProject();expect(validateProject(p)).toEqual([]);
  const c=p.cards.find(c=>c.name==='Ashenfield Lance')!;c.resourceCost={untuned:4};c.outfitCost=2;
  const inputs=projectDeck(p,1);const data=inputs.find(c=>c.name==='Ashenfield Lance')!;
  expect(data.presentation).toMatchObject({resourceCost:{untuned:4},outfitCost:2});
  expect(cardPresentation(JSON.parse(JSON.stringify({...c,outfitCost:null}))).outfitCost).toBeUndefined();
  const state=createTabletop(p.definition,[projectDeck(p,0),inputs]);
  const restored=JSON.parse(JSON.stringify(state));
  expect(Object.values(restored.cards).some((c:unknown)=>(c as typeof data).presentation?.outfitCost===2)).toBe(true);
  c.outfitCost=-1;expect(validateProject(p).some(e=>e.includes('Outfit'))).toBe(true);
 });
});
