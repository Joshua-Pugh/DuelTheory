import {describe,it,expect} from 'vitest';
import {incomingChat} from './chatAlerts';
const message=(id:string,seat:0|1=1)=>({id,seat,text:'Hello',at:1});
describe('in-game chat alerts',()=>{
 it('does not replay history or alert for the player’s own messages',()=>{expect(incomingChat(null,[message('old')],0)).toEqual([]);expect(incomingChat(['old'],[message('old'),message('self',0),message('new')],0).map(m=>m.id)).toEqual(['new']);});
 it('detects incoming messages even when the retained history stays at 100 entries',()=>{const old=Array.from({length:100},(_,i)=>String(i));const next=old.slice(1).map(id=>message(id));next.push(message('100'));expect(incomingChat(old,next,0).map(m=>m.id)).toEqual(['100']);expect(incomingChat(next.map(m=>m.id),next,0)).toEqual([]);});
});
