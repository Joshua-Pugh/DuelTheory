import {afterEach,describe,it,expect,vi} from 'vitest';
import {requestMatch,MatchRequestError} from './client';
const credential={code:'ABCDEFGH',token:'test-token'};
afterEach(()=>vi.unstubAllGlobals());
describe('private-room HTTP failures',()=>{
 it('preserves 429 and Retry-After without retrying rapidly inside a request',async()=>{const fetch=vi.fn().mockResolvedValue(new Response(JSON.stringify({error:'Limited'}),{status:429,headers:{'Retry-After':'15'}}));vi.stubGlobal('fetch',fetch);await expect(requestMatch(credential,'read')).rejects.toMatchObject({status:429,retryAfterMs:15000,message:'Limited'});expect(fetch).toHaveBeenCalledTimes(1);expect(fetch.mock.calls[0][0]).toContain('?v=2');expect(fetch.mock.calls[0][1].cache).toBe('no-store');});
 it('handles non-JSON infrastructure errors and distinguishes a reveal pause',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('Please wait',{status:429})));await expect(requestMatch(credential,'read')).rejects.toBeInstanceOf(MatchRequestError);vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({error:'Wait for your opponent to view the revealed card.'}),{status:423})));await expect(requestMatch(credential,'read')).rejects.toMatchObject({status:423,retryAfterMs:0});});
});

it('sends a known revision on reads and accepts a lightweight unchanged response',async()=>{const fetch=vi.fn().mockResolvedValue(new Response(JSON.stringify({unchanged:true,revision:7})));vi.stubGlobal('fetch',fetch);await expect(requestMatch(credential,'read',{since:7})).resolves.toEqual({unchanged:true,revision:7});expect(fetch.mock.calls[0][0]).toContain('?v=2&since=7');expect(fetch.mock.calls[0][1].body).toBeUndefined();});
it('does not send invalid revisions or add polling options to actions',async()=>{const fetch=vi.fn().mockImplementation(()=>Promise.resolve(new Response('{}')));vi.stubGlobal('fetch',fetch);await requestMatch(credential,'read',{since:-1});expect(fetch.mock.calls[0][0]).not.toContain('since=');await requestMatch(credential,'action',{since:7});expect(fetch.mock.calls[1][0]).not.toContain('since=');});
