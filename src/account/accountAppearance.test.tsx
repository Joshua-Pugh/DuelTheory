// @vitest-environment happy-dom
import {useState,act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const image='data:image/jpeg;base64,'+btoa('\xff\xd8\xff000000000');
vi.mock('../table/backgrounds',async original=>({...await original<typeof import('../table/backgrounds')>(),prepareBackground:vi.fn(async()=>new Blob(['fixture'],{type:'image/jpeg'})),backgroundDataUrl:vi.fn(async()=>'data:image/jpeg;base64,'+btoa('\xff\xd8\xff000000000'))}));
import AccountAppearance from './AccountAppearance';
import {savedAppearance,autoAppearanceEnabled,type TableTheme} from '../table/appearance';
import {savedBackground} from '../table/backgrounds';
let root:Root,el:HTMLDivElement;
function Harness(){const [name,onName]=useState('Alex'),[accent,onAccent]=useState('#ddc57a'),[theme,onTheme]=useState<TableTheme>('forge');return <AccountAppearance {...{name,onName,accent,onAccent,theme,onTheme}}/>;}
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});localStorage.clear();el=document.createElement('div');document.body.append(el);root=createRoot(el);});
afterEach(()=>{act(()=>root.unmount());el.remove();});
const button=(text:string)=>[...el.querySelectorAll('button')].find(b=>b.textContent===text)!;
it('previews an upload, requires saving, and persists image/theme/opt-in outside a room',async()=>{await act(async()=>root.render(<Harness/>));const file=el.querySelector<HTMLInputElement>('input[type=file]')!;await act(async()=>{Object.defineProperty(file,'files',{value:[new File(['fixture'],'fixture.png',{type:'image/png'})]});file.dispatchEvent(new Event('change',{bubbles:true}));});expect(el.querySelector('.ct-panel-background')!.getAttribute('src')).toBe(image);expect(savedBackground()).toBeNull();await act(async()=>{const select=el.querySelector('select')!;select.value='ocean';select.dispatchEvent(new Event('change',{bubbles:true}));el.querySelector<HTMLInputElement>('input[type=checkbox]')!.click();});expect(el.querySelector('.ct-player')!.getAttribute('style')).toContain('#17374b');await act(async()=>button('Save appearance on this device').click());expect(savedBackground()).toBe(image);expect(savedAppearance().theme).toBe('ocean');expect(autoAppearanceEnabled()).toBe(true);await act(async()=>button('Remove saved background').click());expect(el.querySelector('.ct-panel-background')).toBeNull();expect(savedBackground()).toBe(image);await act(async()=>button('Save appearance on this device').click());expect(savedBackground()).toBeNull();});
