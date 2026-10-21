// @vitest-environment happy-dom
import {afterEach,it,expect,vi} from 'vitest';
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {CardPicker} from './DuelField';
import catalogJson from '../public/catalog.json';
import type {Card} from './core/types';
import {createDuel} from './engine/model';
import {legalActions,dispatchDuel} from './engine/rules';
import {battleAttack} from './engine/ritualDeckEffects';
import {cardActionGroups,nextChoice,narrowChoice} from './duelInteraction';
const catalog=catalogJson as Card[],ctx={cards:new Map(catalog.map(c=>[c.id,c]))};
let root:Root|undefined,host:HTMLDivElement|undefined;
afterEach(()=>{if(root)act(()=>root!.unmount());host?.remove();root=undefined;host=undefined;});
it.each([1,2,3])('lets Bazoo select and confirm %i monsters before paying the cost',count=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
 const deck={id:'bazoo-test',name:'Bazoo test',main:[40133511,...Array(39).fill(3773196)],side:[],extra:[]};
 let state=createDuel(deck,deck,ctx,42);state.turn=3;state.phase='MAIN_1';state.pendingDraw=false;
 const bazoo=Object.values(state.cards).find(c=>c.owner===0&&c.cardId===40133511)!;
 const materials=Object.values(state.cards).filter(c=>c.owner===0&&c.cardId===3773196).slice(0,3);
 for(const c of [bazoo,...materials]){for(const key of ['deck','hand'] as const)state.players[0][key]=state.players[0][key].filter(id=>id!==c.instanceId);if(c===bazoo){Object.assign(c,{location:'monster',zone:0,position:'attack',faceDown:false});state.players[0].zones.monster[0]=c.instanceId;}else{c.location='graveyard';state.players[0].graveyard.push(c.instanceId);}}
 const group=cardActionGroups(legalActions(state,ctx,0),bazoo.instanceId).find(g=>g.options.some(a=>a.type==='ACTIVATE_LIGHT_EFFECT'&&a.effectId==='BAZOO'))!,step=nextChoice(group.options,[],state)!;
 expect([...new Set(step.sets.map(s=>s.length))].sort()).toEqual([1,2,3]);
 const confirm=vi.fn((ids:string[])=>{state=dispatchDuel(state,narrowChoice(group.options,step.field,ids)[0],ctx);});
 host=document.createElement('div');document.body.append(host);root=createRoot(host);
 act(()=>root!.render(<CardPicker title={step.title} ids={step.ids} eligible={step.ids} multiple={step.multiple} sets={step.sets} autoAdvance deck={false} lookup={id=>ctx.cards.get(state.cards[id].cardId)} onConfirm={confirm} onClose={()=>{}}/>));
 const picks=Array.from(host.querySelectorAll<HTMLButtonElement>('.dt-picker-grid button'));
 for(let i=0;i<count;i++){act(()=>picks[i].click());expect(confirm).not.toHaveBeenCalled();expect(state.players[0].banished).toHaveLength(0);}
 const button=Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='Confirm selection')!;expect(button.disabled).toBe(false);act(()=>button.click());
 expect(confirm).toHaveBeenCalledTimes(1);expect(state.players[0].banished).toHaveLength(count);
 while(state.chain.length){const pass=legalActions(state,ctx,state.priority).find(a=>a.type==='PASS_CHAIN')!;state=dispatchDuel(state,pass,ctx);}
 expect(battleAttack(state,bazoo.instanceId,ctx)).toBe(1600+300*count);
});
