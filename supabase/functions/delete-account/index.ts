import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
// Server-only: validate the bearer session with Auth before using the admin key.
Deno.serve(async(request:Request)=>{
 const origin=request.headers.get('Origin')||'';
 const allowed=['https://dueltheory.com','https://www.dueltheory.com','https://localhost'];
 const headers={'Access-Control-Allow-Origin':allowed.includes(origin)?origin:'https://dueltheory.com','Vary':'Origin','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};
 const reply=(body:unknown,status=200)=>Response.json(body,{status,headers});
 if(origin&&!allowed.includes(origin))return reply({error:'Origin not allowed'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return reply({error:'Method not allowed'},405);
 const auth=request.headers.get('Authorization')||'';if(!auth.startsWith('Bearer '))return reply({error:'Sign in again'},401);
 try{
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await admin.auth.getUser(auth.slice(7));if(error||!data.user)return reply({error:'Sign in again'},401);
  // Deletion is deliberately explicit; this endpoint never accepts a user id.
  const reader=request.body?.getReader();let body='';
  if(!reader)return reply({error:'Confirm account deletion'},400);
  try{while(true){const part=await reader.read();if(part.done)break;body+=new TextDecoder().decode(part.value);if(body.length>128){await reader.cancel();return reply({error:'Request too large'},413);}}}finally{reader.releaseLock();}
  if(JSON.parse(body).confirmation!=='DELETE')return reply({error:'Confirm account deletion'},400);
  const result=await admin.auth.admin.deleteUser(data.user.id);if(result.error)return reply({error:'Could not delete account. Contact support.'},503);
  return reply({deleted:true});
 }catch{return reply({error:'Could not complete request'},400);}
});
