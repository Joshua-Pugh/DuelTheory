import {assessDeck} from '../supportedDecks';
import type {Deck,Card} from '../core/types';
import {createDuel,seededShuffle,draw,type DuelState,type DuelAction,type LegalAction,type EngineContext,type Seat,type Phase,type Position,DuelEngineError,log,settleLifePoints} from '../engine/model';
import {dispatchDuel,legalActions} from '../engine/rules';
import {auditDuelState} from './duelAudit';

/** Manual overrides are separate from rules actions and never passed to the GOAT rules reducer. */
export type ManualMove = {type:'MANUAL_MOVE_CARD';seat:Seat;instanceId:string;destination:'hand'|'graveyard'|'banished'|'monster'|'spell';zone?:number;position?:Position;faceDown?:boolean};
export type TabletopAction=ManualMove|{type:'MANUAL_PHASE';seat:Seat;destination:Phase|'NEXT'}|{type:'MANUAL_LP';seat:Seat;delta:number}|{type:'MANUAL_SHUFFLE'|'MANUAL_DRAW'|'MANUAL_ROLL_DIE';seat:Seat}|{type:'MANUAL_COUNTER';seat:Seat;instanceId:string;delta:1|-1}|{type:'MANUAL_SEARCH';seat:Seat;instanceIds:string[]};
export type SessionAction = DuelAction | TabletopAction;
export const isTabletopAction=(action:SessionAction):action is TabletopAction=>action.type.startsWith('MANUAL_');
type Session={manualOnly:boolean;state:DuelState;context:EngineContext;snapshots:DuelState[];actions:SessionAction[];initial:DuelState;rulesVerified:boolean};

function applyManualMove(before:DuelState,action:ManualMove):DuelState{
 const s=structuredClone(before), c=s.cards[action.instanceId];
 if(!c)throw new DuelEngineError('UNKNOWN_CARD','Manual card instance does not exist');
 if(c.owner!==action.seat && c.controller!==action.seat)throw new DuelEngineError('ILLEGAL_ACTION','Manual action requires card owner or controller');
 if(s.pendingLightChoice||s.freeResponse||s.pendingChaos||s.pendingRitual||s.chain.length||s.pendingAttack||s.pendingTriggers?.length||s.pendingSearch||s.pendingDiscard||s.pendingDeckChoice||s.pendingRoll||s.pendingRandomDiscard||s.summonResponse)throw new DuelEngineError('ILLEGAL_ACTION','Resolve pending effects before manual movement');
 const p=s.players[action.seat];
 if(action.destination==='monster'||action.destination==='spell'){
  if(!Number.isInteger(action.zone)||action.zone!<0||action.zone!>4||(p.zones[action.destination][action.zone!]!==null&&p.zones[action.destination][action.zone!]!==action.instanceId))throw new DuelEngineError('ILLEGAL_ACTION','Choose an empty zone (0–4)');
 }
 const prior=s.players[c.controller];
 if(c.location==='monster'||c.location==='spell'){
  if(c.zone!==undefined&&prior.zones[c.location][c.zone]===action.instanceId)prior.zones[c.location][c.zone]=null;
 }else{
  const arr=s.players[c.location==='deck'||c.location==='graveyard'||c.location==='banished'?c.owner:c.controller][c.location]||[];
  const idx=arr.indexOf(action.instanceId);if(idx<0)throw new DuelEngineError('ILLEGAL_ACTION','Card missing from source location');arr.splice(idx,1);
 }
 const counters=c.location===action.destination&&c.controller===action.seat&&!c.faceDown&&action.position!=='faceDownDefense'&&action.faceDown!==true?c.spellCounters:0;
 c.location=action.destination;c.controller=action.destination==='monster'||action.destination==='spell'?action.seat:c.owner;c.zone=undefined;c.position=undefined;c.faceDown=false;c.spellCounters=counters;
 if(action.destination==='monster'||action.destination==='spell'){
  c.zone=action.zone;p.zones[action.destination][action.zone!]=action.instanceId;
  if(action.destination==='monster'){
   c.position=action.position??'faceDownDefense';c.faceDown=c.position==='faceDownDefense';c.summonedTurn=s.turn;c.lastPositionTurn=s.turn;
  }else{c.faceDown=action.faceDown??true;c.setTurn=s.turn;}
 }else s.players[c.owner][action.destination].push(action.instanceId);
 log(s,'MANUAL_OVERRIDE',`Possible illegal move · manual override: ${action.instanceId} moved to ${action.destination}${c.zone===undefined?'':` zone ${c.zone+1}`}. Legality not verified.`,action.seat);
 return s;
}

function applyTabletop(before:DuelState,action:TabletopAction):DuelState{
 if(before.winner!==null||before.drawnGame)throw new DuelEngineError('ILLEGAL_ACTION','The duel has ended');
 if(action.type==='MANUAL_MOVE_CARD')return applyManualMove(before,action);
 if(before.pendingLightChoice||before.freeResponse||before.pendingChaos||before.pendingRitual||before.chain.length||before.pendingAttack||before.pendingSearch||before.pendingTriggers?.length||before.pendingDiscard||before.pendingDeckChoice||before.pendingRoll||before.pendingRandomDiscard||before.summonResponse)throw new DuelEngineError('ILLEGAL_ACTION','Resolve pending effects before tabletop actions');
 const s=structuredClone(before),p=s.players[action.seat];
 if(action.type==='MANUAL_LP'){if(!Number.isFinite(action.delta)||!Number.isInteger(action.delta)||Math.abs(action.delta)>100000)throw new DuelEngineError('ILLEGAL_ACTION','Enter a whole LP change between -100000 and 100000');p.lp=Math.max(0,p.lp+action.delta);settleLifePoints(s);log(s,'MANUAL_OVERRIDE',`Manual LP adjustment: Player ${action.seat+1} ${action.delta>0?'+':''}${action.delta}. Legality not verified.`,action.seat);return s;}
 if(action.type==='MANUAL_PHASE'){if(action.seat!==s.current)throw new DuelEngineError('ILLEGAL_ACTION','Only the active player advances phases');const phases:Phase[]=['DRAW','STANDBY','MAIN_1','BATTLE','MAIN_2','END'];const index=phases.indexOf(s.phase);if(action.destination!=='NEXT'&&phases.indexOf(action.destination)<=index&&action.destination!=='END')throw new DuelEngineError('ILLEGAL_ACTION','Cannot move backwards');if(action.destination==='END'||s.phase==='END'||action.destination==='NEXT'&&s.phase==='MAIN_2'){s.current=s.current===0?1:0;s.turn++;s.phase='DRAW';s.players[s.current].normalSummoned=false;}else s.phase=action.destination==='NEXT'?phases[index+1]:action.destination;s.pendingDraw=false;s.priority=s.current;log(s,'MANUAL_OVERRIDE',`Manual phase: Player ${s.current+1} ${s.phase}. Draw and resolve effects yourself.`,action.seat);return s;}
 if(action.type==='MANUAL_ROLL_DIE'){
  s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;
  const result=Math.floor(s.seed/4294967296*6)+1;
  log(s,'MANUAL_DIE',`Player ${action.seat+1} rolled ${result} on the tabletop die. No card effect was applied.`,action.seat);return s;
 }
 if(action.type==='MANUAL_COUNTER'){
  const c=s.cards[action.instanceId];
  if(!c||c.controller!==action.seat||c.faceDown||!['monster','spell'].includes(c.location))throw new DuelEngineError('ILLEGAL_ACTION','Choose your own face-up field card for a counter');
  const count=(c.spellCounters??0)+action.delta;
  if(![1,-1].includes(action.delta)||!Number.isInteger(count)||count<0||count>99)throw new DuelEngineError('ILLEGAL_ACTION','Counter count must be between 0 and 99');
  c.spellCounters=count;
  log(s,'MANUAL_OVERRIDE',`Possible illegal move · manual counter: ${action.instanceId} now has ${count} counter(s). Legality not verified.`,action.seat);return s;
 }
 if(action.type==='MANUAL_DRAW'){draw(s,action.seat,1);log(s,'MANUAL_OVERRIDE','Possible illegal move · tabletop draw. Legality not verified.',action.seat);return s;}
 if(action.type==='MANUAL_SEARCH'){
  if(new Set(action.instanceIds).size!==action.instanceIds.length||action.instanceIds.some(id=>!p.deck.includes(id)))throw new DuelEngineError('ILLEGAL_ACTION','Choose distinct cards from your own Deck');
  for(const id of action.instanceIds){p.deck.splice(p.deck.indexOf(id),1);p.hand.push(id);s.cards[id].location='hand';}
  log(s,'MANUAL_OVERRIDE',`Possible illegal move · tabletop search: added ${action.instanceIds.length} card(s) to hand. Legality not verified.`,action.seat);
 }
 s.seed=(s.seed+104729)>>>0;p.deck=seededShuffle(p.deck,s.seed+action.seat*7919);
 log(s,'SHUFFLE','Shuffled Deck after tabletop inspection/search.',action.seat);return s;
}

export function freshDuelSeed():number {return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];}

/** Session-based game authority, including marked manual overrides and deterministic history. */
export class GameService {
 private readonly sessions=new Map<string,Session>();
 private nextId=1;
 /** Auto is the production default. Fixture policy permits deliberately invalid, tiny test decks only. */
 createGoatSession(decks:[Deck,Deck],catalog:readonly Card[],seed=freshDuelSeed(),firstSeat:Seat=0,mode:'auto'|'manual'|'fixture'='auto'):string {
  const ctx:EngineContext={cards:new Map(catalog.map(card=>[card.id,card]))};
  const state=createDuel(decks[0],decks[1],ctx,seed,firstSeat);
  const manualOnly=mode==='manual'||mode==='auto'&&decks.some(deck=>!assessDeck(deck,catalog).supported);
  if(manualOnly)state.pendingDraw=false;
  const id=`goat-${this.nextId++}`;
  this.sessions.set(id,{manualOnly,state,context:ctx,initial:structuredClone(state),snapshots:[structuredClone(state)],actions:[],rulesVerified:!manualOnly});
  return id;
 }
 private session(id:string){const session=this.sessions.get(id);if(!session)throw new DuelEngineError('ILLEGAL_ACTION',`Unknown game session ${id}`);return session;}
 isManual(id:string){return this.session(id).manualOnly;}
 getState(id:string):DuelState{return structuredClone(this.session(id).state);}
 getLegalActions(id:string,seat:Seat):LegalAction[]{const session=this.session(id);return session.manualOnly?[]:legalActions(session.state,session.context,seat);}
 private commit(session:Session,next:DuelState,action:SessionAction,manual=false){
  const errors=auditDuelState(next);
  if(errors.length)throw new DuelEngineError('ILLEGAL_ACTION',`State integrity check failed: ${errors.join('; ')}`);
  session.state=next;session.actions.push(structuredClone(action));session.snapshots.push(structuredClone(next));
  if(manual)session.rulesVerified=false;
  return structuredClone(next);
 }
 dispatch(id:string,action:DuelAction):DuelState {
  const session=this.session(id);
  if(session.manualOnly)throw new DuelEngineError('UNSUPPORTED_EFFECT','This match is locked to full manual play');
  return this.commit(session,dispatchDuel(session.state,action,session.context),action);
 }
 dispatchManual(id:string,action:TabletopAction):DuelState{
  const session=this.session(id);
  return this.commit(session,applyTabletop(session.state,action),action,true);
 }
 /** Practice-only rewind. Removes later actions rather than pretending rewound actions still occurred. */
 rewind(id:string,toActionCount:number):DuelState{
  const s=this.session(id);
  if(!Number.isInteger(toActionCount)||toActionCount<0||toActionCount>s.actions.length)throw new DuelEngineError('ILLEGAL_ACTION','Invalid rewind checkpoint');
  s.actions.length=toActionCount;s.snapshots.length=toActionCount+1;
  s.state=structuredClone(s.snapshots[toActionCount]);
  s.rulesVerified=!s.manualOnly&&!s.actions.some(isTabletopAction);
  return structuredClone(s.state);
 }
 /** Replay all recorded actions against the original seed and initial shuffled state. */
 verifyReplay(id:string):{matches:boolean;errors:string[];actionCount:number;rulesVerified:boolean}{
  const s=this.session(id);let current=structuredClone(s.initial);const errors:string[]=[];
  for(let i=0;i<s.actions.length;i++){
   const action=s.actions[i];
   try{current=isTabletopAction(action)?applyTabletop(current,action):dispatchDuel(current,action,s.context);
    errors.push(...auditDuelState(current).map(message=>`Action ${i+1}: ${message}`));
    if(errors.length)break;
   }catch(error){errors.push(`Action ${i+1}: ${error instanceof Error?error.message:String(error)}`);break;}
  }
  const matches=errors.length===0&&JSON.stringify(current)===JSON.stringify(s.state);
  if(!matches&&!errors.length)errors.push('Replay final state differs from live session');
  return {matches,errors,actionCount:s.actions.length,rulesVerified:s.rulesVerified};
 }
 /** Phase shortcuts preserve every validated transition; END also completes the turn. */
 advancePhase(id:string,destination:Phase|'NEXT'):DuelState{
  if(this.session(id).manualOnly)return this.dispatchManual(id,{type:'MANUAL_PHASE',seat:this.getState(id).current,destination});
  const initial=this.getState(id),turn=initial.turn;
  const order:Phase[]=['DRAW','STANDBY','MAIN_1','BATTLE','MAIN_2','END'];
  if(destination!=='NEXT'&&order.indexOf(destination)<order.indexOf(initial.phase))throw new DuelEngineError('ILLEGAL_ACTION','Cannot move to an earlier phase');
  if(destination==='BATTLE'&&turn===1)throw new DuelEngineError('ILLEGAL_ACTION','The first player cannot enter the opening Battle Phase');
  for(let n=0;n<7;n++){
   const state=this.getState(id);
   if(state.turn!==turn)break;
   if(destination!=='NEXT'&&destination!=='END'&&state.phase===destination)break;
   const action=this.getLegalActions(id,state.current).find(a=>a.type==='ADVANCE');
   if(!action){if(n>0)break;throw new DuelEngineError('ILLEGAL_ACTION','Resolve the pending effect or draw before changing phases');}
   this.dispatch(id,action);
   if(destination==='NEXT'&&state.turn===1&&state.phase==='MAIN_1'){const skip=this.getLegalActions(id,state.current).find(a=>a.type==='ADVANCE');if(skip)this.dispatch(id,skip);break;}
   if(destination==='NEXT'&&state.phase!=='MAIN_2')break;
   // Next from Main 2 enters End and completes the turn in one click.
   if(destination==='NEXT')destination='END';
  }
  return this.getState(id);
 }
 /** Pass this player's response. Auto-finish only when the next player has no card response. */
 resolveEffect(id:string):DuelState{
  let state=this.getState(id);
  if(!state.chain.length||state.pendingLightChoice||state.pendingDiscard)throw new DuelEngineError('ILLEGAL_ACTION','No chain waiting for responses');
  const pass=this.getLegalActions(id,state.priority).find(a=>a.type==='PASS_CHAIN');
  if(!pass)throw new DuelEngineError('ILLEGAL_ACTION','Resolve required choices first');
  state=this.dispatch(id,pass);
  if(state.chain.length&&!state.pendingLightChoice&&!state.pendingDiscard){
   const options=this.getLegalActions(id,state.priority);
   if(options.every(a=>a.type==='PASS_CHAIN'||a.type==='RESOLVE_CHAIN')){
    const next=options.find(a=>a.type==='PASS_CHAIN');if(next)state=this.dispatch(id,next);
   }
  }
  return state;
 }
 getHistory(id:string){const s=this.session(id);return {actions:structuredClone(s.actions),snapshots:structuredClone(s.snapshots),rulesVerified:s.rulesVerified};}
 close(id:string):boolean{return this.sessions.delete(id);}
}
