import {CardPicker} from './DuelField';
import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import DuelField from './DuelField';
import {cardActionGroups,nextChoice,narrowChoice,choiceCardOrder} from './duelInteraction';
import {createDuel,type LegalAction,type EngineContext} from './engine/model';
import {GameService} from './services/GameService';
import type {Card,Deck} from './core/types';
const catalog:Card[]=[{id:1,name:'Test Monster',type:'Effect Monster',level:4,atk:1400,def:1000,desc:'Test effect.'},{id:2,name:'Test Spell',type:'Spell Card',desc:'Test spell effect.'}];
const deck:Deck={id:'test',name:'Test',main:Array.from({length:40},(_,i)=>i%2+1),side:[],extra:[]};
const ctx:EngineContext={cards:new Map(catalog.map(c=>[c.id,c]))};
describe('card-led duel interactions',()=>{
 it('collapses zone permutations and only attributes actions to the source card',()=>{
  const actions:LegalAction[]=[0,1,2,3,4].flatMap(zone=>[{type:'NORMAL_SUMMON',seat:0,instanceId:'source',zone,position:'attack',description:'summon'} as LegalAction,{type:'NORMAL_SUMMON',seat:0,instanceId:'source',zone,position:'faceDownDefense',description:'set'} as LegalAction]);
  actions.push({type:'ACTIVATE_MST',seat:0,instanceId:'spell',zone:0,targetId:'source',description:'target'});
  const groups=cardActionGroups(actions,'source');expect(groups.map(g=>g.label)).toEqual(['Normal Summon','Set monster']);expect(groups[0].options).toHaveLength(5);
 });
 it('asks for a Set destination but activates a simple Spell immediately',()=>{
  const state=createDuel(deck,deck,ctx);
  const set:LegalAction={type:'SET_SPELL_TRAP',seat:0,instanceId:'p0-1',zone:3,description:'set'};
  expect(nextChoice([set],[],state)).toMatchObject({kind:'zone',zoneKind:'spell',zones:[3]});
  expect(nextChoice([{type:'ACTIVATE_POT_OF_GREED',seat:0,instanceId:'p0-1',zone:3,description:'activate'}],[],state)).toBeUndefined();
 });
 it('shows the whole deck in current order and preserves exact instance choices',()=>{
  const state=createDuel(deck,deck,ctx,17),ids=state.players[0].deck.slice(0,2);
  const options:LegalAction[]=ids.map(searchId=>({type:'TRIGGER_SEARCH',seat:0,sourceId:'source',searchId,description:'search'}));
  const step=nextChoice(options,[],state)!;expect(choiceCardOrder(step,state)).toEqual(state.players[0].deck);expect(step.ids).toEqual(ids);
  expect(narrowChoice(options,'searchId',ids[1])).toEqual([options[1]]);
 });
 it('matches material sets independently of selection order and rejects partial combinations',()=>{
  const action:LegalAction={type:'TRIBUTE_SUMMON',seat:0,instanceId:'source',zone:0,position:'attack',materials:['a','b'],description:'tribute'};
  expect(narrowChoice([action],'materials',['b','a'])).toEqual([action]);expect(narrowChoice([action],'materials',['a'])).toEqual([]);
 });
 it('renders both Monster rows toward the center and hides the opponent hand',()=>{
  const state=createDuel(deck,deck,ctx),noop=()=>{};
  const html=renderToStaticMarkup(<DuelField state={state} catalog={catalog} actions={[]} onAction={noop} onManual={noop} manualMode={false} onSkipPhase={noop} onUndo={noop} onVerify={noop} onExit={noop} notice=""/>);
  expect(html.indexOf('Player 2 spell zones')).toBeLessThan(html.indexOf('Player 2 monster zones'));
  expect(html.indexOf('Player 1 monster zones')).toBeLessThan(html.indexOf('Player 1 spell zones'));
  const hand=html.slice(html.indexOf('aria-label="Player 2 hand"'),html.indexOf('dt-board-half'));
  expect(hand).not.toContain('Test Monster');expect(hand).not.toContain('Test Spell');expect(hand).toContain('dt-card-back');
 });
});
describe('recorded tabletop operations',()=>{
 it('searches selected copies, shuffles remaining cards, and replays and rewinds exactly',()=>{
  const service=new GameService(),id=service.createGoatSession([deck,deck],catalog,17,0,'fixture'),before=service.getState(id),chosen=before.players[0].deck.slice(4,6);
  const next=service.dispatchManual(id,{type:'MANUAL_SEARCH',seat:0,instanceIds:chosen});
  expect(next.players[0].hand).toEqual([...before.players[0].hand,...chosen]);expect(next.players[0].deck).toHaveLength(before.players[0].deck.length-2);expect(next.players[0].deck).not.toEqual(before.players[0].deck.filter(x=>!chosen.includes(x)));
  expect(service.verifyReplay(id)).toMatchObject({matches:true,rulesVerified:false});expect(service.rewind(id,0)).toEqual(before);
 });
 it('rejects foreign or repeated search choices without mutating the session',()=>{
  const service=new GameService(),id=service.createGoatSession([deck,deck],catalog,undefined,0,'fixture'),before=service.getState(id),own=before.players[0].deck[0];
  for(const ids of [[own,own],[before.players[1].deck[0]]])expect(()=>service.dispatchManual(id,{type:'MANUAL_SEARCH',seat:0,instanceIds:ids})).toThrow();
  expect(service.getState(id)).toEqual(before);
 });
 it('can activate a previously Set spell without losing its zone or duplicating cards',()=>{
  const service=new GameService(),id=service.createGoatSession([deck,deck],catalog,undefined,0,'fixture'),state=service.getState(id),card=state.players[0].hand[0];
  service.dispatchManual(id,{type:'MANUAL_MOVE_CARD',seat:0,instanceId:card,destination:'spell',zone:2});
  const next=service.dispatchManual(id,{type:'MANUAL_MOVE_CARD',seat:0,instanceId:card,destination:'spell',zone:2,faceDown:false});
  expect(next.cards[card]).toMatchObject({location:'spell',zone:2,faceDown:false});expect(next.players[0].zones.spell.filter(x=>x===card)).toHaveLength(1);expect(service.verifyReplay(id).matches).toBe(true);
 });
});

it('shows ineligible search cards with artwork while keeping them unselectable',()=>{const cards:Record<string,Card>={yes:{id:1,name:'Legal monster',type:'Effect Monster',desc:'',image:'/yes.jpg'},no:{id:2,name:'Visible spell',type:'Spell Card',desc:'',image:'/no.jpg'}};const html=renderToStaticMarkup(<CardPicker title="Search your deck" ids={['yes','no']} eligible={['yes']} multiple={false} deck deckOrderKnown={false} lookup={id=>cards[id]} onConfirm={()=>{}} onClose={()=>{}}/>);expect(html).toContain('/no.jpg');expect(html).toMatch(/class="ineligible" disabled/);expect(html).toContain('Display order is not draw order');expect(html).toContain('class="eligible"');});
