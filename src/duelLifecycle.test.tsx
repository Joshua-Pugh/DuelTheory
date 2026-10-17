import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {openingCoin,duelResult} from './duelLifecycle';
import {OpeningCoinDialog,DuelEndedDialog} from './DuelLifecycleDialogs';
import {GameService} from './services/GameService';
import {createDuel,type Seat} from './engine/model';
import type {Card,Deck} from './core/types';
const card:Card={id:1,name:'Test Monster',type:'Normal Monster',level:4,atk:1800,def:1000,desc:''};
const catalog=[card],ctx={cards:new Map([[card.id,card]])};
const deck=(count=40):Deck=>({id:'test',name:'test',main:Array(count).fill(1),extra:[],side:[]});
describe('opening toss',()=>{
 it('reproduces a fixed toss and offers both outcomes across session seeds',()=>{
  const seats=new Set<Seat>();for(let seed=0;seed<4096;seed++){const coin=openingCoin(seed);expect(coin).toEqual(openingCoin(seed));expect(coin.face).toBe(coin.firstSeat===0?'Heads':'Tails');seats.add(coin.firstSeat);}expect([...seats].sort()).toEqual([0,1]);
 });
 it.each([0,1] as Seat[])('gives Player %i the opening five-card hand, priority, and normal turn handoff',first=>{
  const service=new GameService(),id=service.createGoatSession([deck(),deck()],catalog,17,first,'fixture'),initial=service.getState(id);
  expect(initial).toMatchObject({turn:1,current:first,priority:first,pendingDraw:true});expect(initial.players[first].hand).toHaveLength(5);expect(service.getLegalActions(id,first)[0].type).toBe('DRAW_PHASE');expect(service.getLegalActions(id,first===0?1:0)).toEqual([]);
  service.dispatch(id,{type:'DRAW_PHASE',seat:first});expect(service.getState(id).players[first].hand).toHaveLength(5);service.advancePhase(id,'END');expect(service.getState(id).current).toBe(first===0?1:0);expect(service.verifyReplay(id).matches).toBe(true);
 });
 it('rejects an invalid starting seat before creating a session',()=>{expect(()=>createDuel(deck(),deck(),ctx,17,2 as Seat)).toThrow();});
 it('renders a gated Begin button while the coin is flipping',()=>{
  const html=renderToStaticMarkup(<OpeningCoinDialog seed={0} onBegin={()=>{}} onExit={()=>{}}/>);expect(html).toContain('aria-label="Opening coin toss"');expect(html).toContain('Flipping the coin');expect(html).toMatch(/disabled=""[^>]*>Begin duel/);expect(html).toContain('Heads · Player 1');expect(html).toContain('Tails · Player 2');
 });
});
describe('duel completion',()=>{
 it.each([0,1] as Seat[])('announces Player %i without confusing seat zero with no winner',winner=>{
  const state=createDuel(deck(),deck(),ctx,17);expect(duelResult(state)).toBeNull();state.winner=winner;state.players[winner===0?1:0].lp=0;
  expect(duelResult(state)).toEqual({title:`Player ${winner+1} wins`,reason:`Player ${winner===0?2:1} has no Life Points remaining.`});const html=renderToStaticMarkup(<DuelEndedDialog state={state} onAgain={()=>{}} onExit={()=>{}}/>);expect(html).toContain('aria-label="Duel complete"');expect(html).toContain('Play again');expect(html).toContain('Exit duel');
 });
 it('opens completion for a genuine deck-out, then creates a fresh replayable game',()=>{
  const service=new GameService(),id=service.createGoatSession([deck(6),deck(6)],catalog,17,1,'fixture');service.dispatch(id,{type:'DRAW_PHASE',seat:1});service.advancePhase(id,'END');service.dispatch(id,{type:'DRAW_PHASE',seat:0});service.advancePhase(id,'END');service.dispatch(id,{type:'DRAW_PHASE',seat:1});service.advancePhase(id,'END');const ended=service.dispatch(id,{type:'DRAW_PHASE',seat:0});expect(ended.winner).toBe(1);expect(duelResult(ended)).toEqual({title:'Player 2 wins',reason:'Player 1 could not draw from an empty Deck.'});expect(service.getLegalActions(id,0)).toEqual([]);expect(service.verifyReplay(id).matches).toBe(true);
  const next=service.createGoatSession([deck(6),deck(6)],catalog,18,0,'fixture');service.close(id);const fresh=service.getState(next);expect(fresh).toMatchObject({turn:1,current:0,winner:null});expect(fresh.players.map(p=>p.lp)).toEqual([8000,8000]);expect(fresh.players.map(p=>p.hand.length)).toEqual([5,5]);expect(service.getHistory(next).actions).toHaveLength(0);expect(service.verifyReplay(next).matches).toBe(true);
 });
});
