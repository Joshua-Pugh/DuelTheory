// @vitest-environment happy-dom
import {beforeEach,afterEach,it,expect,vi} from 'vitest';import {act} from 'react';import {createRoot,type Root} from 'react-dom/client';
import EnginePreview from './EnginePreview';import DuelField from './DuelField';import json from '../public/catalog.json';import {CHAOS_TURBO} from './supportedDecks';import type {Card} from './core/types';import {DEFAULT_PREFERENCES} from './preferences';import {GameService} from './services/GameService';import {createDuel} from './engine/model';import {legalActions} from './engine/rules';
vi.mock('./services/GameService',async()=>{const actual=await vi.importActual<typeof import('./services/GameService')>('./services/GameService');const {openingCoin}=await import('./duelLifecycle');const seed=Array.from({length:10000},(_,i)=>i).find(i=>openingCoin(i).firstSeat===1)!;return {...actual,freshDuelSeed:()=>seed};});
const catalog=json as Card[];let root:Root,host:HTMLDivElement;
function click(text:string){const el=Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.trim()===text);expect(el).toBeTruthy();act(()=>el!.click());}
async function tick(ms:number){await act(async()=>{await vi.advanceTimersByTimeAsync(ms);});}
beforeEach(()=>{vi.useFakeTimers();Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});vi.stubGlobal('matchMedia',vi.fn((query:string)=>({matches:query.includes('reduced-motion'),addEventListener(){},removeEventListener(){}})));host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(()=>{act(()=>root.unmount());host.remove();vi.clearAllTimers();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
it('starts the AI from the coin flip, fixes the human seat, progresses and pauses when exited',async()=>{
 const dispatch=vi.spyOn(GameService.prototype,'dispatch');act(()=>root.render(<EnginePreview initialAI deck={CHAOS_TURBO} catalog={catalog} preferences={DEFAULT_PREFERENCES} onOpenPreferences={()=>{}}/>));
 expect((document.querySelector('[aria-label="Opponent deck"]') as HTMLSelectElement).disabled).toBe(true);
 click('Start GOAT duel');await tick(1);click('Begin duel');
 expect(document.body.textContent).toContain('CHAOS TURBO AI');expect(document.body.textContent).not.toContain('PRIVATE r7');
 for(let i=0;i<6;i++)await tick(1500);
 expect(dispatch.mock.calls.some(([,action])=>action.seat===1&&action.type==='DRAW_PHASE')).toBe(true);
 expect(dispatch.mock.calls.some(([,action])=>action.seat===1&&action.type!=='DRAW_PHASE')).toBe(true);
 expect(document.querySelector('.dt-room-error')).toBeNull();click('Exit duel ✕');const count=dispatch.mock.calls.length;await tick(20000);expect(dispatch.mock.calls).toHaveLength(count);
});
it('disables AI starts for manual preferences',()=>{act(()=>root.render(<EnginePreview initialAI deck={CHAOS_TURBO} catalog={catalog} preferences={{...DEFAULT_PREFERENCES,mode:'manual'}} onOpenPreferences={()=>{}}/>));expect((Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Start GOAT duel') as HTMLButtonElement).disabled).toBe(true);expect(document.body.textContent).toContain('switch Preferences out of manual mode');});
it('does not ask the human to make the AI’s Dustshoot selection',()=>{const state=createDuel(CHAOS_TURBO,CHAOS_TURBO,{cards:new Map(catalog.map(c=>[c.id,c]))},42);const source=Object.values(state.cards).find(c=>c.owner===1&&c.cardId===64697231)!;state.pendingChaos={kind:'DUSTSHOOT',sourceId:source.instanceId,controller:1};act(()=>root.render(<DuelField aiOpponent fixedSeat={0} state={state} catalog={catalog} actions={legalActions(state,{cards:new Map(catalog.map(c=>[c.id,c]))},0)} manualMode={false} onAction={()=>{}} onManual={()=>{}} onSkipPhase={()=>{}} onUndo={()=>{}} onVerify={()=>{}} onExit={()=>{}} notice=""/>));expect(document.querySelector('[aria-label="Trap Dustshoot · opponent hand revealed"]')).toBeNull();});

it('pauses failed AI execution instead of retrying forever',async()=>{
 const dispatch=vi.spyOn(GameService.prototype,'dispatch').mockImplementation(()=>{throw Error('Injected AI failure');});
 act(()=>root.render(<EnginePreview initialAI deck={CHAOS_TURBO} catalog={catalog} preferences={DEFAULT_PREFERENCES} onOpenPreferences={()=>{}}/>));click('Start GOAT duel');await tick(1);click('Begin duel');await tick(1500);expect(document.body.textContent).toContain('AI paused after an error');const count=dispatch.mock.calls.length;await tick(20000);expect(dispatch.mock.calls).toHaveLength(count);
});
it('shows an AI search reveal and pauses until the human acknowledges it',async()=>{
 const initial=GameService.prototype.createGoatSession;
 vi.spyOn(GameService.prototype,'createGoatSession').mockImplementation(function(this:GameService,...args){const id=initial.apply(this,args);let s=this.getState(id);const source=Object.values(s.cards).find(c=>c.owner===1&&c.cardId===31786629)!;for(const p of s.players){p.hand=p.hand.filter(x=>x!==source.instanceId);p.deck=p.deck.filter(x=>x!==source.instanceId);}source.location='hand';s.players[1].hand.push(source.instanceId);s.current=1;s.phase='MAIN_1';s.pendingDraw=false;s.priority=1;return this.restoreOnline(s,catalog,false);});
 const dispatch=vi.spyOn(GameService.prototype,'dispatch');
 act(()=>root.render(<EnginePreview initialAI deck={CHAOS_TURBO} catalog={catalog} preferences={DEFAULT_PREFERENCES} onOpenPreferences={()=>{}}/>));click('Start GOAT duel');await tick(1);click('Begin duel');
 // AI activates Thunder; the human has no card to activate in response in this constructed opening.
 for(let i=0;i<12&&!document.querySelector('[aria-label="Chaos Turbo AI · revealed cards"]');i++){
  const pass=Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.includes('No response'));
  if(pass)act(()=>pass.click());await tick(1500);
 }
 expect(document.querySelector('[aria-label="Chaos Turbo AI · revealed cards"]')).toBeTruthy();const count=dispatch.mock.calls.length;await tick(10000);expect(dispatch.mock.calls).toHaveLength(count);click('Continue duel');expect(document.querySelector('[aria-label="Chaos Turbo AI · revealed cards"]')).toBeNull();
});
