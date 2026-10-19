import {describe,it,expect,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {createDuel,type DuelState} from './model';
import {dispatchDuel,legalActions,GRACEFUL_CHARITY,POT_OF_GREED,MANJU,MYSTICAL_SPACE_TYPHOON} from './rules';
import {GameService} from '../services/GameService';
import {auditDuelState} from '../services/duelAudit';
import {nextChoice,narrowChoice,choiceCardOrder} from '../duelInteraction';
import {drawnInstances} from '../DrawAnimations';
import DuelField from '../DuelField';
import type {Card,Deck} from '../core/types';
const catalog:Card[]=[{id:1,name:'Attacker',type:'Normal Monster',level:4,atk:1800,def:1000,desc:''},{id:GRACEFUL_CHARITY,name:'Graceful Charity',type:'Spell Card',desc:'Draw 3 cards, then discard 2 cards.'},{id:POT_OF_GREED,name:'Pot of Greed',type:'Spell Card',desc:'Draw 2 cards.'},{id:MANJU,name:'Manju',type:'Effect Monster',level:4,atk:1400,def:1000,desc:''},{id:2,name:'Ritual',type:'Ritual Monster',level:8,atk:3000,def:2000,desc:''},{id:MYSTICAL_SPACE_TYPHOON,name:'MST',type:'Spell Card',desc:''}];
const ctx={cards:new Map(catalog.map(c=>[c.id,c]))};
const deck=(ids:number[]):Deck=>({id:'test',name:'test',main:ids,extra:[],side:[]});
const a=deck([GRACEFUL_CHARITY,POT_OF_GREED,MANJU,2,MYSTICAL_SPACE_TYPHOON,...Array(35).fill(1)]),b=deck(Array(40).fill(1));
function hand(s:DuelState,cardId:number,seat:0|1=0){const id=Object.keys(s.cards).find(id=>s.cards[id].owner===seat&&s.cards[id].cardId===cardId)!;if(s.cards[id].location==='deck'){s.players[seat].deck.splice(s.players[seat].deck.indexOf(id),1);s.players[seat].hand.push(id);s.cards[id].location='hand';}return id;}
function main(){let s=createDuel(a,b,ctx,23);s=dispatchDuel(s,{type:'DRAW_PHASE',seat:0},ctx);s=dispatchDuel(s,{type:'ADVANCE',seat:0},ctx);return dispatchDuel(s,{type:'ADVANCE',seat:0},ctx);}
function finish(s:DuelState){s=dispatchDuel(s,{type:'PASS_CHAIN',seat:s.priority},ctx);return dispatchDuel(s,{type:'PASS_CHAIN',seat:s.priority},ctx);}
function activate(s:DuelState,type:'ACTIVATE_GRACEFUL_CHARITY'|'ACTIVATE_POT_OF_GREED'){return dispatchDuel(s,legalActions(s,ctx,0).find(a=>a.type===type)!,ctx);}
describe('draw effect resolution',()=>{
 it('draws three before asking for exactly two discards and cleans up the Spell afterward',()=>{
  let s=main();const source=hand(s,GRACEFUL_CHARITY),before=s.players[0].hand.length,top=s.players[0].deck.slice(0,3);
  s=activate(s,'ACTIVATE_GRACEFUL_CHARITY');expect(s.players[0].hand).toHaveLength(before-1);
  s=finish(s);expect(s.players[0].hand).toHaveLength(before+2);expect(s.pendingDiscard).toMatchObject({sourceId:source,count:2});expect(top.every(id=>s.players[0].hand.includes(id))).toBe(true);
  expect(legalActions(s,ctx,1)).toEqual([]);expect(legalActions(s,ctx,0).every(a=>a.type==='CHOOSE_DISCARD')).toBe(true);
  expect(()=>dispatchDuel(s,{type:'CHOOSE_DISCARD',seat:0,discardIds:[top[0],top[0]]},ctx)).toThrow();
  const options=legalActions(s,ctx,0),step=nextChoice(options,[],s)!;expect(step.field).toBe('discardIds');expect(choiceCardOrder(step,s)).toEqual(step.ids);
  const choice=narrowChoice(options,'discardIds',[top[1],top[0]])[0];s=dispatchDuel(s,choice,ctx);
  expect(s.pendingDiscard).toBeUndefined();expect(s.players[0].hand).toHaveLength(before);expect(s.players[0].graveyard).toEqual(expect.arrayContaining([source,top[0],top[1]]));expect(auditDuelState(s)).toEqual([]);
 });
 it('resumes lower chain links only after the mandatory discard choice',()=>{
  let s=main();hand(s,GRACEFUL_CHARITY);const pot=hand(s,POT_OF_GREED);s=activate(s,'ACTIVATE_GRACEFUL_CHARITY');
  s.chain.unshift({instanceId:pot,controller:0,effectId:'DRAW_2',targets:[],spellSpeed:1});
  s=finish(s);expect(s.pendingDiscard).toBeDefined();expect(s.chain).toHaveLength(1);const before=s.players[0].hand.length;
  s=dispatchDuel(s,legalActions(s,ctx,0)[0],ctx);expect(s.chain).toHaveLength(0);expect(s.players[0].hand.length).toBe(before);expect(s.pendingDiscard).toBeUndefined();
 });
 it('finishes on deck-out without demanding an impossible discard',()=>{
  let s=main();hand(s,GRACEFUL_CHARITY);for(const id of s.players[0].deck.splice(2)){s.players[0].graveyard.push(id);s.cards[id].location='graveyard';}
  s=finish(activate(s,'ACTIVATE_GRACEFUL_CHARITY'));expect(s.winner).toBe(1);expect(s.pendingDiscard).toBeUndefined();expect(auditDuelState(s)).toEqual([]);
 });
 it('activates a previously Set Pot and automatically draws two',()=>{
  let s=main();const id=hand(s,POT_OF_GREED);s=dispatchDuel(s,{type:'SET_SPELL_TRAP',seat:0,instanceId:id,zone:3},ctx);const before=s.players[0].hand.length;
  s=finish(activate(s,'ACTIVATE_POT_OF_GREED'));expect(s.players[0].hand).toHaveLength(before+2);expect(s.players[0].graveyard).toContain(id);
 });
});
describe('turn progression and response authority',()=>{
 function service(){const service=new GameService(),id=service.createGoatSession([b,b],catalog,17,0,'fixture');service.dispatch(id,{type:'DRAW_PHASE',seat:0});service.advancePhase(id,'MAIN_1');return {service,id};}
 it('EP completes the turn and assigns the next Draw Phase to the opponent',()=>{const {service:s,id}=service();const n=s.advancePhase(id,'END');expect(n).toMatchObject({turn:2,current:1,phase:'DRAW',pendingDraw:true});expect(s.getLegalActions(id,1).map(a=>a.type)).toEqual(['DRAW_PHASE']);expect(s.verifyReplay(id).matches).toBe(true);});
 it('Next from Main 2 finishes End Phase and does not end two turns',()=>{const {service:s,id}=service();s.advancePhase(id,'MAIN_2');expect(s.advancePhase(id,'NEXT')).toMatchObject({turn:2,current:1,phase:'DRAW'});});
 it('skips opening-turn battle with Next and rejects backward phase shortcuts',()=>{const {service:s,id}=service();expect(s.advancePhase(id,'NEXT').phase).toBe('MAIN_2');expect(()=>s.advancePhase(id,'MAIN_1')).toThrow();expect(()=>s.advancePhase(id,'BATTLE')).toThrow();});
 it('replays and rewinds a paused Graceful resolution exactly',()=>{
  const d=deck(Array(40).fill(GRACEFUL_CHARITY)),s=new GameService(),id=s.createGoatSession([d,b],catalog,17,0,'fixture');s.dispatch(id,{type:'DRAW_PHASE',seat:0});s.advancePhase(id,'MAIN_1');s.dispatch(id,s.getLegalActions(id,0).find(a=>a.type==='ACTIVATE_GRACEFUL_CHARITY')!);
  const paused=s.resolveEffect(id),checkpoint=s.getHistory(id).actions.length;expect(paused.pendingDiscard?.count).toBe(2);expect(s.verifyReplay(id)).toMatchObject({matches:true,rulesVerified:true});
  expect(()=>s.dispatchManual(id,{type:'MANUAL_DRAW',seat:0})).toThrow();expect(()=>s.advancePhase(id,'END')).toThrow();
  s.dispatch(id,s.getLegalActions(id,0)[0]);expect(s.verifyReplay(id).matches).toBe(true);expect(s.rewind(id,checkpoint)).toEqual(paused);
 });
 it('does not automatically pass a player with a legal response card',()=>{
  const spells=deck([...Array(20).fill(POT_OF_GREED),...Array(20).fill(MYSTICAL_SPACE_TYPHOON)]),s=new GameService(),id=s.createGoatSession([spells,spells],catalog,17,0,'fixture');
  const state=s.getState(id);for(const cardId of [MYSTICAL_SPACE_TYPHOON,POT_OF_GREED]){const card=Object.keys(state.cards).find(x=>state.cards[x].owner===0&&state.cards[x].cardId===cardId)!;if(state.cards[card].location!=='hand')s.dispatchManual(id,{type:'MANUAL_MOVE_CARD',seat:0,instanceId:card,destination:'hand'});}
  s.dispatch(id,{type:'DRAW_PHASE',seat:0});s.advancePhase(id,'MAIN_1');s.dispatch(id,s.getLegalActions(id,0).find(a=>a.type==='ACTIVATE_POT_OF_GREED')!);
  // P2 passes; P1 still has an eligible Quick-Play response from hand, which must not be skipped.
  const next=s.resolveEffect(id);expect(next.chain).toHaveLength(1);expect(next.priority).toBe(0);expect(s.getLegalActions(id,0).some(a=>a.type==='ACTIVATE_MST')).toBe(true);expect(s.verifyReplay(id).matches).toBe(true);
 });
 it('allows the opponent to attack on Turn 2 and apply damage',()=>{
  const {service:s,id}=service();s.advancePhase(id,'END');s.dispatch(id,{type:'DRAW_PHASE',seat:1});s.advancePhase(id,'MAIN_1');const summon=s.getLegalActions(id,1).find(a=>a.type==='NORMAL_SUMMON'&&a.position==='attack')!;s.dispatch(id,summon);s.advancePhase(id,'BATTLE');
  const attack=s.getLegalActions(id,1).find(a=>a.type==='DECLARE_ATTACK')!;expect(attack).toBeDefined();s.dispatch(id,attack);s.dispatch(id,{type:'PASS_ATTACK_RESPONSE',seat:0});
  for(let i=0;i<8&&s.getState(id).pendingAttack;i++){const step=s.getLegalActions(id,1).find(a=>a.type==='ADVANCE_DAMAGE_STEP');if(step)s.dispatch(id,step);}
  expect(s.getState(id).players[0].lp).toBe(6200);expect(s.getState(id).pendingAttack).toBeUndefined();expect(s.verifyReplay(id).matches).toBe(true);
 });
 it('blocks opening-turn attacks and phase changes during pending effects',()=>{let s=main();const id=hand(s,1);s=dispatchDuel(s,{type:'NORMAL_SUMMON',seat:0,instanceId:id,zone:0,position:'attack'},ctx);s.phase='BATTLE';expect(legalActions(s,ctx,0).some(a=>a.type==='DECLARE_ATTACK')).toBe(false);});
 it('uses fresh random seeds by default while explicit seeds remain reproducible',()=>{
  const spy=vi.spyOn(globalThis.crypto,'getRandomValues').mockReturnValueOnce(new Uint32Array([17])).mockReturnValueOnce(new Uint32Array([18]));
  try{const s=new GameService(),x=s.createGoatSession([b,b],catalog,undefined,0,'fixture'),y=s.createGoatSession([b,b],catalog,undefined,0,'fixture');expect(s.getState(x).seed).toBe(17);expect(s.getState(y).seed).toBe(18);expect(s.getState(x).players[0].hand).not.toEqual(s.getState(y).players[0].hand);const z=s.createGoatSession([b,b],catalog,17,0,'fixture');expect(s.getState(z).players[0].hand).toEqual(s.getState(x).players[0].hand);}finally{spy.mockRestore();}
 });
});
describe('field presentation',()=>{
 it('puts effect choices on the board and phase controls outside the inspector',()=>{
  let s=main();hand(s,MANJU);const summon=legalActions(s,ctx,0).find(a=>a.type==='NORMAL_SUMMON'&&s.cards[a.instanceId].cardId===MANJU&&a.position==='attack')!;s=dispatchDuel(s,summon,ctx);const noop=()=>{};
  const html=renderToStaticMarkup(<DuelField state={s} catalog={catalog} actions={legalActions(s,ctx,0)} onAction={noop} onManual={noop} manualMode={false} onSkipPhase={noop} onUndo={noop} onVerify={noop} onExit={noop} notice=""/>);
  expect(html).toContain('aria-label="Effect decision"');expect(html).toContain('Yes · use effect');const sidebar=html.slice(html.indexOf('<aside'),html.indexOf('</aside>'));expect(sidebar).not.toContain('Next phase →');expect(html.indexOf('Next phase →')).toBeLessThan(html.indexOf('<aside'));
 });
 it('animates opening deals and draws and deck searches, but not rewinds',()=>{
  let s=createDuel(a,b,ctx,23);expect(drawnInstances(undefined,s)).toHaveLength(10);let next=dispatchDuel(s,{type:'DRAW_PHASE',seat:0},ctx);expect(drawnInstances(s,next)).toHaveLength(1);next.turn=2;next.pendingDraw=true;next.phase='DRAW';const drawn=dispatchDuel(next,{type:'DRAW_PHASE',seat:0},ctx);expect(drawnInstances(next,drawn)).toHaveLength(1);
  const search=structuredClone(next),id=search.players[0].deck.shift()!;search.players[0].hand.push(id);search.cards[id].location='hand';search.events.push({type:'SEARCH',seat:0,turn:1,message:'search'});expect(drawnInstances(next,search)).toHaveLength(1);expect(drawnInstances(next,s)).toHaveLength(0);
 });
});
