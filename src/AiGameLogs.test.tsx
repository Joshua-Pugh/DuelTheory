// @vitest-environment happy-dom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {act} from 'react';import {createRoot,type Root} from 'react-dom/client';
import AiGameLogs from './AiGameLogs';
import {newGameLog,listGameLogs,listGameLogSummaries,getGameLog,type GameLog} from './ai/gameLogs';
import json from '../public/catalog.json';import {CHAOS_TURBO} from './supportedDecks';import type {Card} from './core/types';import {createDuel} from './engine/model';
vi.mock('./ai/gameLogs',async()=>({...await vi.importActual<typeof import('./ai/gameLogs')>('./ai/gameLogs'),listGameLogs:vi.fn(),listGameLogSummaries:vi.fn(),getGameLog:vi.fn()}));
let root:Root,host:HTMLDivElement,games:GameLog[],blobs:Blob[],names:string[];
beforeEach(async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});blobs=[];names=[];const catalog=json as Card[],state=createDuel(CHAOS_TURBO,CHAOS_TURBO,{cards:new Map(catalog.map(c=>[c.id,c]))},42);
 const base=newGameLog({profile:'test',displayName:'Player',match:'test',game:1,seed:42,first:0,decks:[CHAOS_TURBO,CHAOS_TURBO]},state);
 games=Array.from({length:12},(_,i)=>({...structuredClone(base),id:`game-${i}`,started:new Date(Date.UTC(2026,9,22,12-i)).toISOString()}));
 vi.mocked(listGameLogSummaries).mockResolvedValue(games.map(({actions:_a,decisions:_d,events:_e,issues:_i,playerHands:_h,...summary})=>summary));vi.mocked(listGameLogs).mockResolvedValue(games);vi.mocked(getGameLog).mockImplementation(async id=>games.find(g=>g.id===id));
 vi.spyOn(URL,'createObjectURL').mockImplementation(blob=>{blobs.push(blob as Blob);return 'blob:test';});vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{});vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(function(this:HTMLAnchorElement){names.push(this.download);});
 host=document.createElement('div');document.body.append(host);root=createRoot(host);await act(async()=>{root.render(<AiGameLogs enabled onToggle={()=>{}} revision={0} warning=""/>);});
});
afterEach(()=>{act(()=>root.unmount());host.remove();vi.restoreAllMocks();vi.clearAllMocks();});
async function click(label:string){const button=Array.from(document.querySelectorAll('button')).find(b=>b.textContent===label);expect(button).toBeDefined();await act(async()=>button!.click());}
it.each([5,10])('exports the latest %i games without loading the full history',async count=>{await click(`Export last ${count} games`);expect(listGameLogs).not.toHaveBeenCalled();expect(getGameLog).toHaveBeenCalledTimes(count);const text=await blobs[0].text(),data=JSON.parse(text);expect(data.games.map((g:GameLog)=>g.id)).toEqual(games.slice(0,count).map(g=>g.id));expect(data.games[0].playerHands).toEqual(games[0].playerHands);expect(text).not.toContain('\n');expect(names).toEqual([`DuelTheory-AI-last-${count}-games.json`]);});
it('exports only the selected game with its complete replay and hand review',async()=>{const select=document.querySelector('select')!;await act(async()=>{select.value='game-4';select.dispatchEvent(new Event('change',{bubbles:true}));});await click('Export selected game');const data=JSON.parse(await blobs[0].text());expect(data.games).toEqual([games[4]]);expect(listGameLogs).not.toHaveBeenCalled();expect(names[0]).toContain('game-4');});
it('exports fewer than five games when fewer are available',async()=>{vi.mocked(listGameLogSummaries).mockResolvedValue(games.slice(0,2));await click('Export last 5 games');expect(JSON.parse(await blobs[0].text()).games).toHaveLength(2);});
