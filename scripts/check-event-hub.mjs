import assert from 'node:assert/strict';
const base=process.env.EVENT_TEST_API||'http://127.0.0.1:8787';
const code=Array.from(crypto.getRandomValues(new Uint8Array(8)),v=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[v%32]).join('');
const owner=crypto.randomUUID().replaceAll('-',''),alice=crypto.randomUUID().replaceAll('-',''),bob=crypto.randomUUID().replaceAll('-','');
const profile={schemaVersion:1,name:'Demo duel',health:{label:'Life',start:8000,defeatAt:0,tapAmount:100,holdAmount:1000},counters:[{label:'Energy',start:0,defeatAt:null}],sourceDamage:{enabled:true,label:'Source damage',defeatAt:null}};
async function request(token,method,input={},id=crypto.randomUUID()){
 const reading=method==='read'||method==='history';const r=await fetch(`${base}/events/${code}/${method}${method==='history'?`?cursor=${input.cursor??0}`:''}`,{method:reading?'GET':'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json','X-Request-ID':id},...(reading?{}:{body:JSON.stringify(input)})});return {status:r.status,body:await r.json()};
}
let r=await request(owner,'create',{name:'Automated event smoke test',count:6,capacity:2,profile});assert.equal(r.status,201);assert.equal(r.body.state.tables.length,6);assert.equal(r.body.state.tables[0].state.players.length,0);
r=await request(alice,'action',{type:'join',table:1,round:1,name:'Alice'});assert.equal(r.status,200);assert.equal(r.body.table.state.players[0].life,8000);assert.equal(r.body.state,undefined);
r=await request(bob,'read');assert.equal(r.body.table,undefined);assert.equal(r.body.state,undefined);assert.equal(r.body.event.tables[0].joined,1);
r=await request(bob,'action',{type:'join',table:1,round:1,name:'Bob'});assert.equal(r.status,200);
r=await request(alice,'action',{type:'command',table:1,round:1,command:{type:'start'}});assert.equal(r.status,400);
r=await request(owner,'action',{type:'command',table:1,round:1,command:{type:'start'}});assert.equal(r.status,200);
for(let i=0;i<12;i++){
 r=await request(alice,'read');const roll=r.body.table.state.firstPlayer;if(roll.winner)break;
 for(const token of [alice,bob]){const current=(await request(token,'read')).body;const player=current.playerId,roll=current.table.state.firstPlayer;if(!roll.winner&&roll.eligible.includes(player)&&!Object.hasOwn(roll.rolls,player)){const action=await request(token,'action',{type:'command',table:1,round:1,command:{type:'roll',round:roll.round}});assert.equal(action.status,200);}}
}
const id=crypto.randomUUID(),change={type:'command',table:1,round:1,command:{type:'adjust',field:'life',delta:-2400}};
r=await request(alice,'action',change,id);assert.equal(r.status,200);assert.equal(r.body.table.state.players.find(p=>p.name==='Alice').life,5600);
r=await request(alice,'action',change,id);assert.equal(r.body.table.state.players.find(p=>p.name==='Alice').life,5600);
await request(alice,'action',{type:'help',table:1,round:1});r=await request(owner,'read');assert.equal(r.body.state.tables[0].help,'Alice');assert.equal(r.body.state.tables[1].state.players.length,0);
const revision=r.body.state.tables[0].state.revision;r=await request(owner,'action',{type:'newGroup',table:1,round:1,revision});assert.equal(r.status,200);assert.equal(r.body.state.tables[0].round,2);assert.equal(r.body.state.tables[0].archive.length,1);
r=await request(alice,'action',change);assert.equal(r.status,400);r=await request(alice,'read');assert.equal(r.body.table,undefined);
// Run an actual event round, retaining seats first and freeing them only in round two.
for(const [token,name] of [[alice,'Alice'],[bob,'Bob']])assert.equal((await request(token,'action',{type:'join',table:1,round:2,name})).status,200);
let state=(await request(owner,'read')).body.state;
r=await request(owner,'action',{type:'startRound',tables:[1],durationMinutes:50,revision:state.revision});assert.equal(r.status,200);assert.equal(r.body.state.eventRound.number,1);assert.equal(r.body.state.tables[1].state.started,false);
for(let i=0;i<12;i++){
 const current=(await request(alice,'read')).body;if(current.table.state.firstPlayer.winner)break;
 for(const token of [alice,bob]){const current=(await request(token,'read')).body,roll=current.table.state.firstPlayer;if(!roll.winner&&roll.eligible.includes(current.playerId)&&!Object.hasOwn(roll.rolls,current.playerId))assert.equal((await request(token,'action',{type:'command',table:1,round:2,command:{type:'roll',round:roll.round}})).status,200);}
}
state=(await request(owner,'read')).body.state;const target=state.tables[0].state.players[0];
r=await request(owner,'action',{type:'correct',table:1,round:2,revision:state.tables[0].state.revision,playerId:target.id,field:'life',delta:-100,reason:'Corrected an accidental gain.'});assert.equal(r.status,200);assert.match(r.body.state.tables[0].state.log[0].text,/Corrected an accidental gain/);assert.equal(r.body.state.tables[0].state.log[0].player,'Organizer');
state=r.body.state;r=await request(owner,'action',{type:'announce',table:1,round:2,message:'Judge on the way.',revision:state.revision});assert.equal(r.status,200);assert.equal((await request(alice,'read')).body.table.announcement,'Judge on the way.');assert.equal((await request(owner,'read')).body.state.tables[1].announcement,undefined);
state=r.body.state;assert.equal((await request(owner,'action',{type:'endRound',revision:state.revision})).status,400);
await request(owner,'action',{type:'finish',table:1,round:2});state=(await request(owner,'read')).body.state;
r=await request(owner,'action',{type:'endRound',revision:state.revision});assert.equal(r.status,200);assert.equal((await request(alice,'read')).body.table.finished,true);assert.equal((await request(alice,'history')).status,403);
r=await request(owner,'action',{type:'prepareRound',revision:r.body.state.revision,mode:'samePlayers'});assert.equal(r.status,200);assert.equal((await request(alice,'read')).body.table.round,3);assert.equal((await request(alice,'action',{type:'command',table:1,round:2,command:{type:'adjust',field:'life',delta:-1}})).status,400);
r=await request(owner,'action',{type:'startRound',revision:r.body.state.revision,tables:[1],durationMinutes:40});assert.equal(r.body.state.eventRound.number,2);
r=await request(owner,'action',{type:'endRound',revision:r.body.state.revision,endUnfinished:true,reason:'Demo time called.'});assert.equal(r.status,200);
r=await request(owner,'action',{type:'prepareRound',revision:r.body.state.revision,mode:'newPlayers'});assert.equal(r.status,200);assert.equal((await request(alice,'read')).body.table,undefined);
// Older records remain retrievable after the three-game on-screen history rotates.
for(let i=0;i<13;i++){state=r.body.state;const t=state.tables[0];r=await request(owner,'action',{type:'newGroup',table:1,round:t.round,revision:t.state.revision});assert.equal(r.status,200);}
let cursor=0,history=[];for(let i=0;i<10;i++){const page=await request(owner,'history',{cursor});assert.equal(page.status,200);history.push(...page.body.history);if(page.body.nextCursor===undefined)break;cursor=page.body.nextCursor;}
assert.equal(history.length,16);assert.equal(history.find(h=>h.table===1&&h.game.round===1).game.state.players.length,2);assert.equal(history.some(h=>h.game.state.log.some(l=>l.player==='Organizer'&&l.text.includes('Corrected an accidental gain.'))),true);
// Simulated seats can coexist with an authenticated human, and deleted tables recover safely.
state=(await request(owner,'read')).body.state;
r=await request(owner,'action',{type:'fillDemoTables',revision:state.revision});assert.equal(r.status,200);assert.equal(r.body.event.tables[0].demoPlayers,2);
r=await request(alice,'action',{type:'join',table:1,round:r.body.state.tables[0].round,name:'Alice'});assert.equal(r.status,200);assert.equal(r.body.table.demoPlayerIds.length,1);
state=(await request(owner,'read')).body.state;let t=state.tables[0],demo=t.demoPlayerIds[0];
r=await request(owner,'action',{type:'command',table:1,round:t.round,command:{type:'start'}});assert.equal(r.status,200);assert.equal(Object.hasOwn(r.body.state.tables[0].state.firstPlayer.rolls,demo),true);
for(let i=0;i<12;i++){const current=(await request(alice,'read')).body,roll=current.table.state.firstPlayer;if(roll.winner)break;assert.equal((await request(alice,'action',{type:'command',table:1,round:t.round,command:{type:'roll',round:roll.round}})).status,200);}
const fakeChange={type:'demoCommand',table:1,round:t.round,playerId:demo,command:{type:'adjust',field:'life',delta:-2400}};
assert.equal((await request(alice,'action',fakeChange)).status,400);r=await request(owner,'action',fakeChange);assert.equal(r.status,200);assert.equal(r.body.state.tables[0].state.players.find(p=>p.id===demo).life,5600);
t=r.body.state.tables[1];r=await request(owner,'action',{type:'deleteTable',table:2,round:t.round,revision:t.state.revision});assert.equal(r.status,200);assert.equal(r.body.event.tables.some(t=>t.number===2),false);
assert.equal((await request(bob,'action',{type:'join',table:2,round:t.round,name:'Bob'})).status,400);
r=await request(owner,'action',{type:'restoreTable',table:2,round:t.round,revision:r.body.state.tables[1].state.revision});assert.equal(r.status,200);assert.equal(r.body.state.tables[1].round,t.round+1);assert.equal(r.body.state.tables[1].state.players.length,0);
console.log('Event API end-to-end passed: live guests and demo seats, automatic demo dice, authorized tracking, delete/restore, rounds, corrections and durable paginated history.');
