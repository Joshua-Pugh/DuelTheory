import {useEffect,useState} from 'react';
import type {RoomSeat} from './table/client';
import {loadRoomBackground} from './table/backgrounds';
export default function TablePlayerBackground({seat,playerId,version}:{seat:RoomSeat;playerId:string;version?:string}){
 const [image,setImage]=useState('');
 useEffect(()=>{setImage('');if(!version)return;const controller=new AbortController();let url='';void loadRoomBackground(seat,playerId,version,controller.signal).then(blob=>{if(controller.signal.aborted)return;url=URL.createObjectURL(blob);setImage(url);}).catch(()=>{});return()=>{controller.abort();if(url)URL.revokeObjectURL(url);};},[seat.api,seat.code,seat.token,playerId,version]);
 return image?<img className="ct-panel-background" src={image} alt="" aria-hidden="true"/>:null;
}
