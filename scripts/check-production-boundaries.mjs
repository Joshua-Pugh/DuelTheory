import assert from 'node:assert/strict';
const matchApi=process.env.MATCH_TEST_API||'http://127.0.0.1:8788',tableApi=process.env.TABLE_TEST_API||'http://127.0.0.1:8787';
const code=()=>Array.from(crypto.getRandomValues(new Uint8Array(8)),v=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[v%32]).join('');
const tokens=[crypto.randomUUID().replaceAll('-',''),crypto.randomUUID().replaceAll('-','')],room=code();
async function request(base,path,token,body){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json','X-Request-ID':crypto.randomUUID()},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};}
const match=(seat,method,body)=>request(matchApi,`/matches/${room}/${method}`,tokens[seat],body);
let r=await request(matchApi,`/matches/${code()}/create`,tokens[0],{game:'goat',name:'Private test',pick:{deck:{main:[],side:[],extra:[]}}});assert.equal(r.status,403);
r=await request(tableApi,`/events/${code()}/read`,tokens[0]);assert.equal(r.status,403);
r=await request(tableApi,`/events/${code()}/create`,tokens[0],{name:'Private event'});assert.equal(r.status,403);
r=await match(0,'create',{game:'ashen',name:'AT host',pick:{faction:'Brute'}});assert.equal(r.status,200);
r=await match(1,'join',{name:'AT guest',pick:{faction:'Noble'}});assert.equal(r.status,200);
async function command(seat,command,id=crypto.randomUUID()){const current=await match(seat,'read');const response=await fetch(`${matchApi}/matches/${room}/action`,{method:'POST',headers:{Authorization:'Bearer '+tokens[seat],'Content-Type':'application/json','X-Request-ID':id},body:JSON.stringify({revision:current.data.revision,command})});const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));return data;}
await command(0,{type:'ready',value:true});await command(1,{type:'ready',value:true});await command(0,{type:'begin'});let view=await command(1,{type:'begin'});assert.equal(view.phase,'playing');
let first=view.ashen.table.active;await command(first,{type:'ashen',action:{type:'opening',choice:'keep'}});view=await command(first===0?1:0,{type:'ashen',action:{type:'opening',choice:'keep'}});
const other=1;view=(await match(0,'read')).data;assert.ok(view.ashen.table.piles[`${other}:hand`].every(id=>view.ashen.table.cards[id].cardId==='hidden'));
const id=crypto.randomUUID();await command(0,{type:'chat',text:'Connection checked'},id);view=await command(0,{type:'chat',text:'Connection checked'},id);assert.equal(view.chat.length,1);
const profile={schemaVersion:1,name:'Boundary test',health:{label:'Life',start:20,defeatAt:0,tapAmount:1,holdAmount:10},counters:[],sourceDamage:{enabled:false,label:'Source damage',defeatAt:null}},table=code();
r=await request(tableApi,`/rooms/${table}/create`,tokens[0],{title:'Public companion',name:'Host',sources:['Host'],capacity:2,profile});assert.equal(r.status,201,JSON.stringify(r.data));
r=await request(tableApi,`/rooms/${table}/join`,tokens[1],{name:'Guest',sources:['Guest']});assert.equal(r.status,200,JSON.stringify(r.data));
console.log('Production boundaries passed: anonymous private APIs denied; public AT two-seat play, opening hands, hidden information, idempotency and Companion joins work.');
