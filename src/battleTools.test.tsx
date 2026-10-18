import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import DuelField from './DuelField';
import {directAttackQueue,quickAttacks} from './battleShortcuts';
import {GameService} from './services/GameService';
import type {Card,Deck} from './core/types';
import type {LegalAction} from './engine/model';
const breaker:Card={id:71413901,name:'Breaker the Magical Warrior',type:'Effect Monster',level:4,atk:1600,def:1000,desc:'Spell Counter.'};
const deck:Deck={id:'tools',name:'Tools',main:Array(40).fill(breaker.id),side:[],extra:[]};
function setup(){const svc=new GameService(),id=svc.createGoatSession([deck,deck],[breaker],11,0,'fixture');return {svc,id,card:svc.getState(id).players[0].hand[0]};}
describe('tabletop counter and die tools',()=>{
 it('adds/removes visible counters, preserves face-up position changes, clears on leaving, and replays overrides',()=>{
  const {svc,id,card}=setup();
  svc.dispatchManual(id,{type:'MANUAL_MOVE_CARD',seat:0,instanceId:card,destination:'monster',zone:0,position:'attack'});
  svc.dispatchManual(id,{type:'MANUAL_COUNTER',seat:0,instanceId:card,delta:1});
  let state=svc.getState(id);expect(state.cards[card].spellCounters).toBe(1);
  const html=renderToStaticMarkup(<DuelField state={state} catalog={[breaker]} actions={[]} onAction={()=>{}} onManual={()=>{}} manualMode onSkipPhase={()=>{}} onUndo={()=>{}} onVerify={()=>{}} onExit={()=>{}} notice=""/>);
  expect(html).toContain('1 Spell Counter');expect(html).toContain('Place a counter');expect(html).toContain('Roll tabletop die');expect(state.events.at(-1)?.message).toContain('Possible illegal move');
  svc.dispatchManual(id,{type:'MANUAL_MOVE_CARD',seat:0,instanceId:card,destination:'monster',zone:0,position:'faceUpDefense'});
  expect(svc.getState(id).cards[card].spellCounters).toBe(1);
  svc.dispatchManual(id,{type:'MANUAL_COUNTER',seat:0,instanceId:card,delta:-1});
  expect(()=>svc.dispatchManual(id,{type:'MANUAL_COUNTER',seat:0,instanceId:card,delta:-1})).toThrow();
  svc.dispatchManual(id,{type:'MANUAL_COUNTER',seat:0,instanceId:card,delta:1});
  svc.dispatchManual(id,{type:'MANUAL_MOVE_CARD',seat:0,instanceId:card,destination:'graveyard'});
  expect(svc.getState(id).cards[card].spellCounters).toBe(0);expect(svc.verifyReplay(id)).toMatchObject({matches:true,rulesVerified:false});
 });
 it('rejects hidden, non-field and opposing counter targets',()=>{
  const {svc,id,card}=setup();expect(()=>svc.dispatchManual(id,{type:'MANUAL_COUNTER',seat:0,instanceId:card,delta:1})).toThrow();
  svc.dispatchManual(id,{type:'MANUAL_MOVE_CARD',seat:0,instanceId:card,destination:'monster',zone:0,position:'faceDownDefense'});
  expect(()=>svc.dispatchManual(id,{type:'MANUAL_COUNTER',seat:0,instanceId:card,delta:1})).toThrow();
  svc.dispatchManual(id,{type:'MANUAL_MOVE_CARD',seat:0,instanceId:card,destination:'monster',zone:0,position:'attack'});
  expect(()=>svc.dispatchManual(id,{type:'MANUAL_COUNTER',seat:1,instanceId:card,delta:1})).toThrow();
 });
 it('records die rolls without applying effects and reproduces each result after Undo',()=>{
  const {svc,id}=setup(),before=svc.getState(id);
  const rolled=svc.dispatchManual(id,{type:'MANUAL_ROLL_DIE',seat:0});
  expect(rolled.events.at(-1)?.message).toMatch(/rolled [1-6]/);expect(rolled.players).toEqual(before.players);expect(rolled.pendingRoll).toBeUndefined();
  svc.rewind(id,0);expect(svc.dispatchManual(id,{type:'MANUAL_ROLL_DIE',seat:0})).toEqual(rolled);expect(svc.verifyReplay(id).matches).toBe(true);
 });
 it('asks specifically for Breaker counter placement',()=>{
  const {svc,id,card}=setup();svc.dispatch(id,{type:'DRAW_PHASE',seat:0});svc.advancePhase(id,'MAIN_1');
  svc.dispatch(id,{type:'NORMAL_SUMMON',seat:0,instanceId:card,zone:0,position:'attack'});
  const state=svc.getState(id),actions=svc.getLegalActions(id,0);
  const html=renderToStaticMarkup(<DuelField state={state} catalog={[breaker]} actions={actions} onAction={()=>{}} onManual={()=>{}} manualMode={false} onSkipPhase={()=>{}} onUndo={()=>{}} onVerify={()=>{}} onExit={()=>{}} notice=""/>);
  expect(html).toContain('Breaker must gain its Spell Counter');expect(html).toContain('Resolve required effect');expect(html).not.toContain('No · skip effect');
 });
});
describe('legal battle shortcuts',()=>{
 it('only queues legal direct attackers and stops when a defender exists or phase changes',()=>{
  const {svc,id}=setup(),state=svc.getState(id);state.turn=3;state.phase='BATTLE';
  const actions:LegalAction[]=[{type:'DECLARE_ATTACK',seat:0,attackerId:'a',description:'direct'},{type:'DECLARE_ATTACK',seat:0,attackerId:'a',description:'duplicate'},{type:'DECLARE_ATTACK',seat:0,attackerId:'b',description:'direct'},{type:'DECLARE_ATTACK',seat:1,attackerId:'enemy',description:'enemy'}];
  expect(directAttackQueue(state,actions,0)).toEqual(['a','b']);expect(quickAttacks(actions,0,'b')).toHaveLength(1);
  state.players[1].zones.monster[0]='defender';expect(directAttackQueue(state,actions,0)).toEqual([]);
  state.players[1].zones.monster[0]=null;state.phase='MAIN_2';expect(directAttackQueue(state,actions,0)).toEqual([]);
 });
});

it('offers Attack with all for the fixed online seat when a callback is supplied',()=>{const {svc,id,card}=setup();svc.dispatchManual(id,{type:'MANUAL_MOVE_CARD',seat:0,instanceId:card,destination:'monster',zone:0,position:'attack'});const state=svc.getState(id);state.turn=3;state.phase='BATTLE';state.pendingDraw=false;const actions:LegalAction[]=[{type:'DECLARE_ATTACK',seat:0,attackerId:card,description:'direct'}];const html=renderToStaticMarkup(<DuelField fixedSeat={0} state={state} catalog={[breaker]} actions={actions} onAttackAll={()=>{}} onAction={()=>{}} onManual={()=>{}} manualMode={false} onSkipPhase={()=>{}} onUndo={()=>{}} onVerify={()=>{}} onExit={()=>{}} notice=""/>);expect(html).toContain('Attack with all');expect(html).toContain('Current ATK 1600, DEF 1000');});
