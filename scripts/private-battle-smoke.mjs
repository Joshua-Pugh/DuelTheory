import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const catalog=JSON.parse(await readFile('public/catalog.json','utf8'));
const normals=catalog.filter(c=>c.type==='Normal Monster'&&c.level<=4&&c.atk>0).slice(0,14);
const deck={id:'battle-smoke',name:'Normal Monster battle fixture',main:normals.flatMap(c=>[c.id,c.id,c.id]).slice(0,40),side:[],extra:[]};
const api='https://dueltheory-matches.cfpadvantage.workers.dev';
const room=Array.from(crypto.getRandomValues(new Uint8Array(8)),n=>'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[n%32]).join(''),tokens=[crypto.randomUUID().replaceAll('-',''),crypto.randomUUID().replaceAll('-','')];
async function request(seat,method,body){const response=await fetch(`${api}/matches/${room}/${method}`,{method:method==='read'?'GET':'POST',headers:{Authorization:`Bearer ${tokens[seat]}`,'Content-Type':'application/json','X-Request-ID':crypto.randomUUID()},...(body?{body:JSON.stringify(body)}:{})});const value=await response.json();assert.equal(response.status,200,JSON.stringify(value));return value;}
async function act(seat,command){const v=await request(seat,'read');return request(seat,'action',{revision:v.revision,command});}
await request(0,'create',{game:'goat',name:'Battle check A',pick:{deck}});await request(1,'join',{name:'Battle check B',pick:{deck}});
for(const seat of [0,1])await act(seat,{type:'ready',value:true});for(const seat of [0,1])await act(seat,{type:'begin'});
let v=await request(0,'read');assert.equal(v.manual,false);const first=v.goat.current,other=1-first;
v=await request(first,'read');v=await act(first,{type:'goat',action:v.actions.find(a=>a.type==='DRAW_PHASE')});v=await act(first,{type:'goatPhase',destination:'MAIN_1'});v=await act(first,{type:'goat',action:v.actions.find(a=>a.type==='NORMAL_SUMMON'&&a.position==='attack')});
for(let n=0;n<8&&v.goat.current===first;n++)v=await act(first,{type:'goatPhase',destination:'NEXT'});
assert.equal(v.goat.current,other);v=await request(other,'read');v=await act(other,{type:'goat',action:v.actions.find(a=>a.type==='DRAW_PHASE')});
for(let n=0;n<8&&v.goat.current===other;n++)v=await act(other,{type:'goatPhase',destination:'NEXT'});
assert.equal(v.goat.current,first);v=await request(first,'read');v=await act(first,{type:'goat',action:v.actions.find(a=>a.type==='DRAW_PHASE')});v=await act(first,{type:'goatPhase',destination:'BATTLE'});
const attack=v.actions.find(a=>a.type==='DECLARE_ATTACK'&&!a.targetId);assert.ok(attack);const before=v.goat.players[other].lp,start=Date.now();v=await act(first,{type:'goat',action:attack});assert.equal(v.goat.pendingAttack,undefined);assert.ok(v.goat.players[other].lp<before);assert.equal(v.goat.lastBattle.sourceId,attack.attackerId);assert.equal(v.goat.lastBattle.damage,before-v.goat.players[other].lp);
const opponent=await request(other,'read');assert.deepEqual(opponent.goat.lastBattle,v.goat.lastBattle);
console.log(`Live battle: one attack command completes uncontested damage and synchronizes the damage source/amount (${Date.now()-start}ms, room ${room})`);
await act(first,{type:'leave'});
