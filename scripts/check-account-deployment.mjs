// Public-key probes only. Does not create users, send email, or delete accounts.
import {readFileSync} from 'node:fs';
const values=Object.fromEntries(readFileSync(new URL('../.env.local',import.meta.url),'utf8').split(/\r?\n/).filter(x=>x&&!x.startsWith('#')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1).trim()];}));
const base=values.VITE_SUPABASE_URL;
const key=values.VITE_SUPABASE_PUBLISHABLE_KEY;
if(!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(base)||!key?.startsWith('sb_publishable_'))throw new Error('Expected public project configuration');
const checks=[
 ['anonymous profiles denied','/rest/v1/tracker_profiles?select=id&limit=1','GET',undefined,undefined,[401,403]],
 // PostgREST hides RPCs that the anonymous role cannot execute.
 ['anonymous save denied','/rest/v1/rpc/save_tracker_profile','POST',{profile_id:'00000000-0000-4000-8000-000000000001',profile_kind:'player',profile_name:'Probe',profile_data:{schemaVersion:1,displayName:'Probe',accent:'#123456'},expected_revision:0},undefined,[401,403,404]],
 ['deletion requires session','/functions/v1/delete-account','POST',{confirmation:'DELETE'},undefined,[401]],
 ['deletion rejects invalid session','/functions/v1/delete-account','POST',{confirmation:'DELETE'},'invalid-session',[401]],
];
let failed=false;
for(const [name,path,method,body,token,expected] of checks){
 const response=await fetch(base+path,{method,headers:{apikey:key,'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
 const result=await response.json().catch(()=>null);
 const pass=expected.includes(response.status)&&(response.status!==404||result?.code==='PGRST202');failed||=!pass;
 console.log(`${pass?'PASS':'FAIL'} ${name}: HTTP ${response.status}`);
}
if(failed)process.exitCode=1;
