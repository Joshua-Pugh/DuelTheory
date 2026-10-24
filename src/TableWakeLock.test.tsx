// @vitest-environment happy-dom
import {afterEach,expect,it,vi} from 'vitest';
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import TableWakeLock from './TableWakeLock';
import type {ScreenLock} from './commander/wakeLock';
let root:Root|undefined;const original=Object.getOwnPropertyDescriptor(navigator,'wakeLock');
function sentinel(){const listeners=new Set<()=>void>(),lock:ScreenLock={released:false,release:async()=>{lock.released=true;listeners.forEach(fn=>fn());},addEventListener:(_,fn)=>{listeners.add(fn);},removeEventListener:(_,fn)=>{listeners.delete(fn);}};return lock;}
afterEach(()=>{if(root)act(()=>root!.unmount());root=undefined;if(original)Object.defineProperty(navigator,'wakeLock',original);else Reflect.deleteProperty(navigator,'wakeLock');localStorage.clear();document.body.innerHTML='';vi.restoreAllMocks();vi.useRealTimers();});
it('exposes denial, a direct retry and automatic recovery without claiming an ungranted lock',async()=>{vi.useFakeTimers();Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});vi.spyOn(document,'visibilityState','get').mockReturnValue('visible');const first=sentinel(),next=sentinel(),request=vi.fn().mockRejectedValueOnce(Error('denied')).mockResolvedValueOnce(first).mockResolvedValueOnce(next);Object.defineProperty(navigator,'wakeLock',{configurable:true,value:{request}});const el=document.createElement('div');document.body.append(el);root=createRoot(el);await act(async()=>root!.render(<TableWakeLock/>));expect(el.textContent).toContain('Not active');expect(el.textContent).not.toContain('Active · wake lock granted');await act(async()=>el.querySelector('button')!.click());expect(el.textContent).toContain('Active · wake lock granted');await act(async()=>first.release());expect(el.textContent).toContain('Paused');await act(async()=>vi.advanceTimersByTimeAsync(1000));expect(el.textContent).toContain('Active · wake lock granted');expect(request).toHaveBeenCalledTimes(3);});
