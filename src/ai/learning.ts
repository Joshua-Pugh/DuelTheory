import type {DuelState,LegalAction,Seat} from '../engine/model';
import {goatObservation} from './policy';import {PILOT_VERSION} from './practiceMatch';
export const LEARNING_KEY='dueltheory.ai.learning.v1';
export type LearningRecord={id:string;game:string;pilot:string;actor:Seat;turn:number;phase:string;at:string;observation:unknown;chosen:unknown;options:unknown[];optionsTotal:number;reason?:string;feedback?:{rating:'good'|'bad';note:string};result?:Seat|'draw';endedBy?:'finished'|'conceded'};
type StorageLike=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
/** Encode actions from the actor's observation. Never retain raw descriptions, seed or instance IDs. */
export function learningRecord(state:DuelState,action:LegalAction,options:readonly LegalAction[],game:string,reason?:string,pilot=PILOT_VERSION):LearningRecord{
 const s=goatObservation(state,action.seat);const card=(id:string)=>{const c=s.cards[id];return {card:c?.cardId??0,owner:c?.owner,controller:c?.controller,location:c?.location,zone:c?.zone,faceDown:c?.faceDown,position:c?.position};};
 const encode=(value:unknown):unknown=>{if(typeof value==='string'&&state.cards[value])return card(value);if(Array.isArray(value))return value.map(encode);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>key!=='description').map(([key,v])=>[key,encode(v)]));return value;};
 const players=s.players.map((p,seat)=>({lp:p.lp,deckCount:p.deck.length,hand:seat===action.seat?p.hand.map(card):{count:p.hand.length},monster:p.zones.monster.map(id=>id?card(id):null),spell:p.zones.spell.map(id=>id?card(id):null),graveyard:p.graveyard.map(card),banished:p.banished.map(card)}));
 const legal=options.filter(a=>a.seat===action.seat);
 return {id:crypto.randomUUID(),game,pilot,actor:action.seat,turn:s.turn,phase:s.phase,at:new Date().toISOString(),observation:{current:s.current,priority:s.priority,players,chain:s.chain.map(l=>({source:card(l.instanceId),controller:l.controller,effect:l.effectId,targets:l.targets.map(card)})),attacker:s.pendingAttack?card(s.pendingAttack.attackerId):undefined},chosen:encode(action),options:legal.slice(0,100).map(encode),optionsTotal:legal.length,reason};
}
export function loadLearning(storage:StorageLike):LearningRecord[]{try{const records:unknown=JSON.parse(storage.getItem(LEARNING_KEY)||'[]');return Array.isArray(records)?records.filter((r):r is LearningRecord=>!!r&&typeof r.id==='string'&&typeof r.game==='string'&&[0,1].includes(r.actor)&&typeof r.pilot==='string'&&Array.isArray(r.options)&&r.observation&&typeof r.observation==='object').slice(0,1000):[];}catch{return [];}}
export function writeLearning(storage:StorageLike,records:LearningRecord[]){let next=records.slice(0,1000);while(JSON.stringify(next).length>1500000&&next.length>1)next=next.slice(0,-1);storage.setItem(LEARNING_KEY,JSON.stringify(next));return next;}
export function saveLearning(storage:StorageLike,record:LearningRecord){return writeLearning(storage,[record,...loadLearning(storage).filter(r=>r.id!==record.id)]);}
export function rateLearning(storage:StorageLike,id:string,rating:'good'|'bad',note:string){return writeLearning(storage,loadLearning(storage).map(r=>r.id===id?{...r,feedback:{rating,note:note.trim().slice(0,1000)}}:r));}
export function finishLearning(storage:StorageLike,game:string,result:Seat|'draw',endedBy:'finished'|'conceded'){return writeLearning(storage,loadLearning(storage).map(r=>r.game===game?{...r,result,endedBy}:r));}
