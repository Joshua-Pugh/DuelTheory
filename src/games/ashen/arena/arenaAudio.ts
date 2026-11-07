import {useEffect,useRef,useState} from 'react';
import type {Battlefield} from '../../../ashenBattlefieldState';

const preference='dueltheory.ashen.sound-muted';
const cues={
 coin:'/audio/table/dice.mp3',
 ready:'/audio/table/life-up.mp3',
 impact:'/audio/table/life-down.mp3',
} as const;
type Cue=keyof typeof cues;
let context:AudioContext|undefined;
const buffers=new Map<Cue,Promise<AudioBuffer>>();

function isMuted(){
 try{return localStorage.getItem(preference)==='true';}catch{return false;}
}

function activateAudio(){
 if(typeof AudioContext==='undefined')return;
 context??=new AudioContext();
 return context;
}

export function playAshenCue(cue:Cue){
 if(isMuted())return;
 try{
  const audio=activateAudio();
  if(!audio)return;
  const ready=audio.state==='running'?Promise.resolve():audio.resume();
  let buffer=buffers.get(cue);
  if(!buffer){
   buffer=fetch(cues[cue]).then(response=>{
    if(!response.ok)throw Error('Audio unavailable');
    return response.arrayBuffer();
   }).then(data=>audio.decodeAudioData(data)).catch(error=>{
    buffers.delete(cue);
    throw error;
   });
   buffers.set(cue,buffer);
  }
  void Promise.all([ready,buffer]).then(([,decoded])=>{
   if(isMuted())return;
   const source=audio.createBufferSource(),gain=audio.createGain();
   source.buffer=decoded;
   gain.gain.value=cue==='impact'?.33:.23;
   source.connect(gain);
   gain.connect(audio.destination);
   source.start();
   source.onended=()=>{source.disconnect();gain.disconnect();};
  }).catch(()=>{});
 }catch{/* Audio is optional on unsupported devices. */}
}

export function useAshenArenaAudio(state:Battlefield){
 const [muted,setMuted]=useState(isMuted);
 const previous=useRef(state);
 const unlockSound=()=>{
  if(muted)return;
  try{
   const audio=activateAudio();
   if(audio?.state==='suspended')void audio.resume().catch(()=>{});
  }catch{/* Some browsers require a subsequent gesture. */}
 };
 const toggleSound=()=>{
  const next=!muted;
  try{localStorage.setItem(preference,String(next));}catch{/* Session setting still applies. */}
  setMuted(next);
  if(!next)playAshenCue('ready');
 };
 useEffect(()=>{
  const before=previous.current;
  previous.current=state;
  const duel=state.rules?.duel;
  if(!duel||muted||context?.state!=='running'||state.table.turn<before.table.turn)return;
  const report=duel.combat?.report,prior=before.rules?.duel?.combat?.report;
  const damage=state.table.health.some((hp,seat)=>hp<before.table.health[seat]);
  if(damage||report?.hits.length&&(report.serial!==prior?.serial||report.hits.length>prior.hits.length))playAshenCue('impact');
  else if(state.table.active!==before.table.active||duel.combat?.stage==='block'&&before.rules?.duel?.combat?.stage==='attack')playAshenCue('ready');
 },[state,muted]);
 return {muted,toggleSound,unlockSound};
}
