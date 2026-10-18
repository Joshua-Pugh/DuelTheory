import {DurableObject} from 'cloudflare:workers';
import {applyRoomCommand,newCommanderRoom,RoomError,type CommanderRoomState,type RoomCommand} from '../../src/commander/model';
type StoredRoom={state:CommanderRoomState;members:Record<string,string>;requests:Record<string,string>;expires:number};
type Result={status:number;body:{error:string}|{state:CommanderRoomState;playerId:string}};
const lifetime=24*60*60*1000;
export class CommanderRoom extends DurableObject<Env>{
 constructor(ctx:DurableObjectState,env:Env){super(ctx,env);this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS room (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL)');}
 private load():StoredRoom|null{const row=this.ctx.storage.sql.exec<{data:string}>('SELECT data FROM room WHERE id=1').toArray()[0];return row?JSON.parse(row.data):null;}
 private save(room:StoredRoom){this.ctx.storage.sql.exec('INSERT INTO room(id,data) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',JSON.stringify(room));this.ctx.waitUntil(this.ctx.storage.setAlarm(room.expires));}
 async alarm(){const room=this.load();if(room&&room.expires>Date.now())await this.ctx.storage.setAlarm(room.expires);else await this.ctx.storage.deleteAll();}
 operate(code:string,hash:string,method:string,requestId:string,input:Record<string,unknown>):Result{
  try{
   let room=this.load();if(room&&room.expires<Date.now())room=null;
   if(method==='create'){
    if(room){if(room.members[hash]===room.state.host)return {status:200,body:{state:room.state,playerId:room.state.host}};return {status:409,body:{error:'That code is in use. Create a new room.'}};}
    const actor=crypto.randomUUID(),state=newCommanderRoom(code,input.title,input.capacity,actor);
    room={state:applyRoomCommand(state,actor,{type:'join',name:input.name as string,commanders:input.commanders as string[]},requestId),members:{[hash]:actor},requests:{[requestId]:actor},expires:Date.now()+lifetime};this.save(room);return {status:201,body:{state:room.state,playerId:actor}};
   }
   if(!room)return {status:404,body:{error:'Room not found or expired. Rooms last 24 hours after the last change.'}};
   let actor=room.members[hash];
   if(method==='join'){
    if(!actor){actor=crypto.randomUUID();room.state=applyRoomCommand(room.state,actor,{type:'join',name:input.name as string,commanders:input.commanders as string[]},requestId);room.members[hash]=actor;room.requests[requestId]=actor;room.expires=Date.now()+lifetime;this.save(room);}
    return {status:200,body:{state:room.state,playerId:actor}};
   }
   if(!actor)return {status:403,body:{error:'This device does not have a seat in that room. Join the room first.'}};
   if(method==='read')return {status:200,body:{state:room.state,playerId:actor}};
   if(method!=='action')return {status:404,body:{error:'Unknown endpoint.'}};
   if(room.requests[requestId]){if(room.requests[requestId]!==actor)throw new RoomError('Request ID already used.');return {status:200,body:{state:room.state,playerId:actor}};}
   // Identity comes exclusively from the authenticated seat, never a client-supplied target.
   room.state=applyRoomCommand(room.state,actor,input as RoomCommand,requestId);room.requests[requestId]=actor;room.requests=Object.fromEntries(Object.entries(room.requests).slice(-200));room.expires=Date.now()+lifetime;this.save(room);
   return {status:200,body:{state:room.state,playerId:actor}};
  }catch(error){if(error instanceof RoomError)return {status:400,body:{error:error.message}};throw error;}
 }
}
async function boundedJson(request:Request){const reader=request.body?.getReader();if(!reader)throw new RoomError('Missing request body.');let bytes=0,parts:Uint8Array[]=[];while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.length;if(bytes>8192){await reader.cancel();throw new RoomError('Request is too large.');}parts.push(value);}const all=new Uint8Array(bytes);let offset=0;for(const p of parts){all.set(p,offset);offset+=p.length;}try{const data=JSON.parse(new TextDecoder().decode(all));if(!data||typeof data!=='object'||Array.isArray(data))throw Error();return data as Record<string,unknown>;}catch{throw new RoomError('Invalid request body.');}}
export default {
 async fetch(request:Request,env:Env):Promise<Response>{
  const origin=request.headers.get('Origin')||'',allowed=env.ALLOWED_ORIGINS.split(',').map(x=>x.trim());
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Origin':allowed.includes(origin)?origin:allowed[0],'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type, X-Request-ID'};
  const reply=(body:unknown,status=200)=>Response.json(body,{status,headers});
  if(origin&&!allowed.includes(origin))return reply({error:'Origin is not allowed.'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  const url=new URL(request.url);if(url.pathname==='/health')return reply({ok:true,service:'DuelTheory Commander rooms'});
  const match=url.pathname.match(/^\/rooms\/([A-Z2-9]{8})\/(create|join|read|action)$/);if(!match)return reply({error:'Unknown endpoint.'},404);
  const [,code,method]=match;if(request.method!==(method==='read'?'GET':'POST'))return reply({error:'Method not allowed.'},405);
  const token=request.headers.get('Authorization')?.replace(/^Bearer /,'')||'';if(!/^[a-zA-Z0-9_-]{32,128}$/.test(token))return reply({error:'A valid device seat token is required.'},401);
  const requestId=request.headers.get('X-Request-ID')||'';if(method!=='read'&&!/^[a-zA-Z0-9-]{16,80}$/.test(requestId))return reply({error:'A request ID is required.'},400);
  try{
   if(method==='create'||method==='join'){const limit=await env.ROOM_LIMITER.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'});if(!limit.success)return reply({error:'Too many attempts. Please wait a minute.'},429);}
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');
   const input=method==='read'?{}:await boundedJson(request);
   const result=await env.COMMANDER_ROOMS.getByName(code).operate(code,hash,method,requestId,input);return reply(result.body,result.status);
  }catch(error){if(error instanceof RoomError)return reply({error:error.message},400);console.error(JSON.stringify({event:'commander-room-failure',method}));return reply({error:'Room service is temporarily unavailable. Your last confirmed totals are unchanged.'},503);}
 }
} satisfies ExportedHandler<Env>;
