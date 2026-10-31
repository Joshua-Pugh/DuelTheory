import {useState,useEffect,useRef} from 'react';
import TableProfileEditor from './TableProfileEditor';
import TableSession from './TableSession';
import {savedTableProfiles,saveTableProfile,updateTableProfile,type TableProfile} from './table/profiles';
import {practiceTitleTransfer,practiceDraft,practiceSetupReady,createPractice,addPracticePlayers,practiceAction,lessonActionAllowed,PRACTICE_COMPLETE} from './table/practice';
import type {TableRoomState,RoomCommand} from './table/model';
const lessons=[
 [
  "Set up a four-player game",
  "We’ll use MTG Commander as a teaching example. Choose four seats to begin. You’ll add the trackers yourself and save your own setup; this is not a built-in preset."
 ],
 [
  "Add your trackers",
  "Add counters named Poison and Energy. Set Poison to start at 0, with a defeat threshold of 10. Leave Energy at 0 with no defeat threshold—it is an optional resource. Turn on named-source damage and set its threshold to 21. Use that tracker only for commander combat damage."
 ],
 [
  "Save your setup",
  "Give this setup a name, then save it. The saved profile contains starting values and trackers for future rooms. It does not save a game in progress. Choose a new name to keep your other profiles."
 ],
 [
  "Edit your saved setup",
  "Open the saved profile. Change Energy’s starting value from 0 to 1, then choose Save changes. This is a house setup for the exercise; Energy normally starts at 0. Editing a saved profile does not change rooms already in play."
 ],
 [
  "Reuse the saved setup",
  "Select the profile you just edited and create a practice room. It should start with 40 Life, 0 Poison and 1 Energy. No friends or other accounts are needed for this lesson."
 ],
 [
  "Invite players",
  "In a real room, friends scan the QR code or open the invite link. Each person joins on their own phone and controls their own totals. For this lesson, add three simulated players below."
 ],
 [
  "Lock the seats",
  "All four players have joined. Choose Start Game to lock the seats and open the first-player roll. Life cards stay hidden until everyone finishes rolling."
 ],
 [
  "Roll for first player",
  "Tap Roll die. The simulated players will roll too. This lesson uses fixed results to demonstrate the flow. Real rooms use server-generated rolls; players tied for the highest result roll again."
 ],
 [
  "Record damage",
  "You took 1 ordinary damage. Tap the minus beside Life on your card. Other players can see your total but cannot change it."
 ],
 [
  "Gain life",
  "You gained 1 life. Tap the plus beside Life to return to 40."
 ],
 [
  "Add poison",
  "Open Counters & commander / source damage on your card, then tap the plus beside Poison once. Poison is separate from life. With this setup, reaching 10 poison counters marks you eliminated."
 ],
 [
  "Track a resource",
  "Tap the plus beside Energy once. Energy has no defeat threshold. Every counter the host added is available directly on your card."
 ],
 [
  "Record commander combat damage",
  "In Counters & commander / source damage, open the Adjust selector. Choose Damage · Mara · Mara’s commander. Leave Also adjust Life checked, then add 1 damage. Your life drops to 39 and Mara’s commander tally becomes 1. Each commander has its own tally."
 ],
 [
  "Undo a mistake",
  "That damage entry was a mistake. Choose Undo last entry below your card. It restores both life and the commander tally. Your earlier Poison and Energy changes remain."
 ],
 [
  "Inspect another player",
  "Tap Inspect Mara to see her other counters. Only Mara can change her totals."
 ],
 [
  "Open the table menu",
  "Open Table menu at the top, then choose Game tools. Table holds the new-game and leave controls; Players shows seats and hosting; Appearance holds colors and sounds; History shows recent changes. Next, we’ll try the shared table title."
 ],
 [
  "Give the table title a purpose",
  "A table title marks one player as holding a shared role or status. Your game decides what that role means. In Title settings, name this example Scout and enter “Review your title benefit.” as the reminder, then save. The tracker records the holder; it does not apply card effects."
 ],
 [
  "Claim the title",
  "Choose Claim Scout. Your card will show a Scout badge, and the menu will identify you as its holder. The reminder is a note for the players, not an automatic game action."
 ],
 [
  "Move the title to another player",
  "Only one player holds the title at a time. Let Mara claim Scout below. The badge moves from your card to hers. In a real game, players claim it when the rules call for it; damage alone does not transfer it."
 ],
 [
  "Clear the title",
  "Mara now holds Scout. Choose Clear title to make it unclaimed. The current holder or the host can clear it—you are the host in this practice room."
 ],
 [
  "Ready for a real table",
  "Your edited profile is saved on this device. Close the menu, then finish the lesson. Choose your saved profile when creating a real room. Practice totals and simulated players will be discarded. Going Home keeps a real seat; Leave table frees it."
 ]
];
export default function TablePractice({onExit}:{onExit:()=>void}){
 const instruction=useRef<HTMLElement>(null);const [format,setFormat]=useState(''),[seats,setSeats]=useState(2);
 const [step,setStep]=useState(0),[profile,setProfile]=useState<TableProfile>(practiceDraft),[savedName,setSavedName]=useState(''),[edit,setEdit]=useState(false),[reuse,setReuse]=useState(''),[room,setRoom]=useState<TableRoomState|null>(null),[error,setError]=useState('');
 useEffect(()=>{if(step>=16)return;instruction.current?.focus({preventScroll:true});instruction.current?.scrollIntoView?.({block:'start'});},[step]);
 const next=()=>{setError('');setStep(s=>s+1);};
 const save=()=>{try{if(savedTableProfiles().some(p=>p.name.toLowerCase()===profile.name.trim().toLowerCase()))throw Error('Choose a different name to keep your existing profile.');saveTableProfile(profile);setSavedName(profile.name.trim());next();}catch(e){setError(e instanceof Error?e.message:String(e));}};
 const change=async(command:RoomCommand)=>{if(!room)return false;if(!lessonActionAllowed(step,command)){setError('Follow the current lesson step before trying another action. You can leave practice at any time.');return false;}try{const updated=practiceAction(room,command);setRoom(updated);next();return true;}catch(e){setError(e instanceof Error?e.message:String(e));return false;}};
 const inspect=(target:EventTarget|null)=>{const label=target instanceof Element?target.closest('button')?.textContent:'';if((step===14&&label==='Inspect Mara')||(step===15&&label==='Game tools'))next();};
 return <section className="ct-practice" aria-label="Commander guided practice" onClick={e=>inspect(e.target)}><header className="ct-practice-toolbar"><strong>Guided practice · {Math.min(step+1,lessons.length)} / {lessons.length}</strong><button onClick={onExit}>Exit practice</button></header>
 <section ref={instruction} tabIndex={-1} className="ct-lesson-instruction" role="region" aria-label="Current lesson"><progress max={lessons.length-1} value={step}/><h2>{lessons[step][0]}</h2><p>{lessons[step][1]}</p>{error&&<p className="ct-error" role="alert">{error}</p>}</section>
 {step===0&&<><label>Format<select value={format} onChange={e=>{setFormat(e.target.value);if(e.target.value==='commander')setProfile(practiceDraft());}}><option value="" disabled>Choose the lesson example</option><option value="commander">MTG Commander · lesson example</option></select></label><label>Practice seats<select value={seats} onChange={e=>setSeats(Number(e.target.value))}>{[2,3,4,5,6,7,8].map(n=><option key={n} value={n}>{n} players</option>)}</select></label><button className="ct-primary" disabled={format!=='commander'||seats!==4} onClick={next}>Start four-player example</button><p>Choose the lesson example and four seats to continue. Real tables support two to eight seats.</p></>}
 {(step===1||step===2||(step===3&&edit))&&<TableProfileEditor profile={profile} onChange={setProfile} expanded/>}
 {step===1&&<><p className="ct-checklist">Required: 40 life · Poison 0 / threshold 10 · Energy 0 / no threshold · source damage enabled / threshold 21.</p><button className="ct-primary" disabled={!practiceSetupReady(profile)} onClick={next}>Confirm trackers</button></>}
 {step===2&&<button className="ct-primary" disabled={!practiceSetupReady(profile)} onClick={save}>Save practice profile</button>}
 {step===3&&<><button disabled={edit} onClick={()=>{const p=savedTableProfiles().find(p=>p.name===savedName);if(p){setProfile(structuredClone(p));setEdit(true);}}}>Edit saved profile</button>{edit&&<button className="ct-primary" disabled={!profile.counters.some(c=>c.label==='Energy'&&c.start===1)||profile.health.start!==40||!profile.counters.some(c=>c.label==='Poison'&&c.start===0&&c.defeatAt===10)||!profile.sourceDamage.enabled||profile.sourceDamage.defeatAt!==21} onClick={()=>{try{updateTableProfile(savedName,profile);setSavedName(profile.name.trim());next();}catch(e){setError(String(e));}}}>Save changes</button>}</>}
 {step===4&&<><label>Saved profile<select value={reuse} onChange={e=>setReuse(e.target.value)}><option value="">Choose your saved setup</option>{savedTableProfiles().map(p=><option key={p.name} value={p.name}>{p.name}</option>)}</select></label><button className="ct-primary" disabled={reuse!==savedName} onClick={()=>{const p=savedTableProfiles().find(p=>p.name===reuse);if(p){setRoom(createPractice(p));next();}}}>Create practice room</button></>}
 {step===5&&room&&<button className="ct-primary" onClick={()=>{setRoom(addPracticePlayers(room));next();}}>Add simulated friends</button>}
 {room&&step<lessons.length&&<div className={`ct-practice-table ct-lesson-step-${step}`}><TableSession practice menuHelp={step>=16?<section className="ct-menu-lesson" aria-label="Title lesson" aria-live="polite"><h3>{lessons[step][0]}</h3><p>{lessons[step][1]}</p>{error&&<p role="alert">{error}</p>}{step===18&&<button onClick={()=>{try{setRoom(practiceTitleTransfer(room));next();}catch(e){setError(String(e));}}}>Let Mara claim Scout</button>}</section>:undefined} state={room} seat={{code:room.code,playerId:'you',token:'',api:''}} connected busy={false} change={change} leave={onExit} copy={()=>{}} onState={setRoom} download={()=>{}}/></div>}
 {step===lessons.length-1&&<button className="ct-primary" onClick={()=>{try{localStorage.setItem(PRACTICE_COMPLETE,'1');}catch{}onExit();}}>Finish lesson & return to setup</button>}
 <p className="ct-hint">Practice is local; no room invites are created. <a href="https://magic.wizards.com/en/formats/commander" target="_blank" rel="noreferrer">Commander format reference</a>. DuelTheory is an independent manual tracker.</p></section>;
}
