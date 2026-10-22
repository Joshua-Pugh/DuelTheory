import {PRACTICE_RECORD_KEY,type PracticeMatch,type PracticeResult} from './practiceMatch';
import {reviewProfile} from './gameLogs';
export const OVERALL_RECORD_KEY='dueltheory.ai.overall-record.v1';
export type OverallRecord={schema:1;profile:string;since:string;matches:Record<string,PracticeResult>;games:Record<string,PracticeResult>};
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const results=(value:unknown):value is Record<string,PracticeResult>=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.values(value).every(r=>r===0||r===1||r==='draw');
/** One-time clean start requested by the player. Review logs are deliberately untouched. */
export function loadOverallRecord(storage:Store):OverallRecord{
 const profile=reviewProfile(storage),raw=storage.getItem(OVERALL_RECORD_KEY);
 if(raw){const record:unknown=JSON.parse(raw);if(record&&typeof record==='object'){const r=record as OverallRecord;if(r.schema===1&&r.profile===profile&&typeof r.since==='string'&&Number.isFinite(Date.parse(r.since))&&results(r.matches)&&results(r.games))return r;}throw Error('Overall AI record is invalid');}
 const record:OverallRecord={schema:1,profile,since:new Date().toISOString(),matches:{},games:{}};
 storage.setItem(OVERALL_RECORD_KEY,JSON.stringify(record));storage.removeItem(PRACTICE_RECORD_KEY);return record;
}
/** Stable match/game identities prevent repeat effects and reloads from double-counting.
 * Small outcome entries survive the separate detailed-history limit of 500 matches.
 */
export function recordOverallProgress(storage:Store,match:PracticeMatch):OverallRecord{
 const record=loadOverallRecord(storage);if(Date.parse(match.started)<Date.parse(record.since))return record;
 for(const [index,game] of match.games.entries())record.games[`${match.id}:${index+1}`]=game.result;
 if(match.phase==='complete'&&match.winner!==undefined)record.matches[match.id]=match.winner;
 storage.setItem(OVERALL_RECORD_KEY,JSON.stringify(record));return record;
}
export function overallTotals(record:OverallRecord){
 const total=(rows:Record<string,PracticeResult>)=>Object.values(rows).reduce((s,r)=>({wins:s.wins+Number(r===0),losses:s.losses+Number(r===1),draws:s.draws+Number(r==='draw')}),{wins:0,losses:0,draws:0});
 return {matches:total(record.matches),games:total(record.games)};
}
