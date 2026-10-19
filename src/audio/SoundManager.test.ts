// @vitest-environment happy-dom
import {afterEach,expect,it,vi} from 'vitest';
import {SoundManager} from './SoundManager';
afterEach(()=>vi.unstubAllGlobals());
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
