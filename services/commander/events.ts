import {DurableObject} from 'cloudflare:workers';
import {newEvent,operateEvent,eventReply,type EventStore} from '../../src/event/model';
import {RoomError} from '../../src/table/model';
export class EventHub extends DurableObject<Env>{
 constructor(ctx:DurableObjectState,env:Env){super(ctx,env);ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS event (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL)');}
 private load(){const row=this.ctx.storage.sql.exec<{data:string}>('SELECT data FROM event WHERE id=1').toArray()[0];return row?JSON.parse(row.data) as EventStore:null;}
 private save(s:EventStore){this.ctx.storage.sql.exec('INSERT INTO event(id,data) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',JSON.stringify(s));}
 operate(code:string,hash:string,method:string,input:Record<string,unknown>,requestId:string){
  try{
   let s=this.load();
   if(method==='create'){
    if(s){if(s.owner===hash)return {status:200,body:eventReply(s,hash)};return {status:409,body:{error:'This event code is already in use.'}};}
    s=newEvent(code,hash,input);this.save(s);return {status:201,body:eventReply(s,hash)};
   }
   if(!s)return {status:404,body:{error:'Event not found. Check the event code or open a saved hub.'}};
   if(method==='action'){s=operateEvent(s,hash,input,requestId);this.save(s);}
   return {status:200,body:eventReply(s,hash)};
  }catch(e){if(e instanceof RoomError||e instanceof Error&&e.message.startsWith('Invalid table profile'))return {status:400,body:{error:e.message}};throw e;}
 }
}
