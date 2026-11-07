// @vitest-environment happy-dom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {readyAshenDuel} from '../../../test/ashenReady';
import {fixtureCard} from '../../../test/ashenFixtureCard';
import {moveAshenCard} from '../adapter';
import {assignAshenBlocker,declareAshenAttackers,inspectAshenAttacker,inspectAshenBlocker,resolveAshenCombat} from '../duel';
import {applyAshenCommand} from '../../../matches/ashenCommands';
import {combatCardView,combatLinks} from './combatView';
import AshenBattlefield from '../../../AshenBattlefield';
import AshenBattlefieldCard from './AshenBattlefieldCard';
import AshenCombatSummary from './AshenCombatSummary';
import type {Battlefield} from '../../../ashenBattlefieldState';
import type {AshenCommand} from '../../../matches/ashenCommands';
vi.mock('../../../useFittedRules',()=>({default:()=>{}}));
(globalThis as Record<string,unknown>).IS_REACT_ACT_ENVIRONMENT=true;
let root:Root|undefined;
afterEach(async()=>{if(root)await act(async()=>root!.unmount());root=undefined;document.body.innerHTML='';localStorage.clear();});
function fixture(){const s=readyAshenDuel(['Brute','Noble'],42,0);for(const seat of [0,1] as const)for(const id of [...s.table.piles[`${seat}:hand`]])moveAshenCard(s,id,'deck');s.rules!.duel!.phase='combat';s.rules!.duel!.combat={stage:'attack',attackers:[],blockers:{},blocked:[]};return s;}
function put(s:Battlefield,id:string,seat:0|1){const c=fixtureCard(s,id,seat);moveAshenCard(s,c.instanceId,'unit');c.rotated=false;return c.instanceId;}
async function mount(s:Battlefield,seat:0|1,send:(command:AshenCommand)=>void,playmat=false){const host=document.createElement('div');document.body.append(host);root=createRoot(host);await act(async()=>root!.render(<AshenBattlefield remote={{state:s,seat,send}} playmat={playmat} learning={false}/>));}
async function tap(selector:string){await act(async()=>(document.querySelector(selector) as HTMLElement).click());}
it('uses actual legal actions for attack highlights and excludes fatigued Units and pending responses',()=>{
 const s=fixture(),a=put(s,'ashen-brute-frenzied-grunt',0),before=JSON.stringify(s);expect(combatCardView(s,a,0,[],null)).toMatchObject({intent:'attack',label:'Can attack'});expect(combatLinks(s,[a])[0]).toMatchObject({from:a,to:s.table.piles['1:command'][0],kind:'attack',preview:true});expect(JSON.stringify(s)).toBe(before);
 s.table.cards[a].rotated=true;expect(inspectAshenAttacker(s,a).allowed).toBe(false);expect(combatCardView(s,a,0,[a],null).intent).toBeUndefined();expect(combatLinks(s,[a])).toEqual([]);
 s.table.cards[a].rotated=false;s.rules!.duel!.priority={holder:'0',players:['0','1'],passed:[]};expect(inspectAshenAttacker(s,a).allowed).toBe(false);
});
it('keeps Standfast, aerial restrictions, single-blocker assignment and authenticated removal aligned',()=>{
 let s=fixture();const a=put(s,'ashen-brute-ashen-warhawk',0),ground=put(s,'ashen-noble-shieldbearer-noble',1),archer=put(s,'ashen-noble-crown-archer',1);s.table.cards[archer].unready=true;s=declareAshenAttackers(s,[a]);
 expect(inspectAshenBlocker(s,a,ground)).toMatchObject({allowed:false,reason:'This attacker needs a Soar or Ranged blocker.'});expect(combatCardView(s,archer,1,[],a).intent).toBe('block');
 s=assignAshenBlocker(s,a,archer);expect(combatLinks(s,[])).toEqual([{from:archer,to:a,kind:'block',preview:false}]);expect(inspectAshenBlocker(s,a,archer).allowed).toBe(false);expect(combatCardView(s,archer,1,[],a).intent).toBe('unblock');
 expect(()=>applyAshenCommand(s,0,{type:'unblock',blocker:archer})).toThrow('defender');s=applyAshenCommand(s,1,{type:'unblock',blocker:archer});expect(s.rules!.duel!.combat!.blocked).toEqual([]);expect(inspectAshenBlocker(s,a,archer).allowed).toBe(true);
});
it('reports resolved simultaneous damage and destroyed Units without changing combat results',()=>{
 let s=fixture();const a=put(s,'ashen-brute-frenzied-grunt',0),b=put(s,'ashen-noble-crown-archer',1);s.table.cards[b].unready=true;s=declareAshenAttackers(s,[a]);s=assignAshenBlocker(s,a,b);s=resolveAshenCombat(s);
 expect(s.table.cards[a].zone).toBe('graveyard');expect(s.table.cards[b].zone).toBe('graveyard');const report=s.rules!.duel!.combat!.report!;expect(report.hits.map(h=>h.amount)).toEqual([2,2]);expect(report.fallen.map(c=>c.name)).toEqual(expect.arrayContaining(['Frenzied Grunt','Crown Archer']));expect(s.table.health).toEqual([20,20]);
 const html=renderToStaticMarkup(<AshenCombatSummary state={JSON.parse(JSON.stringify(s))} onInspect={()=>{}}/>);expect(html).toContain('Combat result');expect(html).toContain('Damage dealt');expect(html).toContain('Destroyed:');
});
it('allows direct attacker selection without a modal and sends the existing authoritative attack command',async()=>{
 const s=fixture(),a=put(s,'ashen-brute-frenzied-grunt',0),send=vi.fn();await mount(s,0,send);await tap(`[data-ashen-card="${a}"]`);expect(document.querySelector(`[data-ashen-card="${a}"]`)?.getAttribute('aria-pressed')).toBe('true');expect(document.querySelector('.dt-action-dialog')).toBeNull();
 const confirm=Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Attack with selected Units')!;await act(async()=>confirm.click());expect(send).toHaveBeenCalledWith({type:'attack',ids:[a]});
});
it('supports direct blocking and a separate readable inspector without sending an illegal assignment',async()=>{
 let s=fixture();const a=put(s,'ashen-brute-ashen-warhawk',0),b=put(s,'ashen-noble-crown-archer',1),send=vi.fn();s=declareAshenAttackers(s,[a]);await mount(s,1,send);await tap(`[data-ashen-card="${a}"]`);expect(document.querySelector(`[data-ashen-card="${b}"]`)?.getAttribute('data-combat-action')).toBe('block');await tap(`[data-ashen-card="${b}"]`);expect(send).toHaveBeenCalledWith({type:'block',attacker:a,blocker:b});
 await tap(`[aria-label="Read Crown Archer"]`);expect(document.querySelector('.ab-viewer-open')).not.toBeNull();expect(document.querySelector('.dt-action-dialog')).toBeNull();
});
it('assigns a legal blocker with a pointer drag and rejects an illegal drop',async()=>{
 let s=fixture();
 const attacker=put(s,'ashen-brute-ashen-warhawk',0);
 const archer=put(s,'ashen-noble-crown-archer',1);
 const ground=put(s,'ashen-noble-shieldbearer-noble',1);
 s=declareAshenAttackers(s,[attacker]);
 const send=vi.fn();
 await mount(s,1,send,true);
 const card=(id:string)=>document.querySelector<HTMLElement>(`[data-ashen-card="${id}"]`)!;
 const board=document.querySelector<HTMLElement>('.ab-table')!;
 const hit=vi.spyOn(document,'elementFromPoint').mockReturnValue(card(attacker));
 const capture=vi.spyOn(board,'setPointerCapture').mockImplementation(()=>{});
 try{
  for(const blocker of [ground,archer]){
   await act(async()=>{
    card(blocker).dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,isPrimary:true,pointerId:1,clientX:30,clientY:140}));
    board.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,isPrimary:true,pointerId:1,clientX:30,clientY:40}));
    board.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,isPrimary:true,pointerId:1,clientX:30,clientY:40}));
   });
  }
  expect(send).toHaveBeenCalledExactlyOnceWith({type:'block',attacker,blocker:archer});
 }finally{hit.mockRestore();capture.mockRestore();}
});
it('labels remaining Defense, damage and Unready separately',()=>{
 const s=fixture(),id=put(s,'ashen-noble-crown-archer',1);s.table.cards[id].unready=true;s.rules!.damage[id]=1;
 const html=renderToStaticMarkup(<AshenBattlefieldCard state={s} seat={1} id={id} hand={false} selected={false} combat={{attacking:false,blocking:false}} onClick={()=>{}} onActions={()=>{}} onRead={()=>{}} onHover={()=>{}} onDrag={()=>{}}/>);
 expect(html).toContain('2 Attack, 1 of 2 Defense remaining');expect(html).toContain('Unready');expect(html).toContain('1 dmg');
});
