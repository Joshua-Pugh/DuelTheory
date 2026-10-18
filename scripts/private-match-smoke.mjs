import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const api=process.env.MATCH_API||'https://dueltheory-matches.cfpadvantage.workers.dev';
const deck=JSON.parse(await readFile(new URL('../src/data/chaosRitualTurbo.json',import.meta.url),'utf8'));
const token=()=>crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
const code=()=>Array.from(crypto.getRandomValues(new Uint8Array(8)),b=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b%32]).join('');
async function req(room,t,method,input={},id=crypto.randomUUID()){const r=await fetch(`${api}/matches/${room}/${method}`,{method:['read','info'].includes(method)?'GET':'POST',headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json','X-Request-ID':id},...(['read','info'].includes(method)?{}:{body:JSON.stringify(input)})});return {status:r.status,data:await r.json()};}
async function run(game){const room=code(),tokens=[token(),token()],pick=game==='goat'?{deck}:{faction:'Brute'};
 const create=await req(room,tokens[0],'create',{game,name:'Smoke host',pick});assert.equal(create.status,200);assert.equal(create.data.seat,0);
 const join=await req(room,tokens[1],'join',{name:'Smoke friend',pick});assert.equal(join.status,200);assert.equal(join.data.seat,1);
 assert.equal((await req(room,token(),'join',{name:'Third',pick})).status,400);assert.equal((await req(room,token(),'read')).status,403);
 async function read(seat=0){const r=await req(room,tokens[seat],'read');assert.equal(r.status,200);return r.data;}
 async function command(seat,c,id){const v=await read(seat);const r=await req(room,tokens[seat],'action',{revision:v.revision,command:c},id);assert.equal(r.status,200,JSON.stringify(r.data));return r.data;}
 await command(0,{type:'ready',value:true});assert.equal((await read()).phase,'lobby');await command(1,{type:'ready',value:true});const coin=await read();assert.equal(coin.phase,'coin');assert.equal(coin.goat,undefined);assert.equal(coin.ashen,undefined);
 // Simultaneous acknowledgement from stale lobby snapshots must still work.
 const begins=await Promise.all(tokens.map(t=>req(room,t,'action',{revision:coin.revision,command:{type:'begin'}})));assert.ok(begins.every(r=>r.status===200));let v=await read();assert.equal(v.phase,'playing');
 const id=crypto.randomUUID();v=await command(0,{type:'chat',text:'Both devices connected'},id);const duplicate=await req(room,tokens[0],'action',{revision:0,command:{type:'chat',text:'Both devices connected'}},id);assert.equal(duplicate.status,200);assert.equal(duplicate.data.chat.length,1);assert.equal((await read(1)).chat[0].text,'Both devices connected');
 if(game==='goat'){let seat=v.goat.current;v=await read(seat);const draw=v.actions.find(a=>a.type==='DRAW_PHASE');v=await command(seat,{type:'goat',action:draw});assert.equal(v.goat.players[seat].hand.length,5);const other=seat===0?1:0;assert.ok(v.goat.players[other].hand.every(id=>v.goat.cards[id].cardId===0));const denied=await req(room,tokens[other],'action',{revision:v.revision,command:{type:'goat',action:{type:'ADVANCE',seat}}});assert.equal(denied.status,400);v=await command(seat,{type:'goatPhase',destination:'MAIN_1'});assert.equal(v.goat.phase,'MAIN_1');const action=v.actions.find(a=>a.type==='NORMAL_SUMMON')||v.actions.find(a=>a.type==='SET_SPELL_TRAP');assert.ok(action);v=await command(seat,{type:'goat',action});assert.ok(v.goat.cards[action.instanceId].location==='monster'||v.goat.cards[action.instanceId].location==='spell');assert.equal((await read(other)).revision,v.revision);}
 else{const seat=v.ashen.table.active,other=seat===0?1:0;v=await read(seat);const hand=v.ashen.table.piles[`${seat}:hand`];assert.ok(v.ashen.table.piles[`${other}:hand`].every(id=>v.ashen.table.cards[id].cardId==='hidden'));const font=hand.find(id=>v.ashen.table.cards[id].type==='Ley Font');if(font){v=await command(seat,{type:'ashen',action:{type:'play',source:font,context:{source:font,player:String(seat)}}});for(let n=0;n<10&&v.ashen.rules.duel.priority;n++){const who=Number(v.ashen.rules.duel.priority.holder);v=await command(who,{type:'ashen',action:{type:'pass'}});}v=await read(seat);assert.equal(v.ashen.table.cards[font].zone,'ley');v=await command(seat,{type:'ashen',action:{type:'burn',id:font}});assert.equal(v.ashen.table.cards[font].faceDown,true);}else{v=await command(seat,{type:'ashen',action:{type:'next'}});assert.equal(v.ashen.rules.duel.phase,'combat');}}
 console.log(`${game}: two seats, ready gate, shared toss, chat, reconnect, privacy and synchronized move passed (${room})`);
}
await run('goat');await run('ashen');

