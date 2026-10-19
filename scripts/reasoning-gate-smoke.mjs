import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const deck=JSON.parse(await readFile('src/data/reasoningGate.json','utf8'));
const api=process.env.MATCH_API||'https://dueltheory-matches.cfpadvantage.workers.dev';
const room=Array.from(crypto.getRandomValues(new Uint8Array(8)),n=>'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[n%32]).join(''),tokens=[crypto.randomUUID().replaceAll('-',''),crypto.randomUUID().replaceAll('-','')];
async function request(seat,method,body){const r=await fetch(`${api}/matches/${room}/${method}`,{method:method==='read'?'GET':'POST',headers:{Authorization:`Bearer ${tokens[seat]}`,'Content-Type':'application/json','X-Request-ID':crypto.randomUUID()},...(body?{body:JSON.stringify(body)}:{})});const value=await r.json();assert.equal(r.status,200,JSON.stringify(value));return value;}
async function act(seat,command){const v=await request(seat,'read');return request(seat,'action',{revision:v.revision,command});}
let created=false;
try{
 await request(0,'create',{game:'goat',name:'Reasoning verification A',pick:{deck}});created=true;await request(1,'join',{name:'Reasoning verification B',pick:{deck}});
 for(const seat of [0,1])await act(seat,{type:'ready',value:true});for(const seat of [0,1])await act(seat,{type:'begin'});
 let sourceSeat,sourceId;
 for(let turn=0;turn<24;turn++){
  let v=await request(0,'read');assert.equal(v.manual,false);const seat=v.goat.current;v=await request(seat,'read');const draw=v.actions.find(a=>a.type==='DRAW_PHASE');if(draw)v=await act(seat,{type:'goat',action:draw});
  v=await act(seat,{type:'goatPhase',destination:'MAIN_1'});const reasoning=v.actions.find(a=>a.type==='ACTIVATE_LIGHT_EFFECT'&&a.effectId==='REASONING');
  if(reasoning){sourceSeat=seat;sourceId=reasoning.instanceId;await act(seat,{type:'goat',action:reasoning});break;}
  await act(seat,{type:'goatPhase',destination:'END'});
 }
 assert.notEqual(sourceSeat,undefined,'No Reasoning drawn within bounded check');
 let views=await Promise.all([request(0,'read'),request(1,'read')]);
 for(let n=0;n<4&&views[0].goat.chain.length;n++){const seat=views[0].goat.priority;const pass=views[seat].actions.find(a=>a.type==='PASS_CHAIN');assert.ok(pass);await act(seat,{type:'goat',action:pass});views=await Promise.all([request(0,'read'),request(1,'read')]);}
 const opponent=1-sourceSeat;assert.equal(views[opponent].actions.filter(a=>a.type==='COMPLETE_LIGHT_CHOICE').length,12);assert.equal(views[sourceSeat].actions.length,0);
 assert.ok(views[opponent].goat.players[sourceSeat].deck.every(id=>views[opponent].goat.cards[id].cardId===0));
 await act(opponent,{type:'goat',action:views[opponent].actions.find(a=>a.declaredType==='12')});
 let v=await request(opponent,'read');if(v.reveal){assert.ok(v.reveal.cardIds.length);await act(opponent,{type:'ackReveal',id:v.reveal.id});}
 v=await request(sourceSeat,'read');assert.equal(v.goat.pendingLightChoice.kind,'GATE_SUMMON');const summon=v.actions.find(a=>a.type==='COMPLETE_LIGHT_CHOICE');assert.ok(summon);v=await act(sourceSeat,{type:'goat',action:summon});assert.equal(v.goat.pendingLightChoice,undefined);assert.equal(v.goat.cards[sourceId].location,'graveyard');
 assert.ok(Object.values(v.goat.cards).some(c=>c.location==='monster'&&c.controller===sourceSeat));console.log('Live Reasoning Gate: guided deck, opponent declaration, deck privacy, excavation reveal and summon passed.');
}finally{if(created)await act(0,{type:'leave'}).catch(()=>{});}
