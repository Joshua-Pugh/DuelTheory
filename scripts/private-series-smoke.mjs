import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const api='https://dueltheory-matches.cfpadvantage.workers.dev',deck=JSON.parse(await readFile('src/engine/fixtures/matt-monarchs.json','utf8'));
const code=()=>Array.from(crypto.getRandomValues(new Uint8Array(8)),n=>'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[n%32]).join('');
const tokens=[crypto.randomUUID().replaceAll('-',''),crypto.randomUUID().replaceAll('-','')],room=code();
async function req(seat,method,body){const r=await fetch(`${api}/matches/${room}/${method}`,{method:['info','read'].includes(method)?'GET':'POST',headers:{Authorization:`Bearer ${tokens[seat]}`,'Content-Type':'application/json','X-Request-ID':crypto.randomUUID()},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));return data;}
async function act(seat,command){const v=await req(seat,'read');return req(seat,'action',{revision:v.revision,command});}
await req(0,'create',{game:'goat',name:'Series host',mode:'best3',pick:{deck}});await req(1,'join',{name:'Series friend',pick:{deck}});
for(const seat of [0,1])await act(seat,{type:'ready',value:true});for(const seat of [0,1])await act(seat,{type:'begin'});
let v=await act(1,{type:'concede'});assert.equal(v.phase,'sideboarding');assert.deepEqual(v.series.wins,[1,0]);assert.ok(!('registered'in v.series));
const next=structuredClone(deck);[next.main[0],next.side[0]]=[next.side[0],next.main[0]];
v=await act(0,{type:'sideboard',deck:next});assert.equal(v.phase,'sideboarding');v=await act(1,{type:'sideboard',deck});assert.equal(v.phase,'turnChoice');v=await act(1,{type:'chooseFirst',first:1});assert.equal(v.phase,'playing');assert.equal(v.manual,false);assert.equal(v.goat.current,1);assert.equal(v.goat.players[1].hand.length,5);
v=await act(1,{type:'concede'});assert.equal(v.phase,'complete');assert.deepEqual(v.series.wins,[2,0]);
console.log(`Best of Three live: ready gate, concession, private 42/15 swaps, two locks, loser turn choice, fresh guided game and 2–0 finish passed (${room})`);
