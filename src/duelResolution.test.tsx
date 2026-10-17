import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {shouldAutoResolve} from './duelResolution';
import {graveyardMoves,ZorcDieRoll} from './DuelEffectAnimations';
import {RandomDiscardPicker} from './DuelField';
import {GameService} from './services/GameService';
import {createDuel} from './engine/model';
import {dispatchDuel,legalActions} from './engine/rules';
import type {Card,Deck} from './core/types';
const cards:Card[]=[{id:44763025,name:'Delinquent Duo',type:'Spell Card',desc:''},{id:97642679,name:'Dark Master - Zorc',type:'Ritual Effect Monster',level:8,atk:2700,def:1500,desc:''},{id:1,name:'Hidden hand monster',type:'Normal Monster',level:4,atk:1800,def:1000,desc:''},{id:5318639,name:'Mystical Space Typhoon',type:'Spell Card',desc:''}];
const ctx={cards:new Map(cards.map(c=>[c.id,c]))},deck=(ids:number[]):Deck=>({id:'test',name:'test',main:ids,extra:[],side:[]});
function duoService(count=40){const service=new GameService(),id=service.createGoatSession([deck(Array(40).fill(44763025)),deck(Array(count).fill(1))],cards,19,0,'fixture');service.dispatch(id,{type:'DRAW_PHASE',seat:0});service.advancePhase(id,'MAIN_1');return {service,id};}
function resolveDuo(service:GameService,id:string){service.dispatch(id,service.getLegalActions(id,0).find(a=>a.type==='ACTIVATE_DECK_EFFECT')!);return service.resolveEffect(id);}
describe('visible effect checkpoints',()=>{
 it('Duo pauses before the first discard, hides all identities, validates the selected slot, and resumes through the second choice',()=>{
  const {service,id}=duoService(),before=service.getState(id).players[1].hand;let s=resolveDuo(service,id);const checkpoint=service.getHistory(id).actions.length;
  expect(s.players[1].hand).toEqual(before);expect(s.pendingRandomDiscard?.order.slice().sort()).toEqual(before.slice().sort());expect(s.pendingDiscard).toBeUndefined();
  expect(()=>service.dispatch(id,{type:'CHOOSE_RANDOM_DISCARD',seat:0,index:0})).toThrow();expect(()=>service.dispatch(id,{type:'CHOOSE_RANDOM_DISCARD',seat:1,index:99})).toThrow();
  const picked=s.pendingRandomDiscard!.order[2];s=service.dispatch(id,{type:'CHOOSE_RANDOM_DISCARD',seat:1,index:2});expect(s.players[1].graveyard).toContain(picked);expect(s.pendingDiscard).toMatchObject({controller:1,count:1});expect(service.verifyReplay(id).matches).toBe(true);
  expect(()=>service.dispatch(id,{type:'CHOOSE_RANDOM_DISCARD',seat:1,index:2})).toThrow();s=service.dispatch(id,service.getLegalActions(id,1).find(a=>a.type==='CHOOSE_DISCARD')!);expect(s.players[1].hand).toHaveLength(3);expect(s.pendingDiscard).toBeUndefined();expect(service.verifyReplay(id).matches).toBe(true);
  s=service.rewind(id,checkpoint);expect(s.pendingRandomDiscard?.order[2]).toBe(picked);
 });
 it('Duo with only one opposing card finishes after the face-down pick',()=>{const {service,id}=duoService(1);resolveDuo(service,id);const s=service.dispatch(id,{type:'CHOOSE_RANDOM_DISCARD',seat:1,index:0});expect(s.players[1].hand).toEqual([]);expect(s.pendingDiscard).toBeUndefined();expect(s.pendingRandomDiscard).toBeUndefined();expect(s.chain).toEqual([]);expect(s.players[0].graveyard.some(x=>s.cards[x].cardId===44763025)).toBe(true);expect(service.verifyReplay(id).matches).toBe(true);});
 it('the random-discard screen exposes card positions, never the shuffled identities',()=>{const html=renderToStaticMarkup(<RandomDiscardPicker count={5} player={2} onPick={()=>{}}/>);expect(html).toContain('Choose face-down card 5');expect(html).not.toContain('Hidden hand monster');expect(html).toContain('Delinquent Duo random discard');});
 it('Zorc records a replayable result but leaves every monster untouched until the die completion action',()=>{
  const s=createDuel(deck(Array(40).fill(97642679)),deck(Array(40).fill(1)),ctx,19);s.turn=2;s.phase='MAIN_1';s.pendingDraw=false;
  for(const seat of [0,1] as const){const id=s.players[seat].hand.shift()!;Object.assign(s.cards[id],{location:'monster',zone:0,position:'attack',faceDown:false});s.players[seat].zones.monster[0]=id;}
  let next=dispatchDuel(s,legalActions(s,ctx,0).find(a=>a.type==='ACTIVATE_DECK_EFFECT')!,ctx);next=dispatchDuel(next,{type:'PASS_CHAIN',seat:1},ctx);next=dispatchDuel(next,{type:'PASS_CHAIN',seat:0},ctx);
  expect(next.pendingRoll?.result).toBeGreaterThanOrEqual(1);expect(next.pendingRoll?.result).toBeLessThanOrEqual(6);expect(next.players.map(p=>p.zones.monster[0])).toEqual(s.players.map(p=>p.zones.monster[0]));expect(legalActions(next,ctx,0).map(a=>a.type)).toEqual(['COMPLETE_DIE_ROLL']);
  const result=next.pendingRoll!.result,completed=dispatchDuel(next,{type:'COMPLETE_DIE_ROLL',seat:0},ctx);expect(completed.pendingRoll).toBeUndefined();expect(completed.events.some(e=>e.type==='DIE_RESULT'&&e.message.includes(String(result)))).toBe(true);expect(dispatchDuel(structuredClone(next),{type:'COMPLETE_DIE_ROLL',seat:0},ctx)).toEqual(completed);
 });
 it('renders all six physical die faces with the correct pips',()=>{const html=renderToStaticMarkup(<ZorcDieRoll result={6}/>);expect((html.match(/class="pip"/g)||[])).toHaveLength(21);expect(html).toContain('face-6');expect(html).toContain('Rolling the die');});
});
describe('unopposed resolution and visible movement',()=>{
 it('skips responses for empty back rows, ignoring the Spell that is currently resolving',()=>{const {service,id}=duoService();service.dispatch(id,service.getLegalActions(id,0).find(a=>a.type==='ACTIVATE_DECK_EFFECT')!);const s=service.getState(id);expect(shouldAutoResolve(s)).toBe(true);const extra=s.players[1].hand.shift()!;s.players[1].zones.spell[1]=extra;Object.assign(s.cards[extra],{location:'spell',zone:1,faceDown:true});expect(shouldAutoResolve(s)).toBe(false);s.cards[extra].faceDown=false;expect(shouldAutoResolve(s)).toBe(false);});
 it('does not auto-pass unresolved roll, discard, or trigger choices',()=>{const {service,id}=duoService();service.dispatch(id,service.getLegalActions(id,0).find(a=>a.type==='ACTIVATE_DECK_EFFECT')!);const s=service.getState(id);s.pendingRoll={sourceId:s.chain[0].instanceId,controller:0,result:1};expect(shouldAutoResolve(s)).toBe(false);s.pendingRoll=undefined;s.pendingRandomDiscard={sourceId:s.chain[0].instanceId,controller:1,order:s.players[1].hand};expect(shouldAutoResolve(s)).toBe(false);});
 it('animates only field-to-Graveyard moves, not hand discards, searches or undo',()=>{
  const before=createDuel(deck(Array(40).fill(1)),deck(Array(40).fill(1)),ctx,19);const [field,hand]=before.players[0].hand;before.cards[field].location='monster';const after=structuredClone(before);after.events.push({type:'RESOLVE',seat:0,turn:1,message:'destroy'});after.cards[field].location='graveyard';after.cards[hand].location='graveyard';expect(graveyardMoves(before,after)).toEqual([field]);expect(graveyardMoves(undefined,after)).toEqual([]);expect(graveyardMoves(after,before)).toEqual([]);
 });
});
