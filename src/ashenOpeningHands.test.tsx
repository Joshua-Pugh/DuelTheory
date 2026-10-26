// @vitest-environment happy-dom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,expect,it,vi} from 'vitest';
import AshenBattlefield from './AshenBattlefield';
import {newAshenDuel,chooseAshenOpening} from './games/ashen/duel';
vi.mock('./useFittedRules',()=>({default:()=>{}}));
(globalThis as Record<string,unknown>).IS_REACT_ACT_ENVIRONMENT=true;
let root:Root|undefined;
afterEach(async()=>{if(root)await act(async()=>root!.unmount());root=undefined;document.body.innerHTML='';localStorage.clear();});
async function mount(props:Parameters<typeof AshenBattlefield>[0]){const host=document.createElement('div');document.body.append(host);root=createRoot(host);await act(async()=>root!.render(<AshenBattlefield {...props}/>));}
const button=(text:string)=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent===text)!;
async function click(text:string){await act(async()=>button(text).click());}
it('offers a free six-card redraw, a five-card redraw, and a local handoff before enabling play',async()=>{
 await mount({initialState:newAshenDuel(['Brute','Noble'],42,0),learning:false});
 expect(document.querySelectorAll('.ab-opening-cards figure')).toHaveLength(6);
 expect((document.querySelector('[data-phase="combat"]') as HTMLButtonElement).disabled).toBe(true);
 await click('Free redraw · 6 cards');expect(button('Redraw · 5 cards')).toBeTruthy();
 await click('Redraw · 5 cards');expect(document.querySelectorAll('.ab-opening-cards figure')).toHaveLength(5);
 await click('Keep hand · 5 cards');expect(document.querySelectorAll('.ab-opening-cards figure')).toHaveLength(0);
 await click('View Player 2 hand');expect(document.querySelectorAll('.ab-opening-cards figure')).toHaveLength(6);
 await click('Keep hand · 6 cards');expect(document.querySelector('.ab-opening-dialog')).toBeNull();
},15000);
it('shows remote waiting text without rendering the other player’s opening cards or a viewpoint switch',async()=>{
 const state=chooseAshenOpening(newAshenDuel(['Brute','Noble'],42,0),0,'keep'),send=vi.fn();
 await mount({remote:{state,seat:0,send},learning:false});
 expect(document.querySelector('.ab-opening-dialog')!.textContent).toContain('Waiting for Player 2');
 expect(document.querySelectorAll('.ab-opening-cards figure')).toHaveLength(0);expect(button('View Player 2 hand')).toBeUndefined();
});
