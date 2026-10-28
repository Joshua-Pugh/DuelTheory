import {describe,it,expect} from 'vitest';
import {accountConfig} from './client';
import {validatePlayerSetup,validateSavedSetup} from './model';
describe('account public configuration and saved data boundaries',()=>{
 it('fails closed without public config and rejects service-role keys and arbitrary endpoints',()=>{
  const valid={VITE_ACCOUNTS_ENABLED:'true',VITE_SUPABASE_URL:'https://example.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_example'};
  expect(accountConfig(valid)).toBeTruthy();expect(accountConfig({...valid,VITE_ACCOUNTS_ENABLED:'false'})).toBeNull();expect(accountConfig({})).toBeNull();
  for(const patch of [{VITE_SUPABASE_URL:'http://example.supabase.co'},{VITE_SUPABASE_URL:'https://evil.test'},{VITE_SUPABASE_URL:'https://example.supabase.co.evil.test'},{VITE_SUPABASE_URL:'https://name:secret@example.supabase.co'},{VITE_SUPABASE_PUBLISHABLE_KEY:'sb_secret_bad'},{VITE_SUPABASE_PUBLISHABLE_KEY:'eyJservice_role'}])expect(accountConfig({...valid,...patch})).toBeNull();
 });
 it('rejects style injection and malformed saved records',()=>{
  expect(validatePlayerSetup({schemaVersion:1,displayName:' Alex ',accent:'#aabbcc'}).displayName).toBe('Alex');
  expect(()=>validatePlayerSetup({schemaVersion:1,displayName:'Alex',accent:'url(https://evil.test)'})).toThrow();
  expect(()=>validateSavedSetup({id:'x',kind:'admin',name:'x',data:{},revision:1,updated_at:''})).toThrow();
 });
});
