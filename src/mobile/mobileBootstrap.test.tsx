// @vitest-environment happy-dom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import MobileBootstrap from './MobileBootstrap';
let host:HTMLDivElement,root:Root;
beforeEach(()=>{vi.useFakeTimers();Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(()=>{act(()=>root.unmount());host.remove();vi.useRealTimers();vi.unstubAllGlobals();});
it('does not release the launch screen until the actual app module is ready',async()=>{
 let resolve!:(value:{default:()=>React.JSX.Element})=>void;const load=()=>new Promise<{default:()=>React.JSX.Element}>(r=>resolve=r);
 await act(async()=>root.render(<MobileBootstrap load={load}/>));
 await act(async()=>{await vi.advanceTimersByTimeAsync(2000);});expect(host.textContent).toContain('Opening Table Companion');
 await act(async()=>{resolve({default:()=> <div>Ready table</div>});});expect(host.textContent).toBe('Ready table');
});
it('offers recovery instead of trapping the user after a startup failure',async()=>{
 const load=vi.fn().mockRejectedValueOnce(Error('failed')).mockResolvedValueOnce({default:()=> <div>Recovered</div>});
 await act(async()=>root.render(<MobileBootstrap load={load}/>));
 await act(async()=>{await vi.advanceTimersByTimeAsync(1500);});expect(host.querySelector('[role=alert]')).toBeTruthy();
 await act(async()=>{host.querySelector('button')!.click();await vi.advanceTimersByTimeAsync(1500);});expect(host.textContent).toBe('Recovered');
});
it('does not animate or delay startup for reduced-motion users',async()=>{
 vi.stubGlobal('matchMedia',()=>({matches:true}));const load=()=>Promise.resolve({default:()=> <div>Ready</div>});
 await act(async()=>root.render(<MobileBootstrap load={load}/>));await act(async()=>{await vi.advanceTimersByTimeAsync(0);});expect(host.textContent).toBe('Ready');
});
