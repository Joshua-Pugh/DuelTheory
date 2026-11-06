import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import AshenCardFrame from './AshenCardFrame';
import {AshenRules} from './RulesText';
import catalog from './ashenCatalog.json';
import AshenBattlefield from './AshenBattlefield';
import {newBattlefield} from './ashenBattlefieldState';
import {AshenCardReading} from './games/ashen/arena/AshenCardInspector';

describe('shared AT rules layout',()=>{
 it('keeps opponent hands and hidden field cards out of the shared card reader',()=>{
  const state=newBattlefield(true,()=>.2);
  const own=state.table.piles['0:hand'][0],opponent=state.table.piles['1:hand'][0];
  state.table.cards[own].faceDown=true;
  expect(renderToStaticMarkup(<AshenCardReading state={state} id={own} seat={0}/>)).toContain(state.table.cards[own].name);
  const hidden=renderToStaticMarkup(<AshenCardReading state={state} id={opponent} seat={0}/>);
  expect(hidden).toContain('Hidden card');expect(hidden).not.toContain('ashen-frame-card');
  const field=state.table.piles['1:unit'][0];state.table.cards[field].faceDown=true;
  expect(renderToStaticMarkup(<AshenCardReading state={state} id={field} seat={0}/>)).toContain('Hidden card');
 });
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
  for(const card of catalog.cards){const html=renderToStaticMarkup(<AshenCardFrame card={card}/>);expect(html).toContain('rules-expanded');expect(html).toContain(card.type==='Unit'||card.type==='Command Station'?'viewBox="0 220 1060 580"':'inner-frame-statless.svg');}
 });
 it('keeps stat rings only for units and stations, moving station HP out of the rules',()=>{
  for(const type of ['Relic','Rune','Tactic','Strategy','Ley Font']){
   const html=renderToStaticMarkup(<AshenCardFrame card={{name:'Test',type,attack:4,defense:5,effectText:'An effect.'}}/>);
   expect(html).toContain('statless-frame');expect(html).not.toContain('class="ashen-frame-stats');expect(html).toContain('inner-frame-statless.svg');expect(html).toContain('parchment-statless.svg');expect(html).not.toContain('scale(-1 1)');
  }
  for(const card of catalog.cards.filter(c=>c.type==='Command Station')){const html=renderToStaticMarkup(<AshenCardFrame card={card}/>);expect(html).toContain('<strong>HP 20</strong>');expect(html).not.toContain('HP: 20');expect(html).not.toContain('>STATION<');}
  expect(renderToStaticMarkup(<AshenCardFrame card={{name:'Unit',type:'Unit',attack:2,defense:3}}/>)).toContain('<strong>A2 / D3</strong>');
 });
 it('separates keywords and effects while leaving reminders and ability prose normal',()=>{
  const html=renderToStaticMarkup(<AshenRules text={'Charge, Soar (Reminder text.)\nWhen this enters, draw a card.'}/>);
  expect(html).toContain('ashen-keyword-block has-effect');expect(html).toContain('<strong>Charge</strong>');expect(html).toContain('<strong>Soar</strong>');expect(html).toContain('ashen-ability-block');expect(html).not.toContain('<strong>When');expect(html).not.toContain('<strong>Reminder');
 });
});
