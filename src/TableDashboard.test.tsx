// @vitest-environment happy-dom
import {afterEach,expect,it} from 'vitest';
import {useState,act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {renderToStaticMarkup} from 'react-dom/server';
import TableNumberInput from './TableNumberInput';
import TablePlayerGrid from './TablePlayerGrid';
import TableTitleControls from './TableTitleControls';
import {applyRoomCommand,newTableRoom} from './table/model';
let root:Root|undefined;
afterEach(()=>{if(root)act(()=>root!.unmount());root=undefined;document.body.innerHTML='';});
it('keeps a cleared numeric edit blank and replaces it with 40 without a prefixed zero',async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
 function Harness(){const [n,set]=useState<number|null>(0);return <TableNumberInput value={n} min={0} max={99999} onChange={set}/>;}
 const el=document.createElement('div');document.body.append(el);root=createRoot(el);await act(async()=>root!.render(<Harness/>));
 const input=el.querySelector('input')!,setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!;
 const type=async(value:string)=>{await act(async()=>{setter.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));});};
 await type('');expect(input.value).toBe('');await type('4');await type('40');expect(input.value).toBe('40');
 await type('');expect(input.value).toBe('');await type('040');await act(async()=>input.dispatchEvent(new FocusEvent('focusout',{bubbles:true})));expect(input.value).toBe('40');
});
it('renders centered player tiles with only the local seat editable and one title holder',()=>{let s=newTableRoom('ABCDEFGH','Grid',2,'a');for(const id of ['a','b'])s=applyRoomCommand(s,id,{type:'join',name:id,sources:['Unit']},'j'+id);s=applyRoomCommand(s,'a',{type:'start'},'start');s=applyRoomCommand(s,'a',{type:'roll',round:1},'r-a',0,()=>6);s=applyRoomCommand(s,'b',{type:'roll',round:1},'r-b',0,()=>1);s=applyRoomCommand(s,'b',{type:'claimTitle',version:0},'claim');const html=renderToStaticMarkup(<TablePlayerGrid state={s} playerId="a" busy={false} onAdjust={()=>{}}/>);expect(html).toContain('ct-dashboard-grid');const tiles=document.createElement('div');tiles.innerHTML=html;expect(tiles.querySelector('.ct-dashboard-grid')!.querySelectorAll('button')).toHaveLength(2);expect(html.match(/ct-title-badge/g)).toHaveLength(1);expect(html).toContain('READ ONLY');const title=renderToStaticMarkup(<TableTitleControls state={s} playerId="a" busy={false} onChange={()=>{}}/>);expect(title).toContain('Held by b');expect(title).toContain('Claim Table Title');expect(title).toContain('Title settings');});
