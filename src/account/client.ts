import type {SupabaseClient} from '@supabase/supabase-js';
import {validateSavedSetup,type SavedSetup} from './model';
const env=(import.meta as ImportMeta&{env:Record<string,string|undefined>}).env;
let client:Promise<SupabaseClient>|null=null;
export function accountConfig(values:Record<string,string|undefined>=env){
 if(values.VITE_ACCOUNTS_ENABLED!=="true")return null;
 const url=values.VITE_SUPABASE_URL,key=values.VITE_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return null;
 try{const u=new URL(url);if(u.protocol!=='https:'||!u.hostname.endsWith('.supabase.co')||u.pathname!=='/'||u.username||u.password)return null;}catch{return null;}
 // Only a publishable browser key. Never accept an admin/service-role JWT here.
 if(!key.startsWith('sb_publishable_'))return null;
 return {url,key};
}
export function accountClient(){
 const c=accountConfig();if(!c)throw Error('Accounts are not configured yet. Guest tables still work.');
 return client??=import('@supabase/supabase-js').then(({createClient})=>createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'dueltheory.account.v1'}}));
}
export async function loadCloudSetups(){const c=await accountClient();const {data,error}=await c.from('tracker_profiles').select('id,kind,name,data,revision,updated_at').order('updated_at',{ascending:false}).limit(40);if(error)throw Error('Could not load saved setups. Please retry.');return (data||[]).map(validateSavedSetup);}
export async function saveCloudSetup(setup:Pick<SavedSetup,'kind'|'name'|'data'>&Partial<Pick<SavedSetup,'id'|'revision'>>){
 const c=await accountClient();const {data,error}=await c.rpc('save_tracker_profile',{profile_id:setup.id||crypto.randomUUID(),profile_kind:setup.kind,profile_name:setup.name,profile_data:setup.data,expected_revision:setup.revision||0});
 if(error)throw Error(error.code==='40001'?'This setup changed on another device. Reload before saving.':'Could not save this setup. Please retry.');return validateSavedSetup(Array.isArray(data)?data[0]:data);
}
export async function deleteCloudSetup(id:string,revision:number){const c=await accountClient();const {data,error}=await c.from('tracker_profiles').delete().eq('id',id).eq('revision',revision).select('id');if(error||!data?.length)throw Error('Could not delete this version. Reload before trying again.');}
