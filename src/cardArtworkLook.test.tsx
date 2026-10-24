// @vitest-environment happy-dom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,expect,it,vi} from 'vitest';
import {DEFAULT_LOOK,loadCardLook,saveCardLook,saveLook} from './framePersonalization';
import AshenCardFrame from './AshenCardFrame';
vi.mock('./useFittedRules',()=>({default:()=>{}}));
(globalThis as Record<string,unknown>).IS_REACT_ACT_ENVIRONMENT=true;
let root:Root|undefined;
afterEach(async()=>{if(root)await act(async()=>root!.unmount());root=undefined;document.body.innerHTML='';localStorage.clear();});
it('persists zoom and crop independently and resets only the selected card',()=>{
 saveCardLook('card-a',{...DEFAULT_LOOK,zoom:1.5,panX:30});expect(loadCardLook('card-b')).toEqual(DEFAULT_LOOK);saveCardLook('card-b',{...DEFAULT_LOOK,zoom:1.8,panY:80});expect(loadCardLook('card-a')).toMatchObject({zoom:1.5,panX:30});saveCardLook('card-a',DEFAULT_LOOK);expect(loadCardLook('card-b')).toMatchObject({zoom:1.8,panY:80});expect(loadCardLook('card-a')).toEqual(DEFAULT_LOOK);
});
it('does not spread legacy shared crop settings to every card',()=>{saveLook({...DEFAULT_LOOK,zoom:2,panX:0,panY:0});expect(loadCardLook('card-a')).toEqual(DEFAULT_LOOK);expect(loadCardLook('card-b')).toEqual(DEFAULT_LOOK);});
it('updates only matching card frames in the gallery and duel reader',async()=>{
 const host=document.createElement('div');document.body.append(host);root=createRoot(host);await act(async()=>root!.render(<><AshenCardFrame card={{id:'card-a',name:'A',type:'Unit'}}/><AshenCardFrame card={{id:'card-b',name:'B',type:'Unit'}}/></>));
 await act(async()=>{saveCardLook('card-a',{...DEFAULT_LOOK,zoom:1.7,panX:20});});const a=host.querySelector<HTMLElement>('[aria-label="A Unit card"]')!,b=host.querySelector<HTMLElement>('[aria-label="B Unit card"]')!;expect(a.style.getPropertyValue('--art-zoom')).toBe('1.7');expect(a.style.getPropertyValue('--art-x')).toBe('20%');expect(b.style.getPropertyValue('--art-zoom')).toBe('1');expect(b.style.getPropertyValue('--art-x')).toBe('50%');
});
