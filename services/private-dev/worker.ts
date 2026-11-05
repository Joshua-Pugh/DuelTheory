import {privateIdentity,privateAccessConfig} from '../../src/access/privateAccess';
export default {async fetch(request:Request,env:Env):Promise<Response>{
 const security={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
 const deny=(message:string,status:number)=>Response.json({error:message},{status,headers:security});
 if(!privateAccessConfig(env))return deny('Private development is closed until invitation access is configured.',503);
 const identity=await privateIdentity(request,env);if(!identity)return deny('A verified private-development invitation is required.',403);
 const url=new URL(request.url);
 if(url.pathname.startsWith('/api/')){
  const route=url.pathname.slice(4);if(!/^\/(?:matches|events)\/[A-Z2-9]{8}\/(?:create|join|info|read|action|history)$/.test(route))return deny('Unknown private endpoint.',404);
  const cookie=request.headers.get('Cookie')?.split(';').map(c=>c.trim()).find(c=>c.startsWith('CF_Authorization='))?.slice('CF_Authorization='.length);
  const assertion=request.headers.get('Cf-Access-Jwt-Assertion')||cookie!;
  const headers=new Headers(request.headers);headers.delete('Cookie');headers.set('Cf-Access-Jwt-Assertion',assertion);headers.set('Origin','https://dueltheory.com');
  const upstream=new Request('https://internal'+route+url.search,{method:request.method,headers,body:['GET','HEAD'].includes(request.method)?undefined:request.body,redirect:'manual'});
  const response=await (route.startsWith('/matches/')?env.MATCH_SERVICE:env.TABLE_SERVICE).fetch(upstream);
  const result=new Response(response.body,response);for(const [key,value] of Object.entries(security))result.headers.set(key,value);return result;
 }
 if(!['GET','HEAD'].includes(request.method))return deny('Method not allowed.',405);
 const response=await env.ASSETS.fetch(request),result=new Response(response.body,response);for(const [key,value] of Object.entries(security))result.headers.set(key,value);return result;
}} satisfies ExportedHandler<Env>;
