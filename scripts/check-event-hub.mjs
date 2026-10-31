import assert from 'node:assert/strict';
const base=process.env.EVENT_TEST_API||'http://127.0.0.1:8787';
const code=Array.from(crypto.getRandomValues(new Uint8Array(8)),v=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[v%32]).join('');
const owner=crypto.randomUUID().replaceAll('-',''),alice=crypto.randomUUID().replaceAll('-',''),bob=crypto.randomUUID().replaceAll('-','');
const profile={schemaVersion:1,name:'Demo duel',health:{label:'Life',start:8000,defeatAt:0,tapAmount:100,holdAmount:1000},counters:[{label:'Energy',start:0,defeatAt:null}],sourceDamage:{enabled:true,label:'Source damage',defeatAt:null}};
async function request(token,method,input={},id=crypto.randomUUID()){
 const r=await fetch(`${base}/events/${code}/${method}`,{method:method==='read'?'GET':'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json','X-Request-ID':id},...(method==='read'?{}:{body:JSON.stringify(input)})});return {status:r.status,body:await r.json()};
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
console.log('Event API smoke passed: persistence, six tables, private access, joins, server dice, 2400 adjustment, idempotent retries, help, archive, stable table identity and stale-seat rejection.');
