// @vitest-environment happy-dom
import {afterEach,expect,it,vi} from 'vitest';
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {renderToStaticMarkup} from 'react-dom/server';
import CompactCounterControls from './CompactCounterControls';
import HostTableQr from './HostTableQr';
import TableTurnTimer from './TableTurnTimer';
import IncomingSourceDamage from './IncomingSourceDamage';
import {newTableRoom,applyRoomCommand} from './table/model';
import {MULTIPLAYER_PROFILE} from './table/profiles';
let root:Root|undefined;
afterEach(()=>{if(root)act(()=>root!.unmount());root=undefined;document.body.innerHTML='';vi.useRealTimers();});
function ready(){let s=newTableRoom('ABCDEFGH','Tools',2,'a',MULTIPLAYER_PROFILE);for(const id of ['a','b'])s=applyRoomCommand(s,id,{type:'join',name:id,sources:['Unit']},'j'+id);s=applyRoomCommand(s,'a',{type:'configureTurns',enabled:true,revision:s.revision},'turns');s=applyRoomCommand(s,'a',{type:'start'},'start');for(const id of ['a','b'])s=applyRoomCommand(s,id,{type:'roll',round:1},'r'+id,0,()=>id==='a'?6:1);return s;}
it('displays QR invite controls exclusively on the host seat',()=>{expect(renderToStaticMarkup(<HostTableQr hostId="a" playerId="a" code="ABCDEFGH"/>)).toContain('Show QR invite');expect(renderToStaticMarkup(<HostTableQr hostId="a" playerId="b" code="ABCDEFGH"/>)).toBe('');});
it('uses the selected counter for compact +/- and makes linked damage explicit',async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});const onAdjust=vi.fn(),state=ready(),el=document.createElement('div');document.body.append(el);root=createRoot(el);await act(async()=>root!.render(<CompactCounterControls state={state} playerId="a" busy={false} onAdjust={onAdjust}/>));
 const select=el.querySelector('select')!;
 const choose=async(id:string)=>{await act(async()=>{select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}));});};
 await choose(JSON.stringify(['counter','Energy']));expect(el.querySelector<HTMLButtonElement>('button[aria-label="Remove 1 Energy"]')!.disabled).toBe(true);await act(async()=>el.querySelector<HTMLButtonElement>('button[aria-label="Add 1 Energy"]')!.click());expect(onAdjust).toHaveBeenLastCalledWith({type:'adjust',field:'counter',key:'Energy',delta:1});
 await choose(JSON.stringify(['damage','b:0']));expect(el.textContent).toContain('Also adjust Vitality');const plus=el.querySelectorAll<HTMLButtonElement>('button')[1];await act(async()=>plus.click());expect(onAdjust).toHaveBeenLastCalledWith({type:'adjust',field:'damage',key:'b:0',delta:1,loseLife:true});await act(async()=>el.querySelector<HTMLInputElement>('input[type=checkbox]')!.click());await act(async()=>plus.click());expect(onAdjust).toHaveBeenLastCalledWith({type:'adjust',field:'damage',key:'b:0',delta:1,loseLife:false});
});
it('renders the countdown against the server clock and omits timer configuration for guests',()=>{vi.useFakeTimers();vi.setSystemTime(2000);let s=ready();s=applyRoomCommand(s,'a',{type:'configureTimer',version:0,durationSeconds:180},'timer',101000);const guest=renderToStaticMarkup(<TableTurnTimer state={s} playerId="b" busy={false} serverOffset={100000} onChange={()=>{}}/>);expect(guest).toContain('2:59');expect(guest).not.toContain('Turn timer settings');expect(guest).not.toContain('Pause timer');const host=renderToStaticMarkup(<TableTurnTimer state={s} playerId="a" busy={false} serverOffset={100000} onChange={()=>{}}/>);expect(host).toContain('Pause timer');expect(host).toContain('Turn timer settings');});
it('shows only the local incoming-damage list below the tiles',()=>{let s=ready();s=applyRoomCommand(s,'a',{type:'adjust',field:'damage',key:'b:0',delta:7},'a-hit');s=applyRoomCommand(s,'b',{type:'adjust',field:'damage',key:'a:0',delta:19},'b-hit');const html=renderToStaticMarkup(<IncomingSourceDamage state={s} playerId="a"/>);expect(html).toContain('a · damage received');expect(html).toContain('<strong>7</strong>');expect(html).not.toContain('<strong>19</strong>');expect(html).not.toContain('<select');});
