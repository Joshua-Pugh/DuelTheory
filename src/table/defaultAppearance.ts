import {autoAppearanceEnabled,savedAppearance} from './appearance';
import {savedBackground,savedBackgroundBlob,setRoomBackground} from './backgrounds';
import {roomRequest,type RoomSeat} from './client';
import type {TableRoomState} from './model';
/** Explicit device-level opt-in; never overwrite a seat merely reconnecting. */
export async function applySavedAppearanceToRoom(seat:RoomSeat,onState:(s:TableRoomState)=>void,isCurrent:()=>boolean){
 if(!autoAppearanceEnabled()||!isCurrent())return;
 const appearance=savedAppearance();
 const colors=await roomRequest(seat.api,seat.code,seat.token,'action',{type:'appearance',...appearance});
 if(!isCurrent())return;onState(colors.state);
 const image=savedBackground();
 if(image){const reply=await setRoomBackground(seat,savedBackgroundBlob(image));if(isCurrent())onState(reply.state);}
}
