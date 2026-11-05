import {createRemoteJWKSet,jwtVerify,type JWTVerifyGetKey} from 'jose';
export type PrivateAccessConfig={PRIVATE_ACCESS_TEAM?:string;PRIVATE_ACCESS_AUD?:string;PRIVATE_ACCESS_EMAILS?:string};
const keys=new Map<string,JWTVerifyGetKey>();
export function privateAccessConfig(env:PrivateAccessConfig){
 const team=env.PRIVATE_ACCESS_TEAM,audience=env.PRIVATE_ACCESS_AUD,emails=(env.PRIVATE_ACCESS_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
 if(!team||!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(team)||!audience||!emails.length)return null;
 return {team,audience,emails};
}
export async function privateIdentity(request:Request,env:PrivateAccessConfig,getKey?:JWTVerifyGetKey){
 const config=privateAccessConfig(env);if(!config)return null;
 const cookie=request.headers.get('Cookie')?.split(';').map(c=>c.trim()).find(c=>c.startsWith('CF_Authorization='))?.slice('CF_Authorization='.length);
 const token=request.headers.get('Cf-Access-Jwt-Assertion')||cookie;if(!token||token.length>16000)return null;
 try{
  let resolver=getKey||keys.get(config.team);if(!resolver){resolver=createRemoteJWKSet(new URL(config.team+'/cdn-cgi/access/certs'),{timeoutDuration:5000});keys.set(config.team,resolver);}
  const {payload}=await jwtVerify(token,resolver,{issuer:config.team,audience:config.audience,algorithms:['RS256'],requiredClaims:['sub','email','exp']});
  return typeof payload.sub==='string'&&typeof payload.email==='string'&&config.emails.includes(payload.email.toLowerCase())?{subject:payload.sub,email:payload.email}:null;
 }catch{return null;}
}
