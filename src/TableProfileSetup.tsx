import {useEffect,useRef,useState} from 'react';
import TableProfileEditor from './TableProfileEditor';
import {DUEL_PROFILE,MULTIPLAYER_PROFILE,savedTableProfiles,saveTableProfile,updateTableProfile,validateTableProfile,profileFromGame,type TableProfile} from './table/profiles';
import {loadCreatorProjects} from './services/CreatorProjects';
import {loadCloudSetups,saveCloudSetup,deleteCloudSetup} from './account/client';
import {useAccountUser} from './account/useAccountUser';
import type {SavedSetup} from './account/model';
export const FREE_CLOUD_TEMPLATES=5;
export default function TableProfileSetup({profile,onChange}:{profile:TableProfile;onChange:(p:TableProfile)=>void}){
 const {user,loading:authLoading,error:authError}=useAccountUser();
 const identity=useRef(user?.id);identity.current=user?.id;const saving=useRef(false);
 const [saved,setSaved]=useState(savedTableProfiles),[cloud,setCloud]=useState<SavedSetup[]>([]),[projects]=useState(loadCreatorProjects),[selected,setSelected]=useState(()=>JSON.stringify(profile)===JSON.stringify(DUEL_PROFILE)?'duel':'custom'),[editing,setEditing]=useState(()=>JSON.stringify(profile)!==JSON.stringify(DUEL_PROFILE)),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[cloudLoading,setCloudLoading]=useState(false),[library,setLibrary]=useState(false),[search,setSearch]=useState(''),[naming,setNaming]=useState(false),[draftName,setDraftName]=useState('');
 useEffect(()=>{let active=true;setCloud([]);setSelected(current=>current.startsWith('cloud:')?'custom':current);setNaming(false);setMessage('');if(!user){setCloudLoading(false);return;}setCloudLoading(true);void loadCloudSetups().then(rows=>{if(active)setCloud(rows.filter(r=>r.kind==='game'));}).catch(()=>{if(active)setMessage('Could not load account templates. Use Refresh to retry.');}).finally(()=>{if(active)setCloudLoading(false);});return()=>{active=false;};},[user?.id]);
 const run=async(action:(owner:string|undefined)=>Promise<void>)=>{if(saving.current)return;saving.current=true;setBusy(true);setMessage('');const owner=identity.current;try{await action(owner);}catch(e){if(identity.current===owner)setMessage(e instanceof Error?e.message:'Could not save. Try again.');}finally{saving.current=false;setBusy(false);}};
 const refresh=()=>run(async owner=>{if(!owner)return;const rows=await loadCloudSetups();if(identity.current===owner)setCloud(rows.filter(r=>r.kind==='game'));});
 const choose=(value:string)=>{try{setSelected(value);setMessage('');setNaming(false);setEditing(value==='custom');const project=projects.find(p=>'creator:'+p.id===value);const p=value==='duel'?DUEL_PROFILE:value==='multi'?MULTIPLAYER_PROFILE:value==='custom'?{...DUEL_PROFILE,name:'Custom Game'}:project?profileFromGame(project.definition):value.startsWith('cloud:')?cloud.find(r=>'cloud:'+r.id===value)?.data:saved.find(p=>'saved:'+p.name===value);if(p){onChange(structuredClone(p as TableProfile));setLibrary(false);}}catch(e){setMessage(String(e));}};
 const persist=(newCopy:boolean)=>run(async owner=>{
  if(authLoading||cloudLoading)throw Error('Wait for your saved templates to load.');
  const p=validateTableProfile({...profile,...(newCopy?{name:draftName.trim()}:{})});
  if(owner){
   const existing=newCopy?undefined:cloud.find(r=>'cloud:'+r.id===selected);
   if(!newCopy&&!existing)throw Error('Load your account template again before saving changes.');
   if((!existing||existing.name.toLowerCase()!==p.name.toLowerCase())&&cloud.some(r=>r.id!==existing?.id&&r.name.toLowerCase()===p.name.toLowerCase()))throw Error('That template name is already in your account. Choose another name.');
   if(!existing&&cloud.length>=FREE_CLOUD_TEMPLATES)throw Error('Your five account template slots are full. Edit an existing template or delete one from Load saved template.');
   const row=await saveCloudSetup({kind:'game',name:p.name,data:p,...(existing?{id:existing.id,revision:existing.revision}:{})});
   if(identity.current!==owner)return;setCloud(rows=>[row,...rows.filter(r=>r.id!==row.id)]);setSelected('cloud:'+row.id);setMessage('Template saved to your account. Load it on the website or app next time.');
  }else{
   if(newCopy&&saved.some(x=>x.name.toLowerCase()===p.name.toLowerCase()))throw Error('That name is already saved on this device. Choose another name.');
   if(!newCopy&&selected.startsWith('saved:'))updateTableProfile(selected.slice(6),p);else saveTableProfile(p);
   setSaved(savedTableProfiles());setSelected('saved:'+p.name);setMessage('Template saved in this browser. No file was downloaded. Sign in from Account to save across devices.');
  }
  onChange(p);setNaming(false);setEditing(false);
 });
 const beginNew=()=>{setDraftName('');setNaming(true);setMessage('');};
 const canUpdate=user?selected.startsWith('cloud:'):selected.startsWith('saved:');
 const matches=(name:string)=>name.toLowerCase().includes(search.trim().toLowerCase());
 const selectedName=selected.startsWith('cloud:')?cloud.find(r=>'cloud:'+r.id===selected)?.name:selected.startsWith('saved:')?selected.slice(6):null;
 return <section className="ct-profile-setup" aria-label="Game profile"><label>Choose a profile<select disabled={busy} value={selected} onChange={e=>choose(e.target.value)}><option value="duel">Classic Duel</option><option value="multi">Multiplayer Table</option><option value="custom">Custom Game</option>{selectedName&&<option value={selected}>{selectedName} · loaded template</option>}{projects.map(p=><option key={p.id} value={'creator:'+p.id}>{p.name} · Creator Studio</option>)}</select></label>
 <p>{profile.health.start} {profile.health.label} · {profile.counters.map(c=>c.label).join(', ')||'No extra counters'}{profile.sourceDamage.enabled?' · source damage':''}</p><div className="ct-actions"><button disabled={busy} aria-expanded={editing} onClick={()=>setEditing(!editing)}>{editing?'Close profile editor':'Edit profile'}</button><button disabled={busy||authLoading} aria-expanded={library} onClick={()=>{setLibrary(!library);setSaved(savedTableProfiles());}}>Load saved template</button></div>
 {user?<p className="ct-hint">Account templates: {cloud.length}/{FREE_CLOUD_TEMPLATES}. Saved privately to your account, available on the website and app.</p>:<p className="ct-hint">Guest templates stay in this browser. Sign in from Account to save templates across devices.</p>}
 {library&&<section className="ct-template-library" aria-label="Saved templates"><h3>Load a saved template</h3><label>Find a template<input type="search" value={search} onChange={e=>setSearch(e.target.value)}/></label>{user&&<><h4>Your account</h4><button disabled={busy||cloudLoading} onClick={refresh}>Refresh account templates</button>{cloudLoading?<p>Loading templates…</p>:cloud.length===0?<p>No account templates yet. Edit a profile and save your first one.</p>:<ul>{cloud.filter(r=>matches(r.name)).map(r=><li key={r.id}><button disabled={busy} onClick={()=>choose('cloud:'+r.id)}><strong>{r.name}</strong><small>{(r.data as TableProfile).health.start} {(r.data as TableProfile).health.label} · {(r.data as TableProfile).counters.length} counters</small></button><button disabled={busy} onClick={()=>{if(window.confirm(`Delete account template “${r.name}”? Active tables and local copies stay unchanged.`))void run(async owner=>{await deleteCloudSetup(r.id,r.revision);if(identity.current!==owner)return;setCloud(rows=>rows.filter(x=>x.id!==r.id));if(selected==='cloud:'+r.id)setSelected('custom');setMessage('Account template deleted.');});}}>Delete {r.name}</button></li>)}</ul>}</>}
 <h4>Saved on this device</h4>{saved.length?<ul>{saved.filter(p=>matches(p.name)).map(p=><li key={p.name}><button disabled={busy} onClick={()=>choose('saved:'+p.name)}><strong>{p.name}</strong><small>{p.health.start} {p.health.label} · {p.counters.length} counters</small></button></li>)}</ul>:<p>No device templates yet.</p>}<button onClick={()=>setLibrary(false)}>Close template library</button></section>}
 {editing&&<fieldset disabled={busy} className="ct-template-edit-lock"><TableProfileEditor profile={profile} onChange={onChange} expanded/><div className="ct-actions"><button disabled={busy||authLoading||cloudLoading} onClick={()=>canUpdate?void persist(false):beginNew()}>{canUpdate?'Save changes':'Save template'}</button><button disabled={busy||authLoading||cloudLoading} onClick={beginNew}>Save as new</button></div></fieldset>}
 {naming&&<form className="ct-template-name" aria-label="Name your template" onSubmit={e=>{e.preventDefault();void persist(true);}}><h3>Name your template</h3><label>Template name<input disabled={busy} autoFocus required maxLength={50} value={draftName} onChange={e=>setDraftName(e.target.value)} placeholder="Friday high-life duels"/></label><p>{user?'Save this setup privately to your account.':'Save this setup in this browser. No download needed.'}</p><div className="ct-actions"><button disabled={busy||!draftName.trim()} type="submit">{busy?'Saving…':'Save named template'}</button><button disabled={busy} type="button" onClick={()=>setNaming(false)}>Cancel</button></div></form>}
 {authError&&<p role="status">{authError}</p>}{message&&<p role="status">{message}</p>}
 </section>;
}
