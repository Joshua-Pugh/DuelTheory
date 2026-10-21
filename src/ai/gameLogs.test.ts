import {expect,it} from 'vitest';
import catalogJson from '../../public/catalog.json';
import type {Card} from '../core/types';
import {CHAOS_TURBO} from '../supportedDecks';
import {GameService} from '../services/GameService';
import {newGameLog,updateGameLog,finishGameLog,GameLogWriter,reviewProfile,gameLogReport} from './gameLogs';
const catalog=catalogJson as Card[];
function fixture(){const service=new GameService(),id=service.createGoatSession([CHAOS_TURBO,CHAOS_TURBO],catalog,42,0,'auto');return {service,id,log:newGameLog({profile:'device-id',displayName:'Mad Scientist',match:'best3-id',game:1,seed:42,first:0,decks:[CHAOS_TURBO,CHAOS_TURBO]},service.getState(id))};}
it('records phase shortcut actions and replays the exact game from decks and seed',()=>{
 const {service,id,log}=fixture();service.dispatch(id,{type:'DRAW_PHASE',seat:0});const state=service.advancePhase(id,'MAIN_1'),updated=updateGameLog(log,state,service.getActionLog(id));
 expect(updated.actions).toHaveLength(3);expect(updated.events).toEqual(state.events);
 const replay=new GameService(),rid=replay.createGoatSession(updated.decks,catalog,updated.seed,updated.first,'auto');for(const action of updated.actions)replay.dispatch(rid,action as Parameters<GameService['dispatch']>[1]);
 expect(replay.getState(rid)).toEqual(state);expect(updated.displayName).toBe('Mad Scientist');expect(updated.pilot).toBeTruthy();
});
it('keeps decision reasons and actor-visible options without leaking human hand into AI reasoning records',()=>{
 const {service,id,log}=fixture(),before=service.getState(id),options=service.getLegalActions(id,0),choice=options.find(a=>a.type==='DRAW_PHASE')!;
 const next=service.dispatch(id,choice),updated=updateGameLog(log,next,service.getActionLog(id),before,choice,options,'Take the turn draw');
 expect(updated.decisions[0].record.reason).toBe('Take the turn draw');expect(updated.decisions[0].actionIndex).toBe(0);
 const observation=updated.decisions[0].record.observation as {players:Array<{hand:unknown}>};expect(observation.players[1].hand).toEqual({count:5});
 expect(JSON.stringify(updated.decisions[0].record.observation)).not.toContain('seed');
});
it('rewinds the replay branch and discards decisions for undone actions',()=>{
 const {service,id,log}=fixture(),before=service.getState(id),options=service.getLegalActions(id,0),choice=options.find(a=>a.type==='DRAW_PHASE')!;
 const updated=updateGameLog(log,service.dispatch(id,choice),service.getActionLog(id),before,choice,options);
 const rewound=updateGameLog(updated,service.rewind(id,0),service.getActionLog(id));expect(rewound.actions).toHaveLength(0);expect(rewound.decisions).toHaveLength(0);expect(rewound.rewinds).toBe(1);
});
it('captures every best-of-three game separately including sided decks and unfinished/conceded outcomes',()=>{
 const {service,id,log}=fixture(),sided=structuredClone(CHAOS_TURBO);[sided.main[0],sided.side[0]]=[sided.side[0],sided.main[0]];
 const second=newGameLog({profile:log.profile,displayName:log.displayName,match:log.match,game:2,seed:99,first:1,decks:[sided,CHAOS_TURBO]},service.getState(id));
 expect(second.id).not.toBe(log.id);expect(second.match).toBe(log.match);expect(second.decks[0]).toEqual(sided);expect(log.decks[0]).toEqual(CHAOS_TURBO);expect(log.status).toBe('in-progress');
 const concession=finishGameLog(second,'conceded',1);expect(concession.result).toBe(1);expect(finishGameLog(concession,'left')).toEqual(concession);expect(gameLogReport(concession)).toContain('AI win');
});
it('serializes snapshots and recovers from a failed write without throwing into gameplay',async()=>{
 const {log}=fixture(),saved:string[]=[],errors:unknown[]=[];
 const writer=new GameLogWriter(async row=>{if(row.turn===2)throw Error('quota');saved.push(`${row.id}:${row.turn}`);},e=>errors.push(e));
 void writer.write(log);log.turn=2;void writer.write(log);log.turn=3;void writer.write(log);await writer.flush();
 expect(saved).toEqual([`${log.id}:1`,`${log.id}:3`]);expect(errors).toHaveLength(1);
});
it('uses a stable per-device UUID, independent of mutable display names',()=>{const data=new Map<string,string>(),storage={getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);}};const id=reviewProfile(storage);expect(reviewProfile(storage)).toBe(id);expect(id).not.toBe('Mad Scientist');});
