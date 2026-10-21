import type {Deck} from '../core/types';
import type {DuelState,LegalAction,Seat} from '../engine/model';
import type {SessionAction} from '../services/GameService';
import {learningRecord,type LearningRecord} from './learning';
import {PILOT_VERSION} from './practiceMatch';

export const GAME_LOG_SETTING='dueltheory.ai.game-logging.v1';
const PROFILE_KEY='dueltheory.ai.review-profile.v1';
export type GameLog={schema:1;id:string;profile:string;displayName:string;match:string;game:number;pilot:string;build:string;started:string;updated:string;seed:number;first:Seat;decks:[Deck,Deck];status:'in-progress'|'finished'|'conceded'|'left';result?:Seat|'draw';turn:number;actions:SessionAction[];decisions:Array<{actionIndex:number;record:LearningRecord}>;events:DuelState['events'];issues:Array<{at:string;message:string;actionCount:number}>;rewinds:number};
export type GameLogSummary=Omit<GameLog,'actions'|'decisions'|'events'|'issues'>;
export function reviewProfile(storage:Pick<Storage,'getItem'|'setItem'>){let id=storage.getItem(PROFILE_KEY);if(!id){id=crypto.randomUUID();storage.setItem(PROFILE_KEY,id);}return id;}
export function newGameLog(input:{profile:string;displayName:string;match:string;game:number;seed:number;first:Seat;decks:[Deck,Deck];pilot?:string},state:DuelState):GameLog{const at=new Date().toISOString();return {...structuredClone(input),schema:1,id:crypto.randomUUID(),pilot:input.pilot??PILOT_VERSION,build:(import.meta as ImportMeta&{env?:Record<string,string>}).env?.VITE_COMMIT_SHA||'development',started:at,updated:at,status:'in-progress',turn:state.turn,actions:[],decisions:[],events:structuredClone(state.events),issues:[],rewinds:0};}
/** Post-game review data never enters the live opponent's observation or policy. */
export function updateGameLog(log:GameLog,state:DuelState,actions:SessionAction[],before?:DuelState,choice?:LegalAction,options:LegalAction[]=[],reason?:string):GameLog{
 const common=actions.findIndex((a,i)=>JSON.stringify(a)!==JSON.stringify(log.actions[i]));
 const cut=common<0?actions.length:common;
 const rewound=actions.length<log.actions.length||cut<log.actions.length;
 const decisions=log.decisions.filter(d=>!rewound||d.actionIndex<cut);
 if(choice&&before&&actions.length>0&&actions.length>cut){decisions.push({actionIndex:actions.length-1,record:learningRecord(before,choice,options,log.id,reason,log.pilot)});}
 return {...log,updated:new Date().toISOString(),turn:state.turn,actions:structuredClone(actions),events:structuredClone(state.events),decisions,rewinds:log.rewinds+(rewound?1:0),...(rewound?{status:'in-progress' as const,result:undefined}:{}),...(state.winner!==null||state.drawnGame?{status:'finished' as const,result:state.drawnGame?'draw' as const:state.winner!}:{})};
}
export function finishGameLog(log:GameLog,status:'conceded'|'left',result?:Seat|'draw'):GameLog{return log.status==='in-progress'?{...log,status,result,updated:new Date().toISOString()}:log;}
export function gameLogReport(log:GameLog){return [`${log.displayName||'Player'} vs ${log.decks[1].name} AI`,`${log.started} · Game ${log.game} · ${log.status} · ${log.result===0?'Player win':log.result===1?'AI win':log.result==='draw'?'Draw':'No recorded result'}`,`${log.decks[0].name} vs ${log.decks[1].name}`,`Pilot: ${log.pilot} · Build: ${log.build} · Seed: ${log.seed} · ${log.actions.length} actions · ${log.rewinds} rewinds`,'',...log.decisions.filter(d=>d.record.actor===1).map(d=>`Action ${d.actionIndex+1} · Turn ${d.record.turn} · ${d.record.phase}\n${JSON.stringify(d.record.chosen)}\n${d.record.reason||'Automatic action'}\n`),'Events:',...log.events.map(e=>JSON.stringify(e)),...log.issues.map(i=>`ERROR after action ${i.actionCount}: ${i.message}`)].join('\n');}

function openLogs():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const request=indexedDB.open('dueltheory-ai-game-logs',1);request.onupgradeneeded=()=>{request.result.createObjectStore('games',{keyPath:'id'});request.result.createObjectStore('summaries',{keyPath:'id'});};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error??Error('Game log storage unavailable'));});}
export async function putGameLog(log:GameLog){const db=await openLogs();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(['games','summaries'],'readwrite');tx.objectStore('games').put(log);const {actions:_actions,decisions:_decisions,events:_events,issues:_issues,...summary}=log;tx.objectStore('summaries').put(summary);tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error??Error('Unable to save game log'));});}finally{db.close();}}
export async function listGameLogs():Promise<GameLog[]>{const db=await openLogs();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('games','readonly'),request=tx.objectStore('games').getAll();request.onsuccess=()=>resolve((request.result as GameLog[]).sort((a,b)=>b.started.localeCompare(a.started)));request.onerror=()=>reject(request.error);});}finally{db.close();}}
export async function listGameLogSummaries():Promise<GameLogSummary[]>{const db=await openLogs();try{return await new Promise((resolve,reject)=>{const request=db.transaction('summaries','readonly').objectStore('summaries').getAll();request.onsuccess=()=>resolve((request.result as GameLogSummary[]).sort((a,b)=>b.started.localeCompare(a.started)));request.onerror=()=>reject(request.error);});}finally{db.close();}}
export async function getGameLog(id:string):Promise<GameLog|undefined>{const db=await openLogs();try{return await new Promise((resolve,reject)=>{const request=db.transaction('games','readonly').objectStore('games').get(id);request.onsuccess=()=>resolve(request.result as GameLog|undefined);request.onerror=()=>reject(request.error);});}finally{db.close();}}
/** Serialize writes so an older snapshot can never overwrite a newer one. No silent pruning. */
export class GameLogWriter{
 private tail=Promise.resolve();
 constructor(private save:(log:GameLog)=>Promise<void>=putGameLog,private onError:(error:unknown)=>void=()=>{}){}
 write(log:GameLog){const snapshot=structuredClone(log);this.tail=this.tail.then(()=>this.save(snapshot)).catch(error=>{this.onError(error);});return this.tail;}
 flush(){return this.tail;}
}
