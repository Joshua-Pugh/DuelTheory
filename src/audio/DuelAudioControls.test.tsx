// @vitest-environment happy-dom
import {it,expect,vi} from 'vitest';
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import DuelAudioControls from './DuelAudioControls';
import {soundManager} from './SoundManager';
it('recovers muted audio, restores a usable volume, and plays a preview from the button',async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});let created=0;
 class Context{state='running';currentTime=1;destination={};constructor(){created++;}createGain(){return {gain:{value:0,setTargetAtTime(){}},connect(){}};}close(){this.state='closed';return Promise.resolve();}}
 vi.stubGlobal('AudioContext',Context);
 const effect=vi.spyOn(soundManager as unknown as {effect:(event:string,time:number,intensity:number)=>void},'effect').mockImplementation(()=>{});
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 try{
  soundManager.update({enabled:false,volume:0});act(()=>root.render(<DuelAudioControls/>));expect(host.querySelector('summary')?.textContent).toContain('Muted');
  const button=Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='Enable / recover audio')!;
  await act(async()=>{button.click();await Promise.resolve();});
  expect(soundManager.settings).toMatchObject({enabled:true,volume:0.65});expect(created).toBeGreaterThan(0);expect(effect).toHaveBeenCalled();expect(host.textContent).toContain('Audio restarted. Playing preview.');
 }finally{act(()=>root.unmount());host.remove();effect.mockRestore();soundManager.stop();vi.unstubAllGlobals();localStorage.clear();}
});
