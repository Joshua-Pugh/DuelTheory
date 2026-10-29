// @vitest-environment happy-dom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {expect,it,vi} from 'vitest';
import TableTurnControls from './TableTurnControls';
import {newTableRoom,applyRoomCommand} from './table/model';

it('requests one authoritative roll, shows results on the die, and retains them after turn order starts',async()=>{
 let state=newTableRoom('ABCDEFGH','Dice test',2,'a');
 for(const id of ['a','b'])state=applyRoomCommand(state,id,{type:'join',name:id,sources:[id]},'join-'+id);
 state=applyRoomCommand(state,'a',{type:'configureTurns',enabled:true,revision:state.revision},'turns');state=applyRoomCommand(state,'a',{type:'start'},'start');
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host),change=vi.fn();
 const render=()=>act(()=>root.render(<TableTurnControls state={state} playerId="a" busy={false} onChange={change}/>));
 try{
  await render();const button=[...host.querySelectorAll('button')].find(b=>b.textContent==='Roll die · d6')!;
  await act(()=>button.click());expect(change).toHaveBeenCalledExactlyOnceWith({type:'roll',round:1});
  state=applyRoomCommand(state,'a',{type:'roll',round:1},'roll-a',0,()=>6);await render();
  expect(host.querySelector('[aria-label="Rolled 6"]')).not.toBeNull();expect([...host.querySelectorAll('button')].find(b=>b.textContent==='Waiting for other players')?.disabled).toBe(true);
  state=applyRoomCommand(state,'b',{type:'roll',round:1},'roll-b',0,()=>2);await render();
  expect(host.textContent).toContain('a goes first.');expect(host.querySelector('[aria-label="Rolled 6"]')).not.toBeNull();expect(host.querySelector('[aria-label="Rolled 2"]')).not.toBeNull();expect(host.textContent).toContain('End my turn');
 }finally{await act(()=>root.unmount());host.remove();}
});

