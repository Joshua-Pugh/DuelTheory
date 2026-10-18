import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import AshenCardFrame from './AshenCardFrame';
import {AshenRules} from './RulesText';
import catalog from './ashenCatalog.json';
import AshenBattlefield from './AshenBattlefield';
import {newBattlefield} from './ashenBattlefieldState';

describe('shared AT rules layout',()=>{
 it('marks a fatigued frontline Unit with an F counter',()=>{
  const state=newBattlefield(true,()=>.2),id=state.table.piles['0:unit'][0];state.table.cards[id].rotated=true;
  const html=renderToStaticMarkup(<AshenBattlefield initialState={state}/>);
  expect(html).toContain('aria-label="1 Fatigue counter">F</span>');
 });
 it('marks exhausted support cards with the same fatigue badge',()=>{
  const state=newBattlefield(true,()=>.2);for(const c of Object.values(state.table.cards))c.rotated=false;const id=state.table.piles['0:support'][0];state.table.cards[id].rotated=true;
  expect(renderToStaticMarkup(<AshenBattlefield initialState={state}/>)).toContain('aria-label="1 Fatigue counter">F</span>');
 });
 it('uses the expanded art and rules geometry for every catalog card',()=>{
  for(const card of catalog.cards){const html=renderToStaticMarkup(<AshenCardFrame card={card}/>);expect(html).toContain('rules-expanded');expect(html).toContain('viewBox="0 220 1060 580"');}
 });
 it('keeps stat rings only for units and stations, moving station HP out of the rules',()=>{
  for(const type of ['Relic','Rune','Tactic','Strategy','Ley Font']){
   const html=renderToStaticMarkup(<AshenCardFrame card={{name:'Test',type,attack:4,defense:5,effectText:'An effect.'}}/>);
   expect(html).toContain('statless-frame');expect(html).not.toContain('class="ashen-frame-stats');expect(html).toContain('viewBox="0 855 1060 110"');
  }
  for(const card of catalog.cards.filter(c=>c.type==='Command Station')){const html=renderToStaticMarkup(<AshenCardFrame card={card}/>);expect(html).toContain('<strong>HP 20</strong>');expect(html).not.toContain('HP: 20');expect(html).not.toContain('>STATION<');}
  expect(renderToStaticMarkup(<AshenCardFrame card={{name:'Unit',type:'Unit',attack:2,defense:3}}/>)).toContain('<strong>A2 / D3</strong>');
 });
 it('separates keywords and effects while leaving reminders and ability prose normal',()=>{
  const html=renderToStaticMarkup(<AshenRules text={'Charge, Soar (Reminder text.)\nWhen this enters, draw a card.'}/>);
  expect(html).toContain('ashen-keyword-block has-effect');expect(html).toContain('<strong>Charge</strong>');expect(html).toContain('<strong>Soar</strong>');expect(html).toContain('ashen-ability-block');expect(html).not.toContain('<strong>When');expect(html).not.toContain('<strong>Reminder');
 });
});
