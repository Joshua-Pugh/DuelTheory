import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
const api=process.argv[2]||'http://127.0.0.1:8787';
if(!/^https?:\/\//.test(api))throw Error('Supply a room service URL.');
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',code=Array.from(randomBytes(8),b=>alphabet[b%alphabet.length]).join('');
const a=randomBytes(32).toString('hex'),b=randomBytes(32).toString('hex');
async function call(token,method,body={},id=randomUUID(),expected=200,origin='https://joshua-pugh.github.io'){
 const res=await fetch(`${api}/rooms/${code}/${method}`,{method:method==='read'?'GET':'POST',headers:{Origin:origin,Authorization:`Bearer ${token}`,...(method==='read'?{}:{'Content-Type':'application/json','X-Request-ID':id})},...(method==='read'?{}:{body:JSON.stringify(body)})});
 const data=await res.json();assert.equal(res.status,expected,JSON.stringify(data));return data;
}
const host=await call(a,'create',{title:'DT automated room check',capacity:2,name:'Host',commanders:['Test Commander']},randomUUID(),201);
const guest=await call(b,'join',{name:'Guest',commanders:['Test Commander','Test Partner']});
assert.equal(guest.state.players.length,2);assert.equal(guest.state.players[1].life,40);
assert.ok(!JSON.stringify(guest).includes(a));assert.ok(!JSON.stringify(guest).includes(b));assert.ok(!('members' in guest));
await call(b,'action',{type:'adjust',field:'life',delta:-1},randomUUID(),400);
let read;
await call(a,'action',{type:'start'});await call(randomBytes(32).toString('hex'),'join',{name:'Late',commanders:['Late']},randomUUID(),400);
for(let i=0;i<100;i++){
 read=await call(a,'read');if(read.state.firstPlayer.winner)break;
 const round=read.state.firstPlayer.round;
 await Promise.all([[a,host.playerId],[b,guest.playerId]].filter(([,id])=>read.state.firstPlayer.eligible.includes(id)).map(([token])=>call(token,'action',{type:'roll',round})));
}
read=await call(a,'read');assert.ok(read.state.firstPlayer.winner);assert.equal(read.state.turn,1);assert.equal(read.state.turnOrder[0],read.state.firstPlayer.winner);
const hitId=randomUUID();await call(b,'action',{type:'adjust',field:'life',delta:-7,playerId:host.playerId},hitId);
await call(b,'action',{type:'adjust',field:'life',delta:-7},hitId); // Retry must be idempotent.
read=await call(a,'read');assert.equal(read.state.players[0].life,40);assert.equal(read.state.players[1].life,33);
await call(randomBytes(32).toString('hex'),'action',{type:'adjust',field:'life',delta:-99},randomUUID(),403);
await call(b,'action',{type:'reset'},randomUUID(),400);
await call(b,'action',{type:'adjust',field:'damage',key:`${host.playerId}:0`,delta:4,loseLife:true});
read=await call(a,'read');assert.equal(read.state.players[1].life,29);assert.equal(read.state.players[1].damage[`${host.playerId}:0`],4);
const concurrent=await Promise.all(Array.from({length:5},()=>call(b,'action',{type:'adjust',field:'poison',delta:1})));assert.ok(concurrent.every(r=>r.playerId===guest.playerId));
read=await call(a,'read');assert.equal(read.state.players[1].poison,5);
const winnerToken=read.state.firstPlayer.winner===host.playerId?a:b;
await call(winnerToken,'action',{type:'endTurn',turn:1});await call(winnerToken,'action',{type:'endTurn',turn:1},randomUUID(),400);
read=await call(b,'read');assert.equal(read.state.turn,2);
await call(b,'action',{type:'adjust',field:'damage',key:`${host.playerId}:0`,delta:17,loseLife:false});
read=await call(a,'read');assert.equal(read.state.players[1].damage[`${host.playerId}:0`],21);assert.match(read.state.log[0].text,/eliminated.*Host wins/);
await call(a,'action',{type:'endTurn',turn:read.state.turn},randomUUID(),400);
await call(b,'action',{type:'adjust',field:'damage',key:`${host.playerId}:0`,delta:-1,loseLife:false});
read=await call(a,'read');assert.match(read.state.log[0].text,/restored after correction/);
await call(b,'action',{type:'adjust',field:'poison',delta:5});read=await call(a,'read');assert.match(read.state.log[0].text,/eliminated.*Host wins/);
await call(b,'action',{type:'adjust',field:'poison',delta:-1});await call(b,'action',{type:'adjust',field:'life',delta:-29});read=await call(a,'read');assert.equal(read.state.players[1].life,0);assert.match(read.state.log[0].text,/eliminated.*Host wins/);
await call(a,'read',{},randomUUID(),403,'https://untrusted.example');
await call(a,'action',{type:'reset'});read=await call(b,'read');assert.deepEqual(read.state.players.map(p=>p.life),[40,40]);assert.deepEqual(read.state.players.map(p=>p.poison),[0,0]);
console.log('PASS: two seats synchronize, only own values change, retries are idempotent, concurrent changes persist, host controls and CORS are enforced.');
