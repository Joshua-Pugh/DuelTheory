import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
const api=process.argv[2]||'http://127.0.0.1:8793',alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const code=Array.from(randomBytes(8),b=>alphabet[b%alphabet.length]).join(''),a=randomBytes(32).toString('hex'),b=randomBytes(32).toString('hex');
async function call(token,method,body={},expected=200,id=randomUUID()){
 const res=await fetch(`${api}/rooms/${code}/${method}`,{method:method==='read'?'GET':'POST',headers:{Origin:'https://joshua-pugh.github.io',Authorization:`Bearer ${token}`,...(method==='read'?{}:{'Content-Type':'application/json','X-Request-ID':id})},...(method==='read'?{}:{body:JSON.stringify(body)})});
 const data=await res.json();assert.equal(res.status,expected,JSON.stringify(data));return data;
}
const profile={schemaVersion:1,name:'Original game check',health:{label:'Resolve',start:35,defeatAt:0},counters:[{label:'Energy',start:3,defeatAt:null},{label:'Corruption',start:0,defeatAt:6}],sourceDamage:{enabled:true,label:'Injury',defeatAt:12}};
await call(a,'create',{title:'Invalid profile check',name:'Host',sources:['Unit'],capacity:2,profile:{...profile,health:{...profile.health,start:-1}}},400);
const host=await call(a,'create',{title:'DT Table Companion check',name:'Host',sources:['Unit'],capacity:2,profile},201);
const guest=await call(b,'join',{name:'Guest',sources:['Unit'],profile:{...profile,health:{...profile.health,start:999}}});
assert.deepEqual(guest.state.profile,profile);assert.equal(guest.state.players[1].life,35);assert.equal(guest.state.players[1].counters.Energy,3);
assert.ok(!JSON.stringify(guest).includes(a));assert.ok(!JSON.stringify(guest).includes(b));
await call(b,'action',{type:'adjust',field:'life',delta:-1},400);
await call(a,'action',{type:'start'});
for(let i=0;i<30;i++){
 const {state}=await call(a,'read');if(state.firstPlayer.winner)break;
 await Promise.all([[a,host.playerId],[b,guest.playerId]].filter(([,id])=>state.firstPlayer.eligible.includes(id)).map(([token])=>call(token,'action',{type:'roll',round:state.firstPlayer.round})));
}
assert.ok((await call(a,'read')).state.firstPlayer.winner);
const id=randomUUID();await call(b,'action',{type:'adjust',field:'counter',key:'Energy',delta:4,playerId:host.playerId},200,id);await call(b,'action',{type:'adjust',field:'counter',key:'Energy',delta:4},200,id);
let {state}=await call(a,'read');assert.equal(state.players[0].counters.Energy,3);assert.equal(state.players[1].counters.Energy,7);
await call(b,'action',{type:'adjust',field:'damage',key:`${host.playerId}:0`,delta:12,loseLife:true});
state=(await call(a,'read')).state;assert.equal(state.players[1].life,23);assert.match(state.log[0].text,/eliminated.*Host wins/);
await call(b,'action',{type:'adjust',field:'damage',key:`${host.playerId}:0`,delta:-1});
state=(await call(a,'read')).state;assert.match(state.log[0].text,/restored after correction/);
await call(b,'action',{type:'adjust',field:'counter',key:'Corruption',delta:6});state=(await call(a,'read')).state;assert.match(state.log[0].text,/6\+ Corruption/);
await call(b,'action',{type:'reset'},400);await call(a,'action',{type:'reset'});state=(await call(b,'read')).state;
assert.deepEqual(state.profile,profile);assert.deepEqual(state.players.map(p=>p.life),[35,35]);assert.deepEqual(state.players[1].counters,{Energy:3,Corruption:0});assert.equal(state.started,false);
console.log('PASS: portable profiles, validation, unchanged join settings, ready gate, authenticated own-seat edits, idempotency, linked damage, custom defeat/correction and reset ('+code+').');
