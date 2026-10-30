import {MAX_BACKGROUND_BYTES,backgroundMime} from './appearance';
import type {RoomSeat,RoomReply} from './client';
import {requestSignal} from '../platform/polling';
const localKey='dueltheory.table.background.v1';
export function savedBackground(){try{const data=localStorage.getItem(localKey);return data?.startsWith('data:image/jpeg;base64,')&&data.length<180000?data:null;}catch{return null;}}
export function rememberBackground(data:string|null){if(data)localStorage.setItem(localKey,data);else localStorage.removeItem(localKey);}
export function savedBackgroundBlob(data:string){if(!data.startsWith('data:image/jpeg;base64,')||data.length>180000)throw Error('Invalid saved image.');const bytes=Uint8Array.from(atob(data.split(',')[1]),c=>c.charCodeAt(0));if(backgroundMime(bytes)!=='image/jpeg')throw Error('Invalid saved image.');return new Blob([bytes],{type:'image/jpeg'});}
export async function prepareBackground(file:File):Promise<Blob>{
 if(file.size>6*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPG, PNG or WebP image under 6 MB.');
 const url=URL.createObjectURL(file),image=new Image();
 try{
  image.src=url;await image.decode();if(image.naturalWidth*image.naturalHeight>24000000)throw Error('Choose an image under 24 megapixels.');
  const scale=Math.min(1,960/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  const context=canvas.getContext('2d');if(!context)throw Error('Image preparation is unavailable.');context.fillStyle='#18281f';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
  for(const quality of [.82,.65,.45,.25]){const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));if(blob&&blob.size<=MAX_BACKGROUND_BYTES)return blob;}
  throw Error('This image is too detailed. Choose a simpler or smaller image.');
 }finally{URL.revokeObjectURL(url);}
}
export function backgroundDataUrl(blob:Blob):Promise<string>{return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('Could not save image.'));reader.readAsDataURL(blob);});}
export async function setRoomBackground(seat:RoomSeat,blob:Blob|null):Promise<RoomReply>{
 const timeout=requestSignal(15000);try{const result=await fetch(`${seat.api}/rooms/${seat.code}/background`,{method:'POST',headers:{Authorization:`Bearer ${seat.token}`,'Content-Type':blob?.type||'application/octet-stream','X-Request-ID':crypto.randomUUID()},body:blob??new Uint8Array(),signal:timeout.signal});const body=await result.json();if(!result.ok)throw Error(body.error||'Could not upload background.');return body;}finally{timeout.dispose();}
}
export async function loadRoomBackground(seat:RoomSeat,player:string,version:string,signal:AbortSignal):Promise<Blob>{
 const response=await fetch(`${seat.api}/rooms/${seat.code}/background?player=${encodeURIComponent(player)}&version=${encodeURIComponent(version)}`,{headers:{Authorization:`Bearer ${seat.token}`},signal});if(!response.ok)throw Error('Background unavailable.');
 const bytes=new Uint8Array(await response.arrayBuffer()),mime=backgroundMime(bytes);if(!mime)throw Error('Invalid background.');return new Blob([bytes],{type:mime});
}
