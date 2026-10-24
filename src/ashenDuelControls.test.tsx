// @vitest-environment happy-dom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach,expect,it,vi} from 'vitest';
import AshenBattlefield from './AshenBattlefield';
import AshenPhaseControls from './AshenPhaseControls';
import ResourcePool from './duelUi/ResourcePool';
import {newBruteDuel,inspectAshenAction,submitAshenAction,nextAshenPhase} from './games/ashen/duel';
import {ashenTurnNumber} from './ashenBattlefieldState';
import {executeProgram} from './framework';
import {ashenAdapter} from './games/ashen/adapter';
import {moveAshenCard} from './games/ashen/adapter';
import {rulesForCard,RESOURCES} from './ashenPresentation';
vi.mock('./useFittedRules',()=>({default:()=>{}}));
(globalThis as Record<string,unknown>).IS_REACT_ACT_ENVIRONMENT=true;
let root:Root|undefined;
afterEach(async()=>{if(root)await act(async()=>root!.unmount());root=undefined;document.body.innerHTML='';localStorage.clear();});
async function mount(node:React.ReactNode){const host=document.createElement('div');document.body.append(host);root=createRoot(host);await act(async()=>root!.render(node));return host;}
async function click(button:Element){await act(async()=>(button as HTMLElement).click());}
function setup(){const s=newBruteDuel(()=>.4);s.table.active=0;return s;}
const callbacks=()=>({onNext:vi.fn(),onPass:vi.fn(),onSelectAll:vi.fn(),onAttack:vi.fn(),onClearBlockers:vi.fn(),onCombat:vi.fn(),onOrder:vi.fn(),onConfirmOrder:vi.fn()});
it('uses SP to enter combat and replaces the main strip with combat steps',async()=>{
 const s=setup(),fn=callbacks();await mount(<AshenPhaseControls state={s} seat={0} attackIds={[]} blockAttack={null} {...fn}/>);
 const sp=document.querySelector('[data-phase="combat"]') as HTMLButtonElement;expect(sp.textContent).toBe('SP');expect(sp.disabled).toBe(false);await click(sp);expect(fn.onNext).toHaveBeenCalledOnce();
 const combat=nextAshenPhase(s);await act(async()=>root!.render(<AshenPhaseControls state={combat} seat={0} attackIds={[]} blockAttack={null} {...fn}/>));
 expect(document.querySelector('[data-phase="combat"]')).toBeNull();expect(document.querySelector('[data-phase="attack"]')?.textContent).toBe('ATK');expect(document.querySelector('[data-phase="block"]')?.textContent).toBe('BLK');expect((document.querySelector('[data-phase="main2"]') as HTMLButtonElement).disabled).toBe(false);
});
it('locks phase progression for the other seat and while a choice is pending',()=>{
 const s=setup(),fn=callbacks();expect(renderToStaticMarkup(<AshenPhaseControls state={s} seat={1} attackIds={[]} blockAttack={null} {...fn}/>)).toMatch(/data-phase="combat"[^>]*disabled/);
 s.rules!.duel!.priority={holder:'1',passes:0} as never;
 const html=renderToStaticMarkup(<AshenPhaseControls state={s} seat={0} attackIds={[]} blockAttack={null} {...fn}/>);expect(html).toContain('Waiting for Player 2 to respond.');expect(html).toMatch(/data-phase="combat"[^>]*disabled/);
});
it('keeps all positive resource types and omits zeros without changing basin data',()=>{
 const resources=RESOURCES.map((id,i)=>({id,label:id,icon:`/${id}.png`,amount:i})),before=JSON.stringify(resources);
 const html=renderToStaticMarkup(<ResourcePool resources={resources} label="Ley Basin"/>);expect(html).not.toContain('alt="untuned"');expect(html.match(/<output/g)).toHaveLength(4);expect(html).toContain('4 types');expect(JSON.stringify(resources)).toBe(before);
 expect(renderToStaticMarkup(<ResourcePool resources={[]} label="Ley Basin"/>)).toContain('Empty');
});
it('preflights the same payment and timing rules without mutating the duel',()=>{
 const s=setup(),card=Object.values(s.table.cards).find(c=>c.controller===0&&c.cardId==='ashen-brute-bloodfang-raider')!;if(card.zone!=='hand')moveAshenCard(s,card.instanceId,'hand');
 const before=JSON.stringify(s);expect(inspectAshenAction(s,card.instanceId,0).allowed).toBe(false);expect(JSON.stringify(s)).toBe(before);
 s.basins[0].fury=99;s.basins[0].untuned=99;expect(inspectAshenAction(s,card.instanceId,0).allowed).toBe(true);expect(()=>submitAshenAction(s,card.instanceId,{source:card.instanceId,player:'0'})).not.toThrow();expect(inspectAshenAction(s,card.instanceId,1).allowed).toBe(false);
});
it('opens card actions directly in local AT and keeps the viewer read-only',async()=>{
 const s=setup(),id=s.table.piles['0:hand'][0];await mount(<AshenBattlefield initialState={s} learning={false}/>);
 expect(document.querySelector('.ab-inspector .ab-card-actions')).toBeNull();await click(document.querySelector(`[data-ashen-card="${id}"]`)!);
 const dialog=document.querySelector('dialog.dt-action-dialog')!;expect(dialog.getAttribute('aria-label')).toContain(s.table.cards[id].name);expect(dialog.textContent).toContain('View card');
 await click(Array.from(dialog.querySelectorAll('button')).find(b=>b.textContent==='View card')!);expect(document.querySelector('.dt-action-dialog')).toBeNull();expect(document.querySelector('.ab-viewer-open')).not.toBeNull();expect(document.querySelector('.ab-inspector')?.textContent).not.toContain('Deploy with effects');
});
it('uses the same action menu and commands in private AT rooms',async()=>{
 const s=setup(),font=Object.values(s.table.cards).find(c=>c.controller===0&&c.type==='Ley Font')!;moveAshenCard(s,font.instanceId,'ley');font.faceDown=false;font.rotated=false;const send=vi.fn();
 await mount(<AshenBattlefield remote={{state:s,seat:0,send}} learning={false}/>);await click(document.querySelector(`[data-ashen-card="${font.instanceId}"]`)!);
 const burn=Array.from(document.querySelectorAll('.dt-action-dialog button')).find(b=>b.textContent?.startsWith('Burn font'))!;expect((burn as HTMLButtonElement).disabled).toBe(false);await click(burn);expect(send).toHaveBeenCalledWith({type:'burn',id:font.instanceId});
});
it('repairs old native transcription copies while respecting explicit custom rules',()=>{
 const card={cardId:'ashen-noble-crown-of-dominion',name:'Crown',type:'Relic',description:'Whenever Plan, Refine, or Fortify, draw a card.'};expect(rulesForCard(card).text).toContain('Whenever you Plan');expect(rulesForCard({...card,rulesOverride:true}).text).toBe(card.description);
 const native={...card,cardId:'ashen-brute-warhowl-instigator',description:'under your, draw a card.'};expect(rulesForCard(native).text).toContain('under your control,');expect(rulesForCard({...native,cardId:'custom-card'}).text).toBe(native.description);
});
it('sends the selected End Phase shortcut from a private AT duel',async()=>{
 const s=setup(),send=vi.fn();await mount(<AshenBattlefield remote={{state:s,seat:0,send}} learning={false}/>);
 const end=document.querySelector('[data-phase="end"]') as HTMLButtonElement;expect(end.disabled).toBe(false);await click(end);expect(send).toHaveBeenCalledWith({type:'phase',phase:'end'});
});
it('counts a full two-player cycle without resetting individual-turn ability limits',()=>{
 const s=setup();for(const serial of [1,2,3,4,7,8]){s.rules!.turn=serial;expect(ashenTurnNumber(s)).toBe(Math.ceil(serial/2));expect(s.rules!.turn).toBe(serial);}
});
it('keeps a local Plan choice with its owner until the view changes',async()=>{
 const s=setup(),source=s.table.piles['1:command'][0];const result=executeProgram(s,ashenAdapter,{version:1,id:'test-plan',label:'Plan 2',steps:[{op:'plan',count:2}]},{player:'1',source});result.state.rules!.pending={flow:result.pending!,label:'Plan 2'};
 await mount(<AshenBattlefield initialState={result.state} learning={false}/>);
 expect(document.querySelector('[aria-label="Plan: arrange viewed cards"]')).toBeNull();const switcher=Array.from(document.querySelectorAll('.ab-choice-wait button')).find(b=>b.textContent==='Play Player 2')!;await click(switcher);expect(document.querySelector('[aria-label="Plan: arrange viewed cards"]')).not.toBeNull();
});
it('does not expose another player’s pending Plan choices in a private room',async()=>{
 const s=setup(),source=s.table.piles['1:command'][0];const result=executeProgram(s,ashenAdapter,{version:1,id:'test-plan',label:'Plan 2',steps:[{op:'plan',count:2}]},{player:'1',source});result.state.rules!.pending={flow:result.pending!,label:'Plan 2'};
 await mount(<AshenBattlefield remote={{state:result.state,seat:0,send:vi.fn()}} learning={false}/>);expect(document.querySelector('[aria-label="Plan: arrange viewed cards"]')).toBeNull();expect(document.querySelector('.ab-choice-wait')?.textContent).toContain('Player 2 chooses');expect(document.querySelector('.ab-choice-wait button')).toBeNull();
});
it('keeps a Command Station target choice with the effect owner and labels each target seat',async()=>{
 const s=setup(),source=s.table.piles['1:command'][0];const result=executeProgram(s,ashenAdapter,{version:1,id:'station-ping',label:'Foresight damage',steps:[{op:'select',selection:{filter:{zones:['command']},count:1,label:'Choose a Command Station'}},{op:'damage',targets:'targets',amount:1}]},{player:'1',source});result.state.rules!.pending={flow:result.pending!,label:'Foresight damage'};
 await mount(<AshenBattlefield initialState={result.state} learning={false}/>);expect(document.querySelector('[aria-label="Choose a Command Station"]')).toBeNull();await click(document.querySelector('.ab-choice-wait button')!);
 const dialog=document.querySelector('[aria-label="Choose a Command Station"]')!;expect(dialog.textContent).toContain('Player 1 · Command Station');expect(dialog.textContent).toContain('Player 2 · Command Station');
});
