import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import RulesText from './RulesText';
import {rulesForCard} from './ashenPresentation';
import catalog from './ashenCatalog.json';
import {ashenEffects} from './games/ashen/effectPacks';
import {sharedLessons,deckLessons} from './ashenWalkthroughLessons';
describe('AT starter review',()=>{
 it('emphasizes the Command keyword but never the Command Station zone name',()=>{
  const html=renderToStaticMarkup(<RulesText emphasize text={'Command\nDeal 1 damage to target Command Station. Command station stays in play.'}/>);
  expect(html).toContain('<strong>Command</strong>');
  expect(html).not.toContain('<strong>Command</strong> Station');
  expect(html).not.toContain('<strong>Command</strong> station');
 });
 it('uses Frontline consistently, including older saved card descriptions',()=>{
  for(const card of catalog.cards)expect(card.effectText.replaceAll('Frontline',''),card.name).not.toMatch(/front\s*line/i);
  expect(rulesForCard({name:'Saved card',type:'Unit',description:'Front Line, frontline, Frontline'}).text).toBe('Frontline, Frontline, Frontline');
 });
 it('has an implemented definition for every current Brute and Noble card',()=>{
  for(const card of catalog.cards){expect(ashenEffects[card.id],card.name).toBeDefined();expect(ashenEffects[card.id].coverage,card.name).toBe('implemented');}
 });
 it('teaches actual starter decisions and their consequences for each faction',()=>{
  for(const deck of ['Brute','Noble'] as const)for(const lesson of [...sharedLessons,...deckLessons[deck]]){
   expect(lesson.answers[lesson.correct]).toBeTruthy();expect(lesson.why.length).toBeGreaterThan(120);expect(lesson.tryIt).toBeTruthy();
  }
  expect(deckLessons.Noble.map(x=>x.why).join(' ')).toContain('zero damage');
  expect(deckLessons.Brute.map(x=>x.why).join(' ')).toContain('Call itself');
 });
});
