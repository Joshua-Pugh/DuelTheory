import type {Deck} from '../core/types';
import type {Seat} from '../engine/model';
export type PracticeMode='single'|'best3';
export type PracticeResult=Seat|'draw';
export type PracticeGame={result:PracticeResult;deck:Deck;seed:number;first:Seat;turns:number};
export type PracticeMatch={id:string;label:string;setupKey:string;mode:PracticeMode;registered:Deck;deck:Deck;opponent:Deck;pilot:string;started:string;ended?:string;phase:'playing'|'between'|'complete';games:PracticeGame[];wins:[number,number];first:Seat;winner?:PracticeResult;forfeited?:boolean};
export const PRACTICE_RECORD_KEY='dueltheory.ai.match-records.v1';
export const PILOT_VERSION='chaos-turbo-2026-10-21-review-2';
export function setupKey(deck:Deck,label:string){return JSON.stringify([label,...(['main','extra','side'] as const).map(zone=>[...deck[zone]].sort((a,b)=>a-b))]);}
export function newPracticeMatch(deck:Deck,opponent:Deck,mode:PracticeMode,label:string,first:Seat,pilot=PILOT_VERSION):PracticeMatch{
 const name=label.trim()||deck.name;
 return {id:crypto.randomUUID(),label:name,setupKey:setupKey(deck,name),mode,registered:structuredClone(deck),deck:structuredClone(deck),opponent:structuredClone(opponent),pilot,started:new Date().toISOString(),phase:'playing',games:[],wins:[0,0],first};
}
export function finishPracticeGame(match:PracticeMatch,result:PracticeResult,seed:number,turns:number):PracticeMatch{
 if(match.phase!=='playing')return match;
 const next=structuredClone(match);next.games.push({result,deck:structuredClone(match.deck),seed,first:match.first,turns});if(result!=='draw')next.wins[result]++;
 if(next.mode==='single'||next.wins.some(n=>n>=2)){next.phase='complete';next.winner=result;next.ended=new Date().toISOString();}else next.phase='between';
 return next;
}
export function nextPracticeFirst(match:PracticeMatch):Seat|undefined{const result=match.games.at(-1)?.result;return result==='draw'?match.first:result===0?1:undefined;}
export function forfeitPractice(match:PracticeMatch):PracticeMatch{return match.phase==='complete'?match:{...structuredClone(match),phase:'complete',winner:1,forfeited:true,ended:new Date().toISOString()};}
type StorageLike=Pick<Storage,'getItem'|'setItem'>;
export function loadPracticeRecords(storage:StorageLike):PracticeMatch[]{try{const value:unknown=JSON.parse(storage.getItem(PRACTICE_RECORD_KEY)||'[]');const deck=(d:unknown)=>{if(!d||typeof d!=='object')return false;const x=d as Deck;return typeof x.name==='string'&&['main','side','extra'].every(zone=>Array.isArray(x[zone as keyof Deck])&&(x[zone as 'main'] as unknown[]).every(id=>Number.isInteger(id)&&Number(id)>=0));};return Array.isArray(value)?value.filter((r):r is PracticeMatch=>!!r&&r.phase==='complete'&&typeof r.id==='string'&&typeof r.setupKey==='string'&&typeof r.label==='string'&&typeof r.pilot==='string'&&['single','best3'].includes(r.mode)&&[0,1,'draw'].includes(r.winner)&&deck(r.registered)&&deck(r.opponent)&&deck(r.deck)&&Array.isArray(r.games)&&r.games.every((g:PracticeGame)=>g&&deck(g.deck)&&[0,1,'draw'].includes(g.result)&&[0,1].includes(g.first))&&Array.isArray(r.wins)&&r.wins.length===2&&r.wins.every((n:unknown)=>Number.isInteger(n)&&Number(n)>=0)).slice(0,500):[];}catch{return [];}}
export function savePracticeRecord(storage:StorageLike,match:PracticeMatch){
 const records=loadPracticeRecords(storage);if(match.phase!=='complete'||records.some(r=>r.id===match.id))return records;
 const next=[structuredClone(match),...records].slice(0,500);storage.setItem(PRACTICE_RECORD_KEY,JSON.stringify(next));return next;
}
export function practiceSummaries(records:readonly PracticeMatch[]){
 const groups=new Map<string,{label:string;wins:number;losses:number;draws:number;gamesWon:number;gamesLost:number;pilot:string;mode:PracticeMode}>();
 for(const r of records){const key=JSON.stringify([r.setupKey,r.mode,r.pilot,setupKey(r.opponent,'AI')]);const g=groups.get(key)??{label:r.label,wins:0,losses:0,draws:0,gamesWon:0,gamesLost:0,pilot:r.pilot,mode:r.mode};if(r.winner===0)g.wins++;else if(r.winner===1)g.losses++;else g.draws++;g.gamesWon+=r.wins[0];g.gamesLost+=r.wins[1];groups.set(key,g);}
 return [...groups.values()];
}
