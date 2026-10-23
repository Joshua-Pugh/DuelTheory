import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import catalog from './ashenCatalog.json';
import {rulesForCard,cleanTypeLine} from './ashenPresentation';
import RulesText from './RulesText';
import CardMaterials from './CardMaterials';
describe('source card text',()=>{
 it('keeps complete control clauses and corrected spelling in the shared card renderer',()=>{
  const warhowl=catalog.cards.find(c=>c.name==='Warhowl Instigator')!;
  expect(warhowl.effectText).toContain('under your control, draw a card.');
  expect(renderToStaticMarkup(<RulesText text={warhowl.effectText}/>)).toContain('under your control');
  expect(catalog.cards.find(c=>c.name==='Ashenfield War Ram')!.effectText).toContain('each Noble you control');
  for(const c of catalog.cards)expect(c.effectText).not.toMatch(/under your,|each Noble your control|to ant target|damage is delt|Kordath/);
 });
 it('provides rules for all 91 entries without costs or footer text in the type line',()=>{
  expect(catalog.cards).toHaveLength(91);
  for(const c of catalog.cards){expect(c.effectText.trim().length).toBeGreaterThan(0);expect(c.effectStatus).toBe('source-transcribed');expect(c.subtype).not.toMatch(/Ashen Throne|A\d+\s*\/|^\d/);}
 });
 it('recovers the missing triggered effect and resource icons from Word text boxes',()=>{
  const c=catalog.cards.find(c=>c.name==='Archivist of the Crown')!;
  expect(c.effectText).toContain('Whenever you place a card on the bottom');
  expect(c.effectText).toContain('{Untuned}');
  expect(renderToStaticMarkup(<RulesText text="Pay 1 {Untuned}."/>)).toContain('alt="Untuned"');
 });
 it('repairs legacy Studio type lines and fills blank imported descriptions without overwriting edits',()=>{
  expect(cleanTypeLine({name:'G',type:'Unit',subtype:'1 Unit – Noble Griffin Knight Bronze Ashen Throne A3 / D2'})).toBe('Unit — Noble Griffin Knight');
  const c={cardId:'ashen-noble-archivist-of-the-crown',name:'A',type:'Unit',description:''};
  expect(rulesForCard(c).text).toContain('{Untuned}');
  expect(rulesForCard({...c,rulesOverride:true}).text).toBe('');
  expect(rulesForCard({...c,description:'My custom rule.'}).text).toBe('My custom rule.');
 });
 it('keeps the outer image untransformed when expanding the interior rules panel',()=>{
  const html=renderToStaticMarkup(<CardMaterials expanded metalFilter="url(#metal)" inlayFilter="url(#inlay)"/>);
  expect(html).toContain('viewBox="0 980 1060 290"');
  expect(html).toContain('class="ashen-layer-outer" href="/ashen/layers/outer-rusted-iron.png" width="1060" height="1484"');
 });
});

