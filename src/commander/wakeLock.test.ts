import {describe,it,expect,vi} from 'vitest';
import {keepTableAwake,type ScreenLock} from './wakeLock';
function sentinel(){const listeners=new Set<()=>void>();const lock:ScreenLock={released:false,release:vi.fn(async()=>{lock.released=true;listeners.forEach(fn=>fn());}),addEventListener:(_,fn)=>{listeners.add(fn);},removeEventListener:(_,fn)=>{listeners.delete(fn);}};return lock;}
const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
describe('Commander screen wake lock lifecycle',()=>{
 it('releases on hide, reacquires on return, and releases on leaving the room',async()=>{
  let visible=true,changed=()=>{};const first=sentinel(),second=sentinel(),request=vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second),status=vi.fn(),unlisten=vi.fn();
  const controller=keepTableAwake({request,visible:()=>visible,listen:fn=>{changed=fn;return unlisten;}},status);await flush();expect(status).toHaveBeenLastCalledWith('active');
  visible=false;changed();expect(first.release).toHaveBeenCalledOnce();expect(status).toHaveBeenLastCalledWith('paused');
  visible=true;changed();await flush();expect(request).toHaveBeenCalledTimes(2);expect(status).toHaveBeenLastCalledWith('active');
  controller.dispose();expect(second.release).toHaveBeenCalledOnce();expect(unlisten).toHaveBeenCalledOnce();
 });
 it('releases a late request after the component has been switched off or unmounted',async()=>{
  let resolve!:(lock:ScreenLock)=>void;const lock=sentinel(),status=vi.fn();const controller=keepTableAwake({request:()=>new Promise(r=>{resolve=r;}),visible:()=>true,listen:()=>()=>{}},status);
  controller.dispose();resolve(lock);await flush();expect(lock.release).toHaveBeenCalledOnce();expect(status).not.toHaveBeenCalledWith('active');
 });
 it('handles unsupported browsers and a denied request without claiming the screen is awake',async()=>{
  const status=vi.fn(),env={visible:()=>true,listen:()=>()=>{}};const unsupported=keepTableAwake(env,status);expect(status).toHaveBeenLastCalledWith('unavailable');unsupported.dispose();
  const denied=keepTableAwake({...env,request:async()=>{throw Error('low battery');}},status);await flush();expect(status).toHaveBeenLastCalledWith('unavailable');denied.dispose();
 });
 it('shows system releases and lets the player retry without a request loop',async()=>{
  const lock=sentinel(),request=vi.fn(async()=>lock),status=vi.fn();const controller=keepTableAwake({request,visible:()=>true,listen:()=>()=>{}},status);await flush();await lock.release();expect(status).toHaveBeenLastCalledWith('paused');expect(request).toHaveBeenCalledOnce();controller.dispose();
 });
 it('does not request while hidden and waits for the visible event',async()=>{
  let visible=false,changed=()=>{};const lock=sentinel(),request=vi.fn(async()=>lock),status=vi.fn();const controller=keepTableAwake({request,visible:()=>visible,listen:fn=>{changed=fn;return()=>{};}},status);expect(request).not.toHaveBeenCalled();visible=true;changed();await flush();expect(status).toHaveBeenLastCalledWith('active');controller.dispose();
 });
});
