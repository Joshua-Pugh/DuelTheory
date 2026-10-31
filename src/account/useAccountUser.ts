import {useEffect,useState} from 'react';
import {accountClient,accountConfig} from './client';
export function useAccountUser(){
 const configured=!!accountConfig();
 const [user,setUser]=useState<{id:string;email?:string}|null>(null),[loading,setLoading]=useState(configured),[error,setError]=useState('');
 useEffect(()=>{if(!configured)return;let active=true,off:(()=>void)|undefined,version=0;void accountClient().then(async c=>{if(!active)return;const {data}=c.auth.onAuthStateChange((_event,session)=>{version++;if(active){setUser(session?.user??null);setLoading(false);}});off=()=>data.subscription.unsubscribe();const started=version,{data:initial,error}=await c.auth.getSession();if(error)throw error;if(active&&started===version){setUser(initial.session?.user??null);setLoading(false);}}).catch(()=>{if(active){setError('Account unavailable. Guest tables still work.');setLoading(false);}});return()=>{active=false;off?.();};},[configured]);
 return {user,loading,error};
}
