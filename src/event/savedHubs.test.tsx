// @vitest-environment happy-dom
import {afterEach,it,expect,vi} from 'vitest';
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import EventSavedHubs from './EventSavedHubs';
import {newEvent,eventReply} from './model';
import {DUEL_PROFILE} from '../table/profiles';
let root:Root|undefined;
afterEach(()=>{if(root)act(()=>root!.unmount());root=undefined;document.body.innerHTML='';localStorage.clear();vi.unstubAllGlobals();});
it('requires a reviewed event deletion and only marks the saved item deleted after server confirmation',async()=>{
 const s=newEvent('ABCDEFGH','owner',{name:'Store',count:4,capacity:2,profile:DUEL_PROFILE});
 const fetcher=vi.fn(async(_url:unknown,options?:RequestInit)=>{const action=options?.body?JSON.parse(String(options.body)):null;if(action){expect(action).toEqual({type:'deleteEvent',revision:0});s.state.deletedAt=123;}return new Response(JSON.stringify(eventReply(s,'owner')));});vi.stubGlobal('fetch',fetcher);
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});const el=document.createElement('div');document.body.append(el);root=createRoot(el);const change=vi.fn();
 await act(async()=>root!.render(<EventSavedHubs hubs={[{code:'ABCDEFGH',name:'Store'}]} open={()=>{}} change={change}/>));
 const button=(name:string)=>Array.from(el.querySelectorAll('button')).find(b=>b.textContent===name)!;
 await act(async()=>button('Delete event').click());expect(fetcher).toHaveBeenCalledTimes(1);expect(change).not.toHaveBeenCalled();expect(el.textContent).toContain('Delete Store?');
 await act(async()=>button('Delete event & close tables').click());expect(change).toHaveBeenCalledWith([{code:'ABCDEFGH',name:'Store',deletedAt:123}]);
});
