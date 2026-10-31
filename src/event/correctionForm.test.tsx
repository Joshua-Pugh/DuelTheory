// @vitest-environment happy-dom
import {afterEach,it,expect,vi} from 'vitest';
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import EventCorrection from './EventCorrection';
import {newEvent} from './model';
import {applyRoomCommand} from '../table/model';
import {DUEL_PROFILE} from '../table/profiles';
let root:Root|undefined;
afterEach(()=>{if(root)act(()=>root!.unmount());root=undefined;document.body.innerHTML='';});
it('selects a real player when the correction form was mounted before anyone joined',async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});const table=newEvent('ABCDEFGH','owner',{name:'Store',count:4,capacity:2,profile:DUEL_PROFILE}).state.tables[0],send=vi.fn(async()=>true),el=document.createElement('div');document.body.append(el);root=createRoot(el);
 const render=()=>root!.render(<EventCorrection table={table} busy={false} act={send}/>);await act(async()=>render());
 for(const p of ['alice','bob'])table.state=applyRoomCommand(table.state,p,{type:'join',name:p,sources:[p]},'join-'+p);
 table.state=applyRoomCommand(table.state,'organizer',{type:'start'},'start',1000,undefined,true);table.state=applyRoomCommand(table.state,'alice',{type:'roll',round:1},'a',1100,()=>6);table.state=applyRoomCommand(table.state,'bob',{type:'roll',round:1},'b',1100,()=>1);await act(async()=>render());
 const selected=el.querySelector('select')!;expect(selected.value).toBe('alice');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!;
 for(const [selector,value] of [['input[type=number]','-3'],['input[maxlength="160"]','Corrected an accidental gain.']])await act(async()=>{const input=el.querySelector(selector)!;setter.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));});
 expect(el.querySelector('button')!.disabled).toBe(false);await act(async()=>el.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 expect(send).toHaveBeenCalledWith(expect.objectContaining({type:'correct',playerId:'alice',field:'life',delta:-3,reason:'Corrected an accidental gain.'}));expect(el.querySelector<HTMLInputElement>('input[type=number]')!.value).toBe('');
});
