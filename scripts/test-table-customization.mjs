import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
const api=process.argv[2]||'http://127.0.0.1:8795',code=Array.from(randomBytes(8),b=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b%32]).join('');
const a=randomBytes(32).toString('hex'),b=randomBytes(32).toString('hex'),outsider=randomBytes(32).toString('hex');
async function call(token,method,body={},expected=200,id=randomUUID()){
 const response=await fetch(`${api}/rooms/${code}/${method}`,{method:method==='read'?'GET':'POST',headers:{Origin:'https://dueltheory.com',Authorization:`Bearer ${token}`,'Content-Type':'application/json','X-Request-ID':id},...(method==='read'?{}:{body:JSON.stringify(body)})});const result=await response.json();assert.equal(response.status,expected,JSON.stringify(result));return result;
}
const profile={schemaVersion:1,name:'Image test',health:{label:'Life',start:20,defeatAt:0},counters:[],sourceDamage:{enabled:false,label:'Damage',defeatAt:null}};
const host=await call(a,'create',{title:'Disposable customization test',name:'Host',sources:['Host'],capacity:2,profile},201),guest=await call(b,'join',{name:'Guest',sources:['Guest']});
await call(b,'action',{type:'tableTheme',theme:'wine'},400);await call(a,'action',{type:'tableTheme',theme:'wine'});await call(b,'action',{type:'appearance',theme:'ocean',accent:'#eecc88'});
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX2kAAAAASUVORK5CYII=','base64');
async function image(token,bytes,expected=200,target=guest.playerId,id=randomUUID()){
 const r=await fetch(`${api}/rooms/${code}/background?player=${target}`,{method:bytes===undefined?'GET':'POST',headers:{Origin:'https://dueltheory.com',Authorization:`Bearer ${token}`,'Content-Type':'image/png','X-Request-ID':id},...(bytes===undefined?{}:{body:bytes})});assert.equal(r.status,expected,await r.clone().text());return r;
}
await image(outsider,png,403);await image(b,Buffer.from('<svg onload="alert(1)"/>'),400);await image(b,Buffer.alloc(131073),400);
const uploadId=randomUUID();await image(b,png,200,guest.playerId,uploadId);await image(b,png,200,guest.playerId,uploadId);
const downloaded=await image(a,undefined);assert.equal(downloaded.headers.get('content-type'),'image/png');assert.equal(downloaded.headers.get('x-content-type-options'),'nosniff');assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()),png);
await image(outsider,undefined,403);assert.equal((await call(a,'read')).state.players.find(p=>p.id===guest.playerId).theme,'ocean');
await call(b,'action',{type:'leave'});await call(b,'read',{},410);await image(b,undefined,403);await image(a,undefined,404);
let state=(await call(a,'read')).state;assert.equal(state.players.length,1);assert.equal(state.capacity,2);
const rejoin=await call(b,'join',{name:'Replacement',sources:['Replacement']});assert.notEqual(rejoin.playerId,guest.playerId);assert.equal(rejoin.state.players.length,2);assert.equal(rejoin.state.players[1].life,20);
await image(a,png,200,host.playerId);state=(await call(a,'read')).state;await call(a,'action',{type:'closeRoom',revision:state.revision});await image(a,undefined,403,host.playerId);
console.log('PASS: private bounded raster uploads, member-only reads, theme ownership, leave/rejoin with a fresh seat, background removal and closure ('+code+').');
