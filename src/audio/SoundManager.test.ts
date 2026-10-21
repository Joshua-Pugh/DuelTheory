// @vitest-environment happy-dom
import {afterEach,expect,it,vi} from 'vitest';
import {SoundManager} from './SoundManager';
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();localStorage.clear();});
it.each(['suspended','interrupted'])('resumes %s audio and primes output before resume finishes',async state=>{
 const calls:string[]=[];
 class Context{
  state=state;sampleRate=48000;destination={};
  createGain(){return {gain:{value:0},connect(){}};}
  resume(){calls.push('resume');return Promise.resolve().then(()=>{calls.push('resumed');this.state='running';});}
  createBuffer(){return {};}
  createBufferSource(){return {buffer:null,onended:null,connect(){},disconnect(){},start(){calls.push('start');}};}
 }
 vi.stubGlobal('AudioContext',Context);
 await new SoundManager().unlock();
 expect(calls).toEqual(['resume','start','resumed']);
});
it('recreates a closed context',async()=>{
 let created=0;
 class Context{state='closed';destination={};constructor(){created++;}createGain(){return {gain:{value:0},connect(){}};}resume(){this.state='running';return Promise.resolve();}createBuffer(){return {};}createBufferSource(){return {connect(){},start(){}};}}
 vi.stubGlobal('AudioContext',Context);
 const manager=new SoundManager();await manager.unlock();
 // Simulate a browser closing its context between interactions.
 (manager as unknown as {context:Context}).context.state='closed';
 await manager.unlock();expect(created).toBe(2);
});
it('plays a fresh event after asynchronous audio resume instead of losing it',async()=>{
 let complete!:()=>void;
 class Context{
  state='suspended';currentTime=1;sampleRate=48000;destination={};
  createGain(){return {gain:{value:0},connect(){}};}
  resume(){return new Promise<void>(resolve=>{complete=()=>{this.state='running';resolve();};});}
  createBuffer(){return {};}
  createBufferSource(){return {buffer:null,onended:null,connect(){},disconnect(){},start(){}};}
 }
 vi.stubGlobal('AudioContext',Context);
 const manager=new SoundManager(),effect=vi.spyOn(manager as unknown as {effect:(event:string,time:number,intensity:number)=>void},'effect').mockImplementation(()=>{});
 manager.play([{event:'draw'}]);expect(effect).not.toHaveBeenCalled();complete();
 await vi.waitFor(()=>expect(effect).toHaveBeenCalledTimes(1));expect(effect.mock.calls[0][0]).toBe('draw');
});
it.each(['stale','stopped'])('does not replay %s events when audio resumes later',async reason=>{
 vi.useFakeTimers();let complete!:()=>void;
 class Context{
  state='suspended';currentTime=1;sampleRate=48000;destination={};
  createGain(){return {gain:{value:0},connect(){}};}
  resume(){return new Promise<void>(resolve=>{complete=()=>{this.state='running';resolve();};});}
  createBuffer(){return {};}
  createBufferSource(){return {buffer:null,onended:null,connect(){},disconnect(){},start(){}};}
 }
 vi.stubGlobal('AudioContext',Context);
 const manager=new SoundManager(),effect=vi.spyOn(manager as unknown as {effect:(event:string,time:number,intensity:number)=>void},'effect').mockImplementation(()=>{});
 manager.play([{event:'attack'}]);if(reason==='stale')await vi.advanceTimersByTimeAsync(1000);else manager.stop();complete();await vi.advanceTimersByTimeAsync(0);expect(effect).not.toHaveBeenCalled();
});
it('explicit recovery closes the old device connection and creates a fresh one',async()=>{
 let created=0,closed=0;
 class Context{
  state='running';currentTime=1;sampleRate=48000;destination={};constructor(){created++;}
  createGain(){return {gain:{value:0},connect(){}};}
  close(){closed++;this.state='closed';return Promise.resolve();}
 }
 vi.stubGlobal('AudioContext',Context);
 const manager=new SoundManager();await manager.unlock();expect(await manager.recover()).toBe(true);expect(created).toBe(2);expect(closed).toBe(1);
});
