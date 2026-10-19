// @vitest-environment happy-dom
import {afterEach,beforeEach,it,expect,vi} from 'vitest';import {act} from 'react';import {createRoot,type Root} from 'react-dom/client';
import DuelField from './DuelField';import data from '../public/catalog.json';import type {Card} from './core/types';import {REASONING_GATE} from './supportedDecks';import {createDuel,type LegalAction} from './engine/model';import {legalActions} from './engine/rules';
const catalog=data as Card[],ctx={cards:new Map(catalog.map(c=>[c.id,c]))};let root:Root,host:HTMLDivElement;
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});vi.stubGlobal('matchMedia',vi.fn(()=>({matches:true,addEventListener(){},removeEventListener(){}})));host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(()=>{act(()=>root.unmount());host.remove();vi.unstubAllGlobals();});
it.each([false,true])('opens Reasoning level choices immediately for its opponent (private=%s)',privateRoom=>{
 const state=createDuel(REASONING_GATE,REASONING_GATE,ctx,42),source=Object.values(state.cards).find(c=>c.cardId===58577036&&c.owner===0)!;
 state.pendingLightChoice={kind:'REASON_LEVEL',sourceId:source.instanceId,controller:1};const send=vi.fn<(a:LegalAction)=>void>();
 act(()=>root.render(<DuelField fixedSeat={privateRoom?1:undefined} state={state} catalog={catalog} actions={legalActions(state,ctx,1)} onAction={send} onManual={()=>{}} manualMode={false} onSkipPhase={()=>{}} onUndo={()=>{}} onVerify={()=>{}} onExit={()=>{}} notice=""/>));
 expect(document.body.textContent).toContain('opponent declares a Level');const eight=Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='8');expect(eight).toBeTruthy();act(()=>eight!.click());expect(send).toHaveBeenCalledWith(expect.objectContaining({type:'COMPLETE_LIGHT_CHOICE',seat:1,declaredType:'8'}));
});

it('opens a private resolution choice when acknowledgement unlocks actions without replacing game state',()=>{
 const state=createDuel(REASONING_GATE,REASONING_GATE,ctx,42),source=Object.values(state.cards).find(c=>c.cardId===58577036&&c.owner===0)!;
 state.pendingLightChoice={kind:'REASON_LEVEL',sourceId:source.instanceId,controller:1};
 const render=(actions:LegalAction[])=>act(()=>root.render(<DuelField fixedSeat={1} state={state} catalog={catalog} actions={actions} onAction={()=>{}} onManual={()=>{}} manualMode={false} onSkipPhase={()=>{}} onUndo={()=>{}} onVerify={()=>{}} onExit={()=>{}} notice=""/>));
 render([]);expect(document.querySelector('.dt-choice-dialog')).toBeNull();render(legalActions(state,ctx,1));expect(document.body.textContent).toContain('opponent declares a Level');
});
