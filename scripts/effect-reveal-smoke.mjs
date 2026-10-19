import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const catalog=JSON.parse(await readFile('public/catalog.json','utf8')),normals=catalog.filter(c=>c.type==='Normal Monster'&&c.level<=4).slice(0,11);
const deck={id:'effect-smoke',name:'Effect reveal verification',main:[31786629,31786629,31786629,55144522,31560081,31560081,26202165,...normals.flatMap(c=>[c.id,c.id,c.id])],side:[],extra:[]};
const api=process.env.MATCH_API||'https://dueltheory-matches.cfpadvantage.workers.dev';const room=Array.from(crypto.getRandomValues(new Uint8Array(8)),n=>'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[n%32]).join(''),tokens=[crypto.randomUUID().replaceAll('-',''),crypto.randomUUID().replaceAll('-','')];let v,viewer;
async function req(seat,method,body){const r=await fetch(`${api}/matches/${room}/${method}`,{signal:AbortSignal.timeout(15000),method:method==='read'?'GET':'POST',headers:{Authorization:`Bearer ${tokens[seat]}`,'Content-Type':'application/json','X-Request-ID':crypto.randomUUID()},...(body?{body:JSON.stringify(body)}:{})});const j=await r.json();assert.equal(r.status,200,JSON.stringify(j));v=j;viewer=seat;return j;}
async function view(seat){if(viewer!==seat)await req(seat,'read');return v;}
async function cmd(seat,command){await view(seat);return req(seat,'action',{revision:v.revision,command});}
async function action(seat,pred){await view(seat);const a=v.actions.find(pred);assert.ok(a,'Missing action');return cmd(seat,{type:'goat',action:a});}
try{
await req(0,'create',{game:'goat',name:'Reveal check A',pick:{deck}});await req(1,'join',{name:'Reveal check B',pick:{deck}});for(const seat of [0,1])await cmd(seat,{type:'ready',value:true});for(const seat of [0,1])await cmd(seat,{type:'begin'});assert.equal(v.manual,false);
let who;
for(let n=0;n<60;n++){const seat=v.goat.current;await action(seat,a=>a.type==='DRAW_PHASE');assert.equal(v.reveal,undefined);await cmd(seat,{type:'goatPhase',destination:'MAIN_1'});const choices=v.actions.filter(a=>a.type==='ACTIVATE_THUNDER_DRAGON'&&a.searchIds.length);if(choices.length){who=seat;const a=choices.sort((a,b)=>b.searchIds.length-a.searchIds.length)[0];await cmd(seat,{type:'goat',action:a});break;}await cmd(seat,{type:'goatPhase',destination:'END'});}
assert.ok(who!==undefined,'No Thunder Dragon drawn');
for(let n=0;n<8&&v.goat.chain.length;n++)await action(v.goat.priority,a=>a.type==='PASS_CHAIN');
assert.equal(v.reveal.kind,'effect');assert.ok(v.reveal.cardIds.length>=1);assert.ok(v.reveal.cardIds.every(id=>id===31786629));const revealId=v.reveal.id;
await view(1-who);assert.equal(v.waitingFor.seat,1-who);assert.ok(v.goat.players[who].hand.every(id=>v.goat.cards[id].cardId===0));assert.equal(v.reveal.id,revealId);await cmd(1-who,{type:'ackReveal',id:revealId});assert.equal(v.reveal,undefined);
console.log(`LIVE PASS: searched cards shown to opponent, remaining hand masked, ordinary draws hidden, acknowledgement clears reveal (${room})`);
}finally{if(v?.phase==='playing')await cmd(0,{type:'leave'});}
