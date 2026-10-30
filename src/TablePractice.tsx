import {useState,useEffect,useRef} from 'react';
import TableProfileEditor from './TableProfileEditor';
import TableSession from './TableSession';
import {savedTableProfiles,saveTableProfile,updateTableProfile,type TableProfile} from './table/profiles';
import {practiceDraft,practiceSetupReady,createPractice,addPracticePlayers,practiceAction,lessonActionAllowed,PRACTICE_COMPLETE} from './table/practice';
import type {TableRoomState,RoomCommand} from './table/model';
const lessons=[
 ['Choose Commander','Start with a common format. Select MTG Commander below. We will build a four-player tracker with 40 life, poison and individual commander combat damage.'],
 ['Configure your trackers','Add two counters named Poison and Energy. Poison starts at 0 and defeats at 10. Energy starts at 0 with its defeat threshold blank: it is an optional resource, not a loss condition. Enable named-source damage and set its threshold to 21. Only commander combat damage belongs in that tracker; ordinary damage changes life alone.'],
 ['Save your profile','Give the setup a name you will recognize, then save it. This saves the rules for new rooms, not a game in progress. Use a unique name so this lesson will not overwrite another setup.'],
 ['Edit a saved profile','Open your saved setup below. For this exercise, change Energy’s starting value from 0 to 1, then Save changes. This demonstrates a house setup; normally Energy starts at 0. Existing rooms are not changed by editing a saved profile.'],
 ['Reuse the saved setup','Select the profile you just edited, then create a practice room. Check that it has 40 Life, Poison at 0 and Energy at 1. No friends or account are needed for this lesson.'],
 ['Invite your friends','A live room shows a QR code and an invite link here. Send the invite to friends; each joins on their own phone, names their commander and controls only their own totals. Add the three simulated players below to continue.'],
 ['Lock the seats','All four seats are filled. Use Lock seats & roll for first. Life controls stay hidden until everyone has rolled.'],
 ['Roll for first','Tap Roll die. The simulated players roll automatically. This lesson uses scripted results so you can learn the sequence; live rooms use server-generated dice and tied players reroll.'],
 ['Record ordinary damage','You took 1 ordinary damage. Tap the minus beside Life on your own card. The other players cannot change your totals.'],
 ['Gain life','You gained 1 life. Tap the plus beside Life to return to 40.'],
 ['Track poison separately','Tap the plus beside Poison once. Poison does not reduce life. At 10 poison counters the tracker marks you eliminated.'],
 ['Track an optional resource','Tap the plus beside Energy once. Energy changes independently and has no defeat threshold. Every counter configured by the host is visible on your card.'],
 ['Record commander combat damage','Open Commander / source damage & other amounts. In Adjust choose Damage · Mara · Mara’s commander. Keep Also adjust Life checked and add 1 damage. Life should fall to 39 while Mara’s separate commander tally becomes 1. Damage from different commanders is not added together for the 21 threshold.'],
 ['Correct a mistake','That commander damage entry was a mistake. Use Undo last entry below your card. It restores both life and the source tally together, leaving earlier poison and energy entries intact.'],
 ['Inspect an opponent','Tap Inspect Mara. You can read their other counters without expanding everyone’s card. Only Mara can edit that seat.'],
 ['Find the table menu','Open Table menu at the top. Sounds, appearance, turn passing, hosting, timer, title, corrections and history are kept there during play. Home keeps your seat; Leave table frees it.'],
 ['Ready for a real table','Your edited Commander profile is saved on this device. Return to setup, choose it from the saved profiles, and invite real players. Practice totals and simulated players are discarded.']
];
export default function TablePractice({onExit}:{onExit:()=>void}){
 const instruction=useRef<HTMLElement>(null);const [format,setFormat]=useState(''),[seats,setSeats]=useState(2);
 const [step,setStep]=useState(0),[profile,setProfile]=useState<TableProfile>(practiceDraft),[savedName,setSavedName]=useState(''),[edit,setEdit]=useState(false),[reuse,setReuse]=useState(''),[room,setRoom]=useState<TableRoomState|null>(null),[error,setError]=useState('');
 useEffect(()=>{instruction.current?.focus({preventScroll:true});instruction.current?.scrollIntoView?.({block:'start'});},[step]);
 const next=()=>{setError('');setStep(s=>s+1);};
 const save=()=>{try{if(savedTableProfiles().some(p=>p.name.toLowerCase()===profile.name.trim().toLowerCase()))throw Error('Choose a different name to keep your existing profile.');saveTableProfile(profile);setSavedName(profile.name.trim());next();}catch(e){setError(e instanceof Error?e.message:String(e));}};
 const change=async(command:RoomCommand)=>{if(!room)return false;if(!lessonActionAllowed(step,command)){setError('Complete the highlighted lesson action first. You can exit practice at any time.');return false;}try{const updated=practiceAction(room,command);setRoom(updated);next();return true;}catch(e){setError(e instanceof Error?e.message:String(e));return false;}};
 const inspect=(target:EventTarget|null)=>{const label=target instanceof Element?target.closest('button')?.textContent:'';if((step===14&&label==='Inspect Mara')||(step===15&&label==='Table menu'))next();};
 return <section className="ct-practice" aria-label="Commander guided practice" onClick={e=>inspect(e.target)}><header className="ct-practice-toolbar"><strong>Guided practice · {Math.min(step+1,17)} / 17</strong><button onClick={onExit}>Exit practice</button></header>
 <section ref={instruction} tabIndex={-1} className="ct-lesson-instruction" role="region" aria-label="Current lesson"><progress max={16} value={step}/><h2>{lessons[step][0]}</h2><p>{lessons[step][1]}</p>{error&&<p className="ct-error" role="alert">{error}</p>}</section>
 {step===0&&<><label>Format<select value={format} onChange={e=>{setFormat(e.target.value);if(e.target.value==='commander')setProfile(practiceDraft());}}><option value="" disabled>Choose a common format</option><option value="commander">MTG Commander</option></select></label><label>Practice seats<select value={seats} onChange={e=>setSeats(Number(e.target.value))}>{[2,3,4,5,6,7,8].map(n=><option key={n} value={n}>{n} players</option>)}</select></label><button className="ct-primary" disabled={format!=='commander'||seats!==4} onClick={next}>Use four-player Commander</button><p>Choose MTG Commander and four seats to continue. Live tables support two to eight seats.</p></>}
 {(step===1||step===2||(step===3&&edit))&&<TableProfileEditor profile={profile} onChange={setProfile} expanded/>}
 {step===1&&<><p className="ct-checklist">Required: 40 life · Poison 0 / threshold 10 · Energy 0 / no threshold · source damage enabled / threshold 21.</p><button className="ct-primary" disabled={!practiceSetupReady(profile)} onClick={next}>Confirm trackers</button></>}
 {step===2&&<button className="ct-primary" disabled={!practiceSetupReady(profile)} onClick={save}>Save practice profile</button>}
 {step===3&&<><button disabled={edit} onClick={()=>{const p=savedTableProfiles().find(p=>p.name===savedName);if(p){setProfile(structuredClone(p));setEdit(true);}}}>Edit saved profile</button>{edit&&<button className="ct-primary" disabled={!profile.counters.some(c=>c.label==='Energy'&&c.start===1)||profile.health.start!==40||!profile.counters.some(c=>c.label==='Poison'&&c.start===0&&c.defeatAt===10)||!profile.sourceDamage.enabled||profile.sourceDamage.defeatAt!==21} onClick={()=>{try{updateTableProfile(savedName,profile);setSavedName(profile.name.trim());next();}catch(e){setError(String(e));}}}>Save changes</button>}</>}
 {step===4&&<><label>Saved profile<select value={reuse} onChange={e=>setReuse(e.target.value)}><option value="">Choose your saved setup</option>{savedTableProfiles().map(p=><option key={p.name} value={p.name}>{p.name}</option>)}</select></label><button className="ct-primary" disabled={reuse!==savedName} onClick={()=>{const p=savedTableProfiles().find(p=>p.name===reuse);if(p){setRoom(createPractice(p));next();}}}>Create practice room</button></>}
 {step===5&&room&&<button className="ct-primary" onClick={()=>{setRoom(addPracticePlayers(room));next();}}>Add simulated friends</button>}
 {room&&step<=16&&<div className={`ct-practice-table ct-lesson-step-${step}`}><TableSession practice state={room} seat={{code:room.code,playerId:'you',token:'',api:''}} connected busy={false} change={change} leave={onExit} copy={()=>{}} onState={setRoom} download={()=>{}}/></div>}
 {step===16&&<button className="ct-primary" onClick={()=>{try{localStorage.setItem(PRACTICE_COMPLETE,'1');}catch{}onExit();}}>Finish lesson & return to setup</button>}
 <p className="ct-hint">Practice is local; no room invites are created. <a href="https://magic.wizards.com/en/formats/commander" target="_blank" rel="noreferrer">Commander format reference</a>. DuelTheory is an independent manual tracker.</p></section>;
}
