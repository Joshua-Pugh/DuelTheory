// @vitest-environment happy-dom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {expect,it,vi} from 'vitest';
import TableTurnControls from './TableTurnControls';
import {newTableRoom,applyRoomCommand} from './table/model';

it('requests one authoritative roll, shows results on the die, then hides the dice until a new game starts',async()=>{
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
  expect(host.querySelector('[aria-label="First-player dice"]')).toBeNull();expect(host.textContent).toContain('End my turn');state=applyRoomCommand(state,'a',{type:'endTurn',turn:state.turn!},'next');await render();expect(host.querySelector('[aria-label="First-player dice"]')).toBeNull();state=applyRoomCommand(state,'a',{type:'reset'},'new-game');state=applyRoomCommand(state,'a',{type:'start'},'restart');await render();expect(host.querySelector('[aria-label="First-player dice"]')).not.toBeNull();expect(host.textContent).toContain('Roll die · d6');
 }finally{await act(()=>root.unmount());host.remove();}
});


it('hides completed dice with turn passing disabled and in direct dice renders',async()=>{const {renderToStaticMarkup}=await import('react-dom/server');const {default:Dice}=await import('./TableFirstPlayerDice');let s=newTableRoom('ABCDEFGH','No turns',2,'a');for(const id of ['a','b'])s=applyRoomCommand(s,id,{type:'join',name:id,sources:[id]},'join-'+id);s=applyRoomCommand(s,'a',{type:'start'},'start');for(const id of ['a','b'])s=applyRoomCommand(s,id,{type:'roll',round:1},'roll-'+id,0,()=>id==='a'?6:2);const props={state:s,playerId:'a',busy:false,onChange:()=>{}};expect(renderToStaticMarkup(<Dice {...props}/>)).toBe('');const html=renderToStaticMarkup(<TableTurnControls {...props}/>);expect(html).toContain('a');expect(html).not.toContain('dt-table-die');});
