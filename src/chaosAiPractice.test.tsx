import {GameLogWriter,GAME_LOG_SETTING} from './ai/gameLogs';
import {DISPLAY_NAME_KEY} from './playerProfile';
import {loadLearning,LEARNING_KEY} from './ai/learning';
// @vitest-environment happy-dom
import {beforeEach,afterEach,it,expect,vi} from 'vitest';import {act} from 'react';import {createRoot,type Root} from 'react-dom/client';
import {loadPracticeRecords,PRACTICE_RECORD_KEY} from './ai/practiceMatch';import EnginePreview from './EnginePreview';import DuelField from './DuelField';import json from '../public/catalog.json';import {CHAOS_TURBO} from './supportedDecks';import type {Card} from './core/types';import {DEFAULT_PREFERENCES} from './preferences';import {GameService} from './services/GameService';import {createDuel} from './engine/model';import {legalActions,dispatchDuel} from './engine/rules';
vi.mock('./services/GameService',async()=>{const actual=await vi.importActual<typeof import('./services/GameService')>('./services/GameService');const {openingCoin}=await import('./duelLifecycle');const seed=Array.from({length:10000},(_,i)=>i).find(i=>openingCoin(i).firstSeat===1)!;return {...actual,freshDuelSeed:()=>seed};});
const catalog=json as Card[];let root:Root,host:HTMLDivElement;
function click(text:string){const el=Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.trim()===text);expect(el).toBeTruthy();act(()=>el!.click());}
async function tick(ms:number){await act(async()=>{await vi.advanceTimersByTimeAsync(ms);});}
beforeEach(()=>{window.localStorage.clear();vi.useFakeTimers();Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});vi.stubGlobal('matchMedia',vi.fn((query:string)=>({matches:query.includes('reduced-motion'),addEventListener(){},removeEventListener(){}})));host=document.createElement('div');document.body.append(host);root=createRoot(host);});
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

function bestThree(){const select=document.querySelector('[aria-label="AI match format"]') as HTMLSelectElement;act(()=>{select.value='best3';select.dispatchEvent(new Event('change',{bubbles:true}));});}
it('plays a best-of-three with player-only swaps, loser choices and a persistent match result',async()=>{
 const initial=GameService.prototype.createGoatSession;let game=0;
 const create=vi.spyOn(GameService.prototype,'createGoatSession').mockImplementation(function(this:GameService,...args){const id=initial.apply(this,args),s=this.getState(id);s.pendingDraw=false;s.winner=([1,0,1] as const)[game++];return this.restoreOnline(s,catalog,false);});
 act(()=>root.render(<EnginePreview initialAI deck={CHAOS_TURBO} catalog={catalog} preferences={DEFAULT_PREFERENCES} onOpenPreferences={()=>{}}/>));bestThree();click('Start GOAT duel');await tick(1);click('Begin duel');
 expect(document.querySelector('[aria-label="Between games · player sideboarding"]')).toBeTruthy();
 const main=document.querySelector('[aria-label="Player Main Deck"] button') as HTMLButtonElement;act(()=>main.click());
 expect((Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Ready for next game') as HTMLButtonElement).disabled).toBe(true);
 const side=document.querySelector('[aria-label="Player Side Deck"] button') as HTMLButtonElement;act(()=>side.click());
 const first=document.querySelector('input[name="ai-first"]') as HTMLInputElement;act(()=>first.click());click('Ready for next game');
 expect(document.body.textContent).toContain('The AI lost and chooses to go first');
 expect(create.mock.calls[1][0][0]).not.toEqual(CHAOS_TURBO);expect(create.mock.calls[1][0][1]).toEqual(CHAOS_TURBO);expect(create.mock.calls[1][3]).toBe(0);
 click('Ready for next game');expect(create.mock.calls[2][3]).toBe(1);expect(create.mock.calls.every(c=>JSON.stringify(c[0][1])===JSON.stringify(CHAOS_TURBO))).toBe(true);
 expect(document.querySelector('[aria-label="AI match complete"]')).toBeTruthy();expect(create).toHaveBeenCalledTimes(3);
 const saved=loadPracticeRecords(window.localStorage);expect(saved).toHaveLength(1);expect(saved[0].wins).toEqual([1,2]);expect(saved[0].games).toHaveLength(3);expect(saved[0].games[1].deck).toEqual(create.mock.calls[1][0][0]);
 click('Return to AI setup');expect(document.body.textContent).toContain('0–1–0');
 act(()=>root.unmount());root=createRoot(host);act(()=>root.render(<EnginePreview initialAI deck={CHAOS_TURBO} catalog={catalog} preferences={DEFAULT_PREFERENCES} onOpenPreferences={()=>{}}/>));expect(document.body.textContent).toContain('0–1–0');expect(loadPracticeRecords(window.localStorage)).toHaveLength(1);
});
it('requires confirmation before leaving and records a match loss only after yes',async()=>{
 act(()=>root.render(<EnginePreview initialAI deck={CHAOS_TURBO} catalog={catalog} preferences={DEFAULT_PREFERENCES} onOpenPreferences={()=>{}}/>));bestThree();click('Start GOAT duel');await tick(1);click('Begin duel');click('Exit duel ✕');expect(loadPracticeRecords(window.localStorage)).toEqual([]);click('Cancel');expect(document.querySelector('[aria-label="GOAT duel room"]')).toBeTruthy();click('Exit duel ✕');click('Yes · concede match');expect(loadPracticeRecords(window.localStorage)[0]).toMatchObject({winner:1,forfeited:true,wins:[0,0]});
});
it('does not start a manual AI match even with best-of-three selected',()=>{act(()=>root.render(<EnginePreview initialAI deck={CHAOS_TURBO} catalog={catalog} preferences={{...DEFAULT_PREFERENCES,mode:'manual'}} onOpenPreferences={()=>{}}/>));bestThree();expect((Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Start GOAT duel') as HTMLButtonElement).disabled).toBe(true);expect(window.localStorage.getItem(PRACTICE_RECORD_KEY)).toBeNull();});

it('renders Zaborg target selection after tributing a Premature-revived Breaker',()=>{
 const ctx={cards:new Map(catalog.map(c=>[c.id,c]))};const deck={...CHAOS_TURBO,main:[...CHAOS_TURBO.main,70828912,51945556]};let state=createDuel(deck,deck,ctx,42);state.turn=3;state.phase='MAIN_1';state.pendingDraw=false;state.current=0;state.priority=0;
 const move=(cardId:number,owner:0|1,location:'hand'|'graveyard'|'monster')=>{const c=Object.values(state.cards).find(c=>c.cardId===cardId&&c.owner===owner)!;const p=state.players[owner];p.deck=p.deck.filter(id=>id!==c.instanceId);p.hand=p.hand.filter(id=>id!==c.instanceId);c.location=location;if(location==='monster'){c.zone=0;c.position='attack';p.zones.monster[0]=c.instanceId;}else p[location].push(c.instanceId);return c.instanceId;};
 const premature=move(70828912,0,'hand'),breaker=move(71413901,0,'graveyard'),zaborg=move(51945556,0,'hand');move(9596126,1,'monster');
 const dispatch=(predicate:(a:ReturnType<typeof legalActions>[number])=>boolean)=>{const a=[...legalActions(state,ctx,0),...legalActions(state,ctx,1)].find(predicate);expect(a).toBeDefined();state=dispatchDuel(state,a!,ctx);};
 dispatch(a=>a.type==='ACTIVATE_DECK_EFFECT'&&a.instanceId===premature&&a.effectId==='PREMATURE'&&a.targetId===breaker);
 for(let i=0;state.chain.length&&i<10;i++)dispatch(a=>a.type==='PASS_CHAIN');
 if(state.summonResponse){for(let i=0;state.summonResponse&&i<3;i++)dispatch(a=>a.type==='PASS_SUMMON_RESPONSE');}
 const render=()=>root.render(<DuelField fixedSeat={0} state={state} catalog={catalog} actions={legalActions(state,ctx,0)} manualMode={false} onAction={a=>{state=dispatchDuel(state,a,ctx);render();}} onManual={()=>{}} onSkipPhase={()=>{}} onUndo={()=>{}} onVerify={()=>{}} onExit={()=>{}} notice=""/>);
 act(()=>render());
 act(()=>(document.querySelector(`.dt-field-hand [data-instance="${zaborg}"]`) as HTMLButtonElement).click());
 click('Tribute Summon');
 act(()=>(document.querySelector('.dt-picker-grid .eligible') as HTMLButtonElement).click());
 act(()=>(document.querySelector('.dt-field-zone.dt-zone-eligible') as HTMLButtonElement)?.click());
 expect(document.body.textContent).toContain('Zaborg · choose a monster to destroy');
 expect(document.querySelectorAll('.dt-targetable')).toHaveLength(2);
 const sorcerer=Object.values(state.cards).find(c=>c.owner===1&&c.cardId===9596126)!;
 act(()=>(document.querySelector(`[data-instance="${sorcerer.instanceId}"]`) as HTMLButtonElement).click());
 expect(state.chain.at(-1)).toMatchObject({effectId:'ZABORG_DESTROY',targets:[sorcerer.instanceId]});
 for(let i=0;state.chain.length&&i<10;i++)dispatch(a=>a.type==='PASS_CHAIN');
 expect(state.cards[sorcerer.instanceId].location).toBe('graveyard');
});

it('records only with consent, pauses for move feedback and stops recording when switched off',async()=>{
 const dispatch=vi.spyOn(GameService.prototype,'dispatch');
 const render=(enabled:boolean)=>root.render(<EnginePreview initialAI deck={CHAOS_TURBO} catalog={catalog} preferences={{...DEFAULT_PREFERENCES,aiLearning:enabled}} onOpenPreferences={()=>{}}/>);
 act(()=>render(true));click('Start GOAT duel');await tick(1);click('Begin duel');
 let review:HTMLButtonElement|undefined;
 for(let i=0;i<12;i++){await tick(1500);review=Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Review last AI move');if(review&&!review.disabled)break;}
 expect(review?.disabled).toBe(false);expect(loadLearning(localStorage).length).toBeGreaterThan(0);
 click('Pause AI');const paused=dispatch.mock.calls.length;await tick(3000);expect(dispatch.mock.calls).toHaveLength(paused);click('Resume AI');
 act(()=>review!.click());expect(document.querySelector('[aria-label="Review the AI’s last move"]')).toBeTruthy();const count=dispatch.mock.calls.length;await tick(5000);expect(dispatch.mock.calls).toHaveLength(count);
 click('Save feedback');expect(loadLearning(localStorage).some(r=>r.feedback?.rating==='bad')).toBe(true);
 act(()=>render(false));const records=localStorage.getItem(LEARNING_KEY);await tick(5000);expect(localStorage.getItem(LEARNING_KEY)).toBe(records);expect(document.body.textContent).not.toContain('Review last AI move');
});
it('does not collect AI practice decisions with the default preferences',async()=>{
 act(()=>root.render(<EnginePreview initialAI deck={CHAOS_TURBO} catalog={catalog} preferences={DEFAULT_PREFERENCES} onOpenPreferences={()=>{}}/>));click('Start GOAT duel');await tick(1);click('Begin duel');await tick(5000);expect(localStorage.getItem(LEARNING_KEY)).toBeNull();
});

it('records complete opted-in AI games under the saved profile, including actions and concession',async()=>{
 localStorage.setItem(DISPLAY_NAME_KEY,'Mad Scientist');
 const write=vi.spyOn(GameLogWriter.prototype,'write').mockResolvedValue(undefined);
 act(()=>root.render(<EnginePreview initialAI deck={CHAOS_TURBO} catalog={catalog} preferences={DEFAULT_PREFERENCES} onOpenPreferences={()=>{}}/>));const checkbox=Array.from(document.querySelectorAll('input[type=checkbox]')).find(el=>el.closest('label')?.textContent?.includes('Record all my future AI games')) as HTMLInputElement;act(()=>checkbox.click());expect(localStorage.getItem(GAME_LOG_SETTING)).toBe('true');click('Start GOAT duel');await tick(1);click('Begin duel');await tick(5000);
 expect(write).toHaveBeenCalled();const rows=write.mock.calls.map(c=>c[0]);expect(rows[0]).toMatchObject({displayName:'Mad Scientist',game:1,status:'in-progress'});expect(rows.at(-1)!.actions.length).toBeGreaterThan(0);expect(rows.at(-1)!.decisions.some(d=>d.record.actor===1&&d.record.reason)).toBe(true);
 click('Exit duel ✕');click('Yes · concede match');expect(write.mock.calls.at(-1)![0]).toMatchObject({status:'conceded',result:1});
});
it('does not record full games without opt-in or when playing both seats locally',async()=>{
 const write=vi.spyOn(GameLogWriter.prototype,'write').mockResolvedValue(undefined);
 act(()=>root.render(<EnginePreview initialAI deck={CHAOS_TURBO} catalog={catalog} preferences={DEFAULT_PREFERENCES} onOpenPreferences={()=>{}}/>));click('Start GOAT duel');await tick(1);click('Begin duel');await tick(2000);expect(write).not.toHaveBeenCalled();
 act(()=>root.unmount());root=createRoot(host);localStorage.setItem(GAME_LOG_SETTING,'true');act(()=>root.render(<EnginePreview deck={CHAOS_TURBO} catalog={catalog} preferences={DEFAULT_PREFERENCES} onOpenPreferences={()=>{}}/>));click('Start GOAT duel');await tick(1);click('Begin duel');await tick(2000);expect(write).not.toHaveBeenCalled();
});
