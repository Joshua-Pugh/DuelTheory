import type {EffectProgram} from './effects';
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown,max=100):v is string=>typeof v==='string'&&v.length>0&&v.length<=max;
const key=(v:unknown):v is string=>text(v,64)&&/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(v)&&!['__proto__','prototype','constructor'].includes(v);
const integer=(v:unknown,min=0,max=999)=>Number.isInteger(v)&&Number(v)>=min&&Number(v)<=max;
const strings=(v:unknown)=>Array.isArray(v)&&v.length<=50&&v.every(s=>text(s));
const selector=(v:unknown):boolean=>object(v)&&['zones','types','tags','excludeTags'].every(k=>v[k]===undefined||strings(v[k]))&&(v.controller===undefined||['self','other','any','target'].includes(String(v.controller)))&&(v.excludeSource===undefined||typeof v.excludeSource==='boolean');
const amount=(v:unknown)=>integer(v)||(object(v)&&(selector(v.count)||v.result==='destroyed'||(key(v.stat)&&['source','costCard','chosen'].includes(String(v.of)))));
const targets=(v:unknown)=>v==='source'||v==='targets'||selector(v);
const numbers=(v:unknown,min=0)=>object(v)&&Object.keys(v).length<=50&&Object.entries(v).every(([k,n])=>key(k)&&integer(n,min));
const selection=(v:unknown)=>object(v)&&selector(v.filter)&&integer(v.count,1,50)&&(v.optional===undefined||typeof v.optional==='boolean')&&text(v.label,200);

/** Runtime schema gate for portable JSON programs. No scripts/functions are accepted. */
export function validateEffectProgram(value:unknown):string[]{
 const errors:string[]=[];let budget=256;
 const path=new Set<object>();let dataBudget=4096;
 const dataOnly=(v:unknown,depth=0):boolean=>{
  if(--dataBudget<0||depth>32||typeof v==='function'||typeof v==='symbol'||typeof v==='bigint')return false;
  if(!v||typeof v!=='object')return true;
  if(path.has(v)||(!Array.isArray(v)&&Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null))return false;
  path.add(v);const valid=Object.entries(v).every(([k,n])=>!['__proto__','prototype','constructor'].includes(k)&&dataOnly(n,depth+1));path.delete(v);return valid;
 };
 if(!dataOnly(value))return ['Effect programs must contain bounded plain data only.'];
 const steps=(value:unknown,depth:number):boolean=>{
  if(depth>8||!Array.isArray(value)||value.length>128)return false;
  return value.every(step=>{
   if(--budget<0||!object(step))return false;
   if(step.op==='choose')return selection(step.selection)&&key(step.destination)&&(step.reveal===undefined||typeof step.reveal==='boolean')&&(step.shuffle===undefined||key(step.shuffle))&&(step.event===undefined||key(step.event));
   if(step.op==='randomMove')return selector(step.filter)&&integer(step.count,1,50)&&key(step.destination);
   if(step.op==='draw')return amount(step.count);
   if(step.op==='resource')return key(step.resource)&&amount(step.amount);
   if(step.op==='damage')return targets(step.targets)&&amount(step.amount);
   if(step.op==='attach')return targets(step.targets);
   if(step.op==='destroy')return targets(step.targets);
   if(step.op==='move')return targets(step.targets)&&key(step.zone);
   if(step.op==='counter')return targets(step.targets)&&key(step.counter)&&integer(step.amount,-999);
   if(step.op==='modify')return targets(step.targets)&&numbers(step.stats,-999)&&(step.keywords===undefined||strings(step.keywords))&&['turn','permanent'].includes(String(step.duration));
   if(step.op==='token'){const t=step.token;return amount(step.count)&&object(t)&&text(t.name)&&text(t.type)&&strings(t.tags)&&key(t.zone)&&numbers(t.stats,-999)&&(t.keywords===undefined||strings(t.keywords));}
   if(step.op==='if'){const c=step.condition;return object(c)&&((c.kind==='destroyed'&&(c.filter===undefined||selector(c.filter)))||(['costCard','chosen'].includes(String(c.kind))&&selector(c.filter)))&&steps(step.then,depth+1);}
   return false;
  });
 };
 if(!object(value))return ['Effect program must be an object.'];
 if(value.version!==1)errors.push('Unsupported effect schema version.');
 if(!key(value.id)||!text(value.label,200))errors.push('Effect ID and label are required.');
 if(value.targets!==undefined&&!selection(value.targets))errors.push('Invalid target selection.');
 const c=value.cost;
 if(c!==undefined&&(!object(c)||(c.resources!==undefined&&!numbers(c.resources))||(c.generic!==undefined&&!integer(c.generic))||(c.counters!==undefined&&!numbers(c.counters))||(c.exhaust!==undefined&&typeof c.exhaust!=='boolean')||(c.cards!==undefined&&(!selection(c.cards)||!key(c.cardDestination)))))errors.push('Invalid effect cost.');
 if(!steps(value.steps,0))errors.push('Invalid or excessive effect steps.');
 return errors;
}
export function parseEffectProgram(value:unknown):EffectProgram{const errors=validateEffectProgram(value);if(errors.length)throw Error(errors.join(' '));return structuredClone(value) as EffectProgram;}
