import {afterEach,describe,it,expect,vi} from 'vitest';
import {requestMatch,MatchRequestError} from './client';
const credential={code:'ABCDEFGH',token:'test-token'};
afterEach(()=>vi.unstubAllGlobals());
describe('private-room HTTP failures',()=>{
 it('preserves 429 and Retry-After without retrying rapidly inside a request',async()=>{const fetch=vi.fn().mockResolvedValue(new Response(JSON.stringify({error:'Limited'}),{status:429,headers:{'Retry-After':'15'}}));vi.stubGlobal('fetch',fetch);await expect(requestMatch(credential,'read')).rejects.toMatchObject({status:429,retryAfterMs:15000,message:'Limited'});expect(fetch).toHaveBeenCalledTimes(1);});
 it('handles non-JSON infrastructure errors and distinguishes a reveal pause',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('Please wait',{status:429})));await expect(requestMatch(credential,'read')).rejects.toBeInstanceOf(MatchRequestError);vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({error:'Wait for your opponent to view the revealed card.'}),{status:423})));await expect(requestMatch(credential,'read')).rejects.toMatchObject({status:423,retryAfterMs:0});});
});
