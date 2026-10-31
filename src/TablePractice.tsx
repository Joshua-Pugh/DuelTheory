import {useState,useEffect,useRef} from 'react';
import TableProfileEditor from './TableProfileEditor';
import TableSession from './TableSession';
import {savedTableProfiles,saveTableProfile,updateTableProfile,type TableProfile} from './table/profiles';
import {practiceTitleTransfer,practiceDraft,practiceSetupReady,createPractice,addPracticePlayers,practiceAction,lessonActionAllowed,PRACTICE_COMPLETE} from './table/practice';
import type {TableRoomState,RoomCommand} from './table/model';
const lessons=[
 [
  "Set up a four-player game",
  "Let’s walk through a game together. We’ll use MTG Commander to show how the table works, then you can use what you learn for your own games. Choose the lesson example and four seats below. You’ll build the setup yourself, so you’ll know how to change it later."
 ],
 [
  "Add your trackers",
  "Life is already set to 40. Now add Poison and Energy, both starting at 0. Set Poison’s defeat limit to 10, and leave Energy’s limit blank: it’s just a resource to count. Turn on Track damage by source and set that limit to 21. In this example, that last limit is for combat damage from one commander."
 ],
 [
  "Save your setup",
  "Give your setup a name you’ll recognize next time, then choose Save practice profile. Think of it as saving the table’s starting settings, not the game itself. This lesson saves a practice copy in this browser. At a real table, signing in lets you save named templates to your account."
 ],
 [
  "Edit your saved setup",
  "Let’s try changing something you’ve saved. Choose Edit saved profile, change Energy’s starting value to 1, and save the changes. We’re using 1 just for this exercise; it normally starts at 0. This changes the setup for your next table. It leaves games already underway alone."
 ],
 [
  "Reuse the saved setup",
  "Choose the setup you just edited and create a practice room. You’ll start with 40 Life, 0 Poison and 1 Energy, so you can see that your changes were saved. No friends or other accounts are needed for this lesson."
 ],
 [
  "Invite players",
  "Normally, your friends would scan the QR code or open your invite link, enter their names and join from their own devices. Everyone can see the table, but each player changes their own totals. For now, choose Add simulated friends and we’ll fill the other three seats for you."
 ],
 [
  "Lock the seats",
  "Everyone’s here. Choose Start Game to lock the seats and roll for first player. Your life cards will appear after the roll, so the setup stays out of your way once you’re playing."
 ],
 [
  "Roll for first player",
  "Go ahead and roll your die. We’ll roll for the other players too. You’ll go first in this lesson so we can walk through the controls together. At a real table, the highest roll wins; anyone tied for highest rolls again."
 ],
 [
  "Record damage",
  "Say you’ve just taken 1 damage. Tap the minus beside Life on your card to drop from 40 to 39. Everyone else will see the change on their screen, but they can’t accidentally change your total."
 ],
 [
  "Gain life",
  "Now you’ve gained that life back. Tap the plus beside Life to return to 40. Your host can choose larger tap and hold amounts for games with bigger totals."
 ],
 [
  "Add poison",
  "Open Counters & commander / source damage on your card and add 1 Poison. Notice that your life stays the same: poison has its own total. We set its limit to 10 earlier, so reaching 10 would mark you eliminated in this setup."
 ],
 [
  "Track a resource",
  "Add 1 Energy next. Unlike Poison, Energy has no defeat limit; it’s simply there to help you keep count. You can add other resources to your own setups in the same way."
 ],
 [
  "Record commander combat damage",
  "Mara’s commander has hit you for 1 combat damage. In the Adjust list, choose Damage · Mara · Mara’s commander. Keep Also adjust Life checked, then add 1. That one entry drops your life to 39 and records 1 damage from Mara’s commander. Damage from another commander gets its own separate total."
 ],
 [
  "Undo a mistake",
  "Actually, that last hit was entered by mistake. Choose Undo last entry below your card. It puts your life back and removes that commander damage together. The Poison and Energy you added before it stay as they were."
 ],
 [
  "Inspect another player",
  "Choose Inspect Mara to look at her other totals. You can check what she’s tracking without changing anything on her card. She has the same view of yours."
 ],
 [
  "Open the table menu",
  "Open Table menu, then choose Game tools. This is where we’ll try the shared title. The other sections keep things organized: Players has seats and hosting, Appearance has colors and sounds, and History lets you look back at changes. Table has the new-game and leave controls."
 ],
 [
  "Give the table title a purpose",
  "Some games give one player a shared role or title. This marker helps everyone remember who has it. Open Title settings, use Scout for the name and Review your title benefit for the reminder, then save. The reminder is a note for the players; you still handle the title’s game effects yourselves."
 ],
 [
  "Claim the title",
  "Choose Claim Scout to take the title. You’ll see a Scout badge on your card, and the menu will show you as its holder. That gives everyone a quick way to check who currently has it."
 ],
 [
  "Move the title to another player",
  "Now let’s give it to Mara. Choose Let Mara claim Scout below and watch the badge move to her card. At a real table, players claim the title when your game’s rules say they should. The app won’t move it just because someone took damage."
 ],
 [
  "Clear the title",
  "Mara has the title now. Choose Clear title to leave it unclaimed. The holder can do this, and so can the host. You’re hosting this practice table, which is why you can clear it for her."
 ],
 [
  "Ready for a real table",
  "You’ve saved a setup, changed it, loaded it again and tried the main table controls. Close the menu and finish the lesson when you’re ready. Your practice setup stays in this browser for reuse; the pretend players and practice game won’t carry over. In a real room, Home keeps your seat, while Leave table frees it for someone else."
 ]
];
export default function TablePractice({onExit}:{onExit:()=>void}){
 const instruction=useRef<HTMLElement>(null);const [format,setFormat]=useState(''),[seats,setSeats]=useState(2);
 const [step,setStep]=useState(0),[profile,setProfile]=useState<TableProfile>(practiceDraft),[savedName,setSavedName]=useState(''),[edit,setEdit]=useState(false),[reuse,setReuse]=useState(''),[room,setRoom]=useState<TableRoomState|null>(null),[error,setError]=useState('');
 useEffect(()=>{if(step>=16)return;instruction.current?.focus({preventScroll:true});instruction.current?.scrollIntoView?.({block:'start'});},[step]);
 const next=()=>{setError('');setStep(s=>s+1);};
 const save=()=>{try{if(savedTableProfiles().some(p=>p.name.toLowerCase()===profile.name.trim().toLowerCase()))throw Error('Choose a different name to keep your existing profile.');saveTableProfile(profile);setSavedName(profile.name.trim());next();}catch(e){setError(e instanceof Error?e.message:String(e));}};
 const change=async(command:RoomCommand)=>{if(!room)return false;if(!lessonActionAllowed(step,command)){setError('Let’s finish the step shown above first. You can leave practice whenever you like.');return false;}try{const updated=practiceAction(room,command);setRoom(updated);next();return true;}catch(e){setError(e instanceof Error?e.message:String(e));return false;}};
 const inspect=(target:EventTarget|null)=>{const label=target instanceof Element?target.closest('button')?.textContent:'';if((step===14&&label==='Inspect Mara')||(step===15&&label==='Game tools'))next();};
 return <section className="ct-practice" aria-label="Commander guided practice" onClick={e=>inspect(e.target)}><header className="ct-practice-toolbar"><strong>Guided practice · {Math.min(step+1,lessons.length)} / {lessons.length}</strong><button onClick={onExit}>Exit practice</button></header>
 <section ref={instruction} tabIndex={-1} className="ct-lesson-instruction" role="region" aria-label="Current lesson"><progress max={lessons.length-1} value={step}/><h2>{lessons[step][0]}</h2><p>{lessons[step][1]}</p>{error&&<p className="ct-error" role="alert">{error}</p>}</section>
 {step===0&&<><label>Format<select value={format} onChange={e=>{setFormat(e.target.value);if(e.target.value==='commander')setProfile(practiceDraft());}}><option value="" disabled>Choose the lesson example</option><option value="commander">MTG Commander · lesson example</option></select></label><label>Practice seats<select value={seats} onChange={e=>setSeats(Number(e.target.value))}>{[2,3,4,5,6,7,8].map(n=><option key={n} value={n}>{n} players</option>)}</select></label><button className="ct-primary" disabled={format!=='commander'||seats!==4} onClick={next}>Start four-player example</button><p>Choose the lesson example and four seats, then we’ll get started. For your own games, you can choose anywhere from two to eight seats.</p></>}
 {(step===1||step===2||(step===3&&edit))&&<TableProfileEditor profile={profile} onChange={setProfile} expanded/>}
 {step===1&&<><p className="ct-checklist">Before you continue, check: 40 Life; Poison starts at 0 with a limit of 10; Energy starts at 0 with no limit; source damage is on with a limit of 21.</p><button className="ct-primary" disabled={!practiceSetupReady(profile)} onClick={next}>Confirm trackers</button></>}
 {step===2&&<button className="ct-primary" disabled={!practiceSetupReady(profile)} onClick={save}>Save practice profile</button>}
 {step===3&&<><button disabled={edit} onClick={()=>{const p=savedTableProfiles().find(p=>p.name===savedName);if(p){setProfile(structuredClone(p));setEdit(true);}}}>Edit saved profile</button>{edit&&<button className="ct-primary" disabled={!profile.counters.some(c=>c.label==='Energy'&&c.start===1)||profile.health.start!==40||!profile.counters.some(c=>c.label==='Poison'&&c.start===0&&c.defeatAt===10)||!profile.sourceDamage.enabled||profile.sourceDamage.defeatAt!==21} onClick={()=>{try{updateTableProfile(savedName,profile);setSavedName(profile.name.trim());next();}catch(e){setError(String(e));}}}>Save changes</button>}</>}
 {step===4&&<><label>Saved profile<select value={reuse} onChange={e=>setReuse(e.target.value)}><option value="">Choose your saved setup</option>{savedTableProfiles().map(p=><option key={p.name} value={p.name}>{p.name}</option>)}</select></label><button className="ct-primary" disabled={reuse!==savedName} onClick={()=>{const p=savedTableProfiles().find(p=>p.name===reuse);if(p){setRoom(createPractice(p));next();}}}>Create practice room</button></>}
 {step===5&&room&&<button className="ct-primary" onClick={()=>{setRoom(addPracticePlayers(room));next();}}>Add simulated friends</button>}
 {room&&step<lessons.length&&<div className={`ct-practice-table ct-lesson-step-${step}`}><TableSession practice menuHelp={step>=16?<section className="ct-menu-lesson" aria-label="Title lesson" aria-live="polite"><h3>{lessons[step][0]}</h3><p>{lessons[step][1]}</p>{error&&<p role="alert">{error}</p>}{step===18&&<button onClick={()=>{try{setRoom(practiceTitleTransfer(room));next();}catch(e){setError(String(e));}}}>Let Mara claim Scout</button>}</section>:undefined} state={room} seat={{code:room.code,playerId:'you',token:'',api:''}} connected busy={false} change={change} leave={onExit} copy={()=>{}} onState={setRoom} download={()=>{}}/></div>}
 {step===lessons.length-1&&<button className="ct-primary" onClick={()=>{try{localStorage.setItem(PRACTICE_COMPLETE,'1');}catch{}onExit();}}>Finish lesson & return to setup</button>}
 <p className="ct-hint">This is a practice table in your browser, so there’s no real room for anyone to join. <a href="https://magic.wizards.com/en/formats/commander" target="_blank" rel="noreferrer">Commander format reference</a>. DuelTheory is an independent manual tracker.</p></section>;
}
