import {it,expect} from 'vitest';
import {generateKeyPair,SignJWT,exportJWK,createLocalJWKSet} from 'jose';
import {privateIdentity,privateAccessConfig} from './privateAccess';
const env={PRIVATE_ACCESS_TEAM:'https://test-team.cloudflareaccess.com',PRIVATE_ACCESS_AUD:'private-app',PRIVATE_ACCESS_EMAILS:'tester@example.com'};
it('fails closed with no configuration or a forged assertion',async()=>{expect(privateAccessConfig({})).toBeNull();expect(await privateIdentity(new Request('https://private.test'),env)).toBeNull();expect(await privateIdentity(new Request('https://private.test',{headers:{'Cf-Access-Jwt-Assertion':'fake.payload.signature'}}),env)).toBeNull();});
it('requires valid signature, issuer, audience, expiry and an invited verified email',async()=>{
 const {publicKey,privateKey}=await generateKeyPair('RS256'),key={...await exportJWK(publicKey),kid:'test',alg:'RS256'},resolver=createLocalJWKSet({keys:[key]});
 const sign=(email='tester@example.com',aud='private-app',exp=Math.floor(Date.now()/1000)+60)=>new SignJWT({email}).setProtectedHeader({alg:'RS256',kid:'test'}).setSubject('user-1').setIssuer(env.PRIVATE_ACCESS_TEAM).setAudience(aud).setExpirationTime(exp).sign(privateKey);
 const req=(token:string)=>new Request('https://private.test',{headers:{'Cf-Access-Jwt-Assertion':token}});
 expect(await privateIdentity(req(await sign()),env,resolver)).toEqual({subject:'user-1',email:'tester@example.com'});
 expect(await privateIdentity(req(await sign('other@example.com')),env,resolver)).toBeNull();expect(await privateIdentity(req(await sign(undefined,'other-app')),env,resolver)).toBeNull();expect(await privateIdentity(req(await sign(undefined,undefined,1)),env,resolver)).toBeNull();
});
