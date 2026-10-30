// @vitest-environment happy-dom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {beforeEach,afterEach,expect,it,vi} from 'vitest';
import type {RoomReply} from './client';
const mocks=vi.hoisted(()=>({send:vi.fn(),poll:null as null|{onValue:(reply:RoomReply)=>void;onError:(error:unknown)=>void}}));
vi.mock('../platform/polling',()=>({startVisiblePolling:(options:NonNullable<typeof mocks.poll>)=>{mocks.poll=options;return()=>{mocks.poll=null;};}}));
vi.mock('./client',async importOriginal=>({...await importOriginal<typeof import('./client')>(),roomRequest:mocks.send}));
vi.mock('../TableNotifications',()=>({default:()=>null}));
import TableCompanion from '../TableCompanion';
import {newTableRoom,applyRoomCommand} from './model';
import {RoomRequestError,saveRoomSeat,savedRoomSeat} from './client';
let root:Root,element:HTMLDivElement;
function room(){let s=newTableRoom('ABCDEFGH','Lifecycle test',2,'a');for(const id of ['a','b'])s=applyRoomCommand(s,id,{type:'join',name:id,sources:[id]},'j'+id);return s;}
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});localStorage.clear();history.replaceState(null,'','/#/companion');mocks.send.mockReset();Object.assign(window,{confirm:vi.fn(()=>true)});element=document.createElement('div');document.body.append(element);root=createRoot(element);});
afterEach(()=>{act(()=>root.unmount());element.remove();vi.restoreAllMocks();});
async function mount(playerId='a'){
 saveRoomSeat({code:'ABCDEFGH',playerId,token:'test-seat',api:'https://example.com'});
 await act(async()=>root.render(<TableCompanion/>));await act(async()=>mocks.poll!.onValue({state:room(),playerId}));
}
it('automatically leaves and forgets the guest seat when a confirmed closure arrives',async()=>{
 await mount('b');const closed=applyRoomCommand(room(),'a',{type:'closeRoom',revision:room().revision},'close');
 await act(async()=>mocks.poll!.onValue({state:closed,playerId:'b'}));
 expect(element.textContent).toContain('The host closed this table');expect(element.textContent).toContain('Join a room');expect(savedRoomSeat()).toBeNull();expect(savedRoomSeat('ABCDEFGH')).toBeNull();
});
it('does not silently abandon the host seat on a failed closure, and leaves on confirmed success',async()=>{
 await mount();mocks.send.mockRejectedValueOnce(Error('Offline'));
 const close=()=>[...element.querySelectorAll('button')].find(b=>b.textContent?.includes('Close table & leave'))!;
 await act(async()=>close().click());expect(savedRoomSeat()).not.toBeNull();expect(element.textContent).toContain('Offline');
 mocks.send.mockResolvedValueOnce({state:applyRoomCommand(room(),'a',{type:'closeRoom',revision:room().revision},'close'),playerId:'a'});
 await act(async()=>close().click());expect(savedRoomSeat()).toBeNull();expect(element.textContent).toContain('Everyone has been disconnected');
});
it('allows cancellation before closing and keeps guest disconnect separate',async()=>{
 await mount();vi.mocked(window.confirm).mockReturnValue(false);
 await act(async()=>[...element.querySelectorAll('button')].find(b=>b.textContent?.includes('Close table & leave'))!.click());expect(mocks.send).not.toHaveBeenCalled();expect(savedRoomSeat()).not.toBeNull();
});
it('removes a guest on the server before forgetting the freed seat',async()=>{
 await mount('b');mocks.send.mockResolvedValueOnce({state:applyRoomCommand(room(),'b',{type:'leave'},'leave'),playerId:'b'});
 await act(async()=>[...element.querySelectorAll('button')].find(b=>b.textContent?.trim()==='Leave table')!.click());expect(mocks.send).toHaveBeenCalled();expect(savedRoomSeat()).toBeNull();expect(savedRoomSeat('ABCDEFGH')).toBeNull();expect(element.textContent).toContain('seat is now available');
});
it('keeps the guest seat when leaving cannot be confirmed',async()=>{
 await mount('b');mocks.send.mockRejectedValueOnce(Error('Offline'));await act(async()=>[...element.querySelectorAll('button')].find(b=>b.textContent?.trim()==='Leave table')!.click());expect(savedRoomSeat()?.playerId).toBe('b');expect(element.textContent).toContain('Offline');
});

it('releases a stale local seat after the server confirms the room expired',async()=>{await mount('b');await act(async()=>mocks.poll!.onError(new RoomRequestError('Room not found',404)));expect(savedRoomSeat()).toBeNull();expect(element.textContent).toContain('This table expired');expect(element.textContent).toContain('Join a room');});
