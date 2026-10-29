// @vitest-environment happy-dom
import {expect,it} from 'vitest';
import {saveRoomSeat,savedRoomSeat,forgetRoomSeat} from './client';
it('forgets closed-room reconnection tokens without forgetting a different active table',()=>{
 localStorage.clear();const a={code:'ABCDEFGH',token:'a',playerId:'a',api:'https://example.com'},b={...a,code:'BCDEFGHJ',token:'b'};
 saveRoomSeat(a);saveRoomSeat(b);forgetRoomSeat(a.code);expect(savedRoomSeat(a.code)).toBeNull();expect(savedRoomSeat()).toEqual(b);expect(savedRoomSeat(b.code)).toEqual(b);
 forgetRoomSeat(b.code);expect(savedRoomSeat()).toBeNull();expect(savedRoomSeat(b.code)).toBeNull();
});
