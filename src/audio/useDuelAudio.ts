import {useEffect,useRef} from 'react';
import type {Card} from '../core/types';
import type {DuelState,Seat} from '../engine/model';
import {duelSounds} from './soundEvents';
import {soundManager} from './SoundManager';
export function useDuelAudio(state:DuelState|null|undefined,viewer?:Seat,catalog:readonly Card[]=[]){
 const previous=useRef<DuelState|null>(null);
 useEffect(()=>{if(!state){previous.current=null;soundManager.stop();return;}const cues=duelSounds(previous.current,state,viewer,catalog);previous.current=state;soundManager.play(cues);},[state,viewer,catalog]);
 useEffect(()=>()=>soundManager.stop(),[]);
}

/** Online result views omit the gameplay state; consume the public score once. */
export function useMatchResultAudio(code:string|undefined,results:readonly (0|1|'draw')[]|undefined,seat:Seat|undefined){
 const last=useRef<{code:string|undefined;count:number}|null>(null);
 useEffect(()=>{const count=results?.length??0,old=last.current;last.current={code,count};if(old&&old.code===code&&count>old.count){const winner=results?.at(-1);if(winner!==undefined&&winner!=='draw')soundManager.play([{event:winner===seat?'victory':'defeat'}]);}},[code,results,seat]);
}
