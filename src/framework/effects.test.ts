import {describe,it,expect} from 'vitest';
import {continueProgram,executeProgram,payment,resolveTop,matchingTriggers,type EffectAdapter,type EffectProgram,type Entity} from './effects';
import {parseEffectProgram,validateEffectProgram} from './schema';
type Game={entities:Entity[];pool:Record<string,number>;drawn:number;removed:string[];counters:Record<string,number>};
const fixture=():Game=>({entities:[{id:'pilot',controller:'alpha',zone:'hangar',type:'Ship',tags:['Fleet'],exhausted:false},{id:'enemy',controller:'gamma',zone:'orbit',type:'Ship',tags:[],exhausted:false}],pool:{solar:1,plasma:2},drawn:0,removed:[],counters:{}});
const adapter:EffectAdapter<Game>={entities:s=>s.entities,resources:s=>s.pool,adjustResource:(s,_p,r,n)=>{s.pool[r]=(s.pool[r]||0)+n;},exhaust:(s,id)=>{s.entities.find(e=>e.id===id)!.exhausted=true;},move:(s,id,destination)=>{s.entities.find(e=>e.id===id)!.zone=destination;},counter:(s,id,name,n)=>{s.counters[`${id}:${name}`]=(s.counters[`${id}:${name}`]||0)+n;},draw:(s,_p,n)=>{s.drawn+=n;},destroy:(s,id)=>{s.removed.push(id);return true;},damage:()=>false,modify:()=>{},token:()=>''};
describe('portable effects kernel',()=>{
 it('moves entities and applies named counters through a game adapter',()=>{
  const result=executeProgram(fixture(),adapter,{version:1,id:'deploy',label:'Deploy ship',steps:[{op:'move',targets:'source',zone:'orbit'},{op:'counter',targets:'source',counter:'shield',amount:2}]},{player:'alpha',source:'pilot'});
  expect(result.state.entities[0].zone).toBe('orbit');expect(result.state.counters['pilot:shield']).toBe(2);
  expect(result.events.map(e=>e.kind)).toEqual(['moved','counter','resolved']);
 });
 it('rejects executable, malformed, recursive and prototype-sensitive rule data',()=>{
  const valid={version:1,id:'research',label:'Research',steps:[{op:'draw',count:2}]};
  expect(parseEffectProgram(JSON.parse(JSON.stringify(valid))).id).toBe('research');
  expect(validateEffectProgram({...valid,steps:[{op:'eval',code:'alert(1)'}]})).not.toEqual([]);
  expect(validateEffectProgram({...valid,callback:()=>{}})).not.toEqual([]);
  expect(validateEffectProgram({...valid,cost:{resources:JSON.parse('{"__proto__":2}')}})).not.toEqual([]);
  const recursive={...valid,extra:null as unknown};recursive.extra=recursive;
  expect(validateEffectProgram(recursive)).not.toEqual([]);
 });
 it('resolves a custom space game with arbitrary players, zones and resources',()=>{
  const program:EffectProgram={version:1,id:'launch',label:'Launch research',cost:{resources:{plasma:1},generic:1,exhaust:true},steps:[{op:'draw',count:2}]};
  const original=fixture(),result=executeProgram(original,adapter,program,{source:'pilot',player:'alpha'});
  expect(result.state.drawn).toBe(2);expect(result.state.pool).toEqual({solar:0,plasma:1});expect(result.state.entities[0].exhausted).toBe(true);
  expect(original.pool).toEqual({solar:1,plasma:2});expect(original.entities[0].exhausted).toBe(false);
 });
 it('rejects stale targets and unpaid costs atomically',()=>{
  const s=fixture(),program:EffectProgram={version:1,id:'destroy',label:'Destroy ship',targets:{filter:{zones:['orbit'],controller:'other'},count:1,label:'Choose ship'},cost:{resources:{plasma:1}},steps:[{op:'destroy',targets:'targets'}]};
  expect(()=>executeProgram(s,adapter,program,{source:'pilot',player:'alpha',targets:['pilot']})).toThrow('no longer legal');
  expect(()=>payment(s.pool,{plasma:9})).toThrow('Need');expect(s.removed).toEqual([]);expect(s.pool.plasma).toBe(2);
 });
 it('does not assume only one opponent and resolves stacks last in first out',()=>{
  const entry=(id:string,n:number)=>({program:{version:1 as const,id,label:id,steps:[{op:'draw' as const,count:n}]},context:{source:'pilot',player:'alpha'}});
  const result=resolveTop(fixture(),adapter,[entry('first',1),entry('second',3)]);
  expect(result.state.drawn).toBe(3);expect(result.stack[0].program.id).toBe('first');
  const custom=executeProgram(fixture(),adapter,{version:1,id:'hit',label:'Hit',targets:{filter:{controller:'other',zones:['orbit']},count:1,label:'Choose enemy'},steps:[{op:'destroy',targets:'targets'}]},{source:'pilot',player:'alpha',targets:['enemy']});
  expect(custom.state.removed).toEqual(['enemy']);
 });
 it('matches data-defined event subscriptions using event snapshots',()=>{
  const state=fixture(),program:EffectProgram={version:1,id:'salvage',label:'Salvage',steps:[{op:'draw',count:1}]};
  const matches=matchingTriggers(state,adapter,{kind:'destroyed',source:'enemy',player:'gamma',entity:{...state.entities[1],controller:'alpha'}},[{source:'pilot',trigger:{id:'fleet-loss',event:'destroyed',sourceZones:['hangar'],subject:{types:['Ship'],controller:'self'},program}}]);
  expect(matches).toHaveLength(1);expect(matches[0].context.player).toBe('alpha');
 });
});


it('pauses a portable effect after draw and resumes without paying or drawing twice',()=>{
 const original=fixture(),program:EffectProgram={version:1,id:'salvage',label:'Salvage a ship',cost:{resources:{plasma:1}},steps:[{op:'draw',count:1},{op:'choose',selection:{filter:{zones:['orbit'],controller:'other'},count:1,label:'Choose a ship'},destination:'scrapyard'},{op:'draw',count:2}]};
 const started=executeProgram(original,adapter,program,{source:'pilot',player:'alpha'});
 expect(started.state.drawn).toBe(1);expect(started.state.pool.plasma).toBe(1);expect(original.drawn).toBe(0);
 const saved=JSON.parse(JSON.stringify(started)),before=JSON.stringify(saved.state);
 expect(()=>continueProgram(saved.state,adapter,saved.pending,['pilot'])).toThrow('legal');expect(JSON.stringify(saved.state)).toBe(before);
 const done=continueProgram(saved.state,adapter,saved.pending,['enemy']);expect(done.pending).toBeUndefined();expect(done.state.drawn).toBe(3);expect(done.state.pool.plasma).toBe(1);expect(done.state.entities[1].zone).toBe('scrapyard');
});
