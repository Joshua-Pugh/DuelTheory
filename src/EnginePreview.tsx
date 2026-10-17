import {CHAOS_TURBO,CHAOS_SOURCE,assessDeck} from './supportedDecks';
import {DIE_ROLL_DURATION} from './DuelEffectAnimations';
import {shouldAutoResolve,unopposedResponse} from './duelResolution';
import {directAttackQueue} from './battleShortcuts';
import {useEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import DuelField from './DuelField';
import {OpeningCoinDialog,DuelEndedDialog} from './DuelLifecycleDialogs';
import {openingCoin} from './duelLifecycle';
import type {DuelPreferences} from './preferences';
import type {Card,Deck} from './core/types';
import type {DuelState,LegalAction,Phase} from './engine/model';
import {GameService,freshDuelSeed,type TabletopAction} from './services/GameService';
import './duelRoom.css';

export default function EnginePreview({deck,catalog,preferences,onOpenPreferences,onLoadDeck}:{deck:Deck;catalog:Card[];preferences:DuelPreferences;onOpenPreferences:()=>void;onLoadDeck?:(deck:Deck)=>void}){
 const [playerDeck,setPlayerDeck]=useState('current'),[opponentDeck,setOpponentDeck]=useState('chaos');
 const selectedDeck=playerDeck==='chaos'?CHAOS_TURBO:deck,selectedOpponent=opponentDeck==='chaos'?CHAOS_TURBO:deck;
 const coverage=assessDeck(selectedDeck,catalog),opponentCoverage=assessDeck(selectedOpponent,catalog);
 const service=useMemo(()=>new GameService(),[]),suppressAuto=useRef(false);
 const [id,setId]=useState<string|null>(null),[duel,setDuel]=useState<DuelState|null>(null);
 const [acknowledgedReveal,setAcknowledgedReveal]=useState(0);
 const [attackQueue,setAttackQueue]=useState<{turn:number;seat:0|1;ids:string[]}|null>(null);
 const [coinSeed,setCoinSeed]=useState<number|null>(null);
 const [fixedSeed,setFixedSeed]=useState(false),[seed,setSeed]=useState(20261014);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[dialog,setDialog]=useState<LegalAction|null>(null),[showDuel,setShowDuel]=useState(false);
 useEffect(()=>{if(!showDuel&&coinSeed===null)return;const prior=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=prior;};},[showDuel,coinSeed]);
 const sessionActions=(sessionId:string)=>[...service.getLegalActions(sessionId,0),...service.getLegalActions(sessionId,1)];
 const actions=id&&duel?sessionActions(id):[];
 const fullManual=id?service.isManual(id):preferences.mode==='manual';
 const reveal=duel&&duel.events[duel.events.length-1]?.type==='BATTLE_FLIP'&&acknowledgedReveal!==duel.events.length&&duel.pendingAttack?.targetId?catalog.find(c=>c.id===duel.cards[duel.pendingAttack!.targetId!].cardId):undefined;
 const commit=(work:()=>DuelState)=>{suppressAuto.current=false;try{setDuel(work());setError('');setDialog(null);setNotice('');}catch(e){setError(e instanceof Error?e.message:'Unable to perform action');setDialog(null);if(id)setDuel(service.getState(id));}};
 const manual=(action:TabletopAction)=>{if(id)commit(()=>service.dispatchManual(id,action));};
 const start=()=>{setDialog(null);setError('');setCoinSeed(fixedSeed?seed:freshDuelSeed());};
 const exitFinished=()=>{if(id)service.close(id);setId(null);setDuel(null);setCoinSeed(null);setShowDuel(false);setDialog(null);setError('');setNotice('');};
 const beginAfterToss=()=>{if(coinSeed===null)return;try{const {firstSeat}=openingCoin(coinSeed);const next=service.createGoatSession([selectedDeck,selectedOpponent],catalog,coinSeed,firstSeat,preferences.mode==='manual'?'manual':'auto');if(id)service.close(id);suppressAuto.current=false;setAcknowledgedReveal(0);setId(next);setDuel(service.getState(next));setCoinSeed(null);setError('');setNotice('');setDialog(null);setShowDuel(true);}catch(e){setCoinSeed(null);setError(e instanceof Error?e.message:'Unable to start duel');}};
 const perform=(a:LegalAction)=>{if(id)commit(()=>service.dispatch(id,a));};
 const attackAll=()=>{if(duel){const ids=directAttackQueue(duel,actions,duel.current);if(ids.length)setAttackQueue({turn:duel.turn,seat:duel.current,ids});}};
 useEffect(()=>{
  if(!attackQueue||!duel||!id||!showDuel)return;
  if(duel.turn!==attackQueue.turn||duel.current!==attackQueue.seat||duel.phase!=='BATTLE'||duel.winner!==null||duel.drawnGame||duel.players[attackQueue.seat===0?1:0].zones.monster.some(Boolean)){setAttackQueue(null);return;}
  // Skip an empty response window, but never pass a window offering a card response.
  const pass=actions.find(a=>a.type==='PASS_ATTACK_RESPONSE');
  if(pass&&actions.every(a=>a.type==='PASS_ATTACK_RESPONSE')){const timer=window.setTimeout(()=>perform(pass),250);return()=>window.clearTimeout(timer);}
  if(duel.pendingAttack||duel.chain.length||duel.pendingTriggers?.length||duel.pendingSearch||duel.pendingDiscard||duel.pendingRoll||duel.pendingRandomDiscard||duel.pendingDeckChoice||duel.summonResponse)return;
  const attack=actions.find(a=>a.type==='DECLARE_ATTACK'&&!a.targetId&&attackQueue.ids.includes(a.attackerId));
  if(!attack||attack.type!=='DECLARE_ATTACK'){setAttackQueue(null);return;}
  const timer=window.setTimeout(()=>{setAttackQueue(q=>q?{...q,ids:q.ids.filter(id=>id!==attack.attackerId)}:null);perform(attack);},350);
  return()=>window.clearTimeout(timer);
 },[duel,attackQueue,showDuel]);
 const choose=(a:LegalAction)=>{if(a.type==='ADVANCE'){nextPhase();return;}if(preferences.confirmActions&&!a.type.startsWith('ACTIVATE_')&&!['DRAW_PHASE','PASS_CHAIN','RESOLVE_CHAIN','PASS_ATTACK_RESPONSE','PASS_SUMMON_RESPONSE','PASS_FREE_RESPONSE','ADVANCE_DAMAGE_STEP','CHOOSE_DISCARD','CHOOSE_RANDOM_DISCARD','COMPLETE_DUSTSHOOT','COMPLETE_DIE_ROLL','TRIGGER_SEARCH','ACTIVATE_TRIGGER'].includes(a.type))setDialog(a);else perform(a);};
 const skipTo=(phase:Phase)=>{if(id)commit(()=>service.advancePhase(id,phase));};
 const nextPhase=()=>{if(id)commit(()=>service.advancePhase(id,'NEXT'));};
 const resolve=()=>{if(id)commit(()=>service.resolveEffect(id));};
 // Deal animations run first; every later Draw Phase draws once without a separate deck click.
 useEffect(()=>{
  if(fullManual||!id||!duel||!showDuel||coinSeed!==null||reveal||suppressAuto.current||(duel.winner!==null||duel.drawnGame))return;
  const automatic=duel.pendingRoll?actions.find(a=>a.type==='COMPLETE_DIE_ROLL'):duel.pendingDraw?actions.find(a=>a.type==='DRAW_PHASE'):unopposedResponse(actions)??actions.find(a=>a.type==='ADVANCE_DAMAGE_STEP');
  if(!automatic)return;
  const timer=window.setTimeout(()=>{
   if(suppressAuto.current)return;
   const fresh=sessionActions(id).find(a=>a.type===automatic.type);if(fresh)commit(()=>service.dispatch(id,fresh));
  },duel.pendingRoll?(window.matchMedia('(prefers-reduced-motion: reduce)').matches?100:DIE_ROLL_DURATION):duel.events.length===1?1400:shouldAutoResolve(duel,actions)?250:400);
  return()=>window.clearTimeout(timer);
 },[id,duel,showDuel,coinSeed,reveal,acknowledgedReveal,preferences.mode]);
 const undo=()=>{setAttackQueue(null);if(!id)return;try{const count=service.getHistory(id).actions.length;if(count){const rewound=service.rewind(id,count-1);suppressAuto.current=!rewound.pendingRoll;setAcknowledgedReveal(0);setDuel(rewound);setNotice(rewound.pendingRoll?'Replaying the same die result after Undo.':'Rewound one action. Automatic progression paused until your next action.');}}catch(e){setError(e instanceof Error?e.message:String(e));}};
 const verify=()=>{if(!id)return;const r=service.verifyReplay(id);setNotice(r.matches?`Replay verified (${r.actionCount} actions).${r.rulesVerified?'':' Includes manual tabletop actions.'}`:`Replay mismatch: ${r.errors.join('; ')}`);};
 return <div className="panel" style={{padding:20,marginTop:18}}><h3>GOAT Duel Arena</h3><p className="muted">Fresh shuffles, automatic turn draws, and card effects with choices on the field. Local practice lets you play both seats; AI opponents are not connected yet.</p><section className="dt-supported-decks"><h4>Currently supported prototype decks</h4><strong>Chaos Turbo · 2020 World Champion baseline</strong><p>The exact 40-card main deck piloted by Riccardo Lari (Riclar91). Card effects and choices are implemented for prototype practice. No Side or Extra Deck is included; sideboarding and AI play are not available.</p><a href={CHAOS_SOURCE} target="_blank" rel="noreferrer">Tournament list and strategy</a> · <a href={'./decks/chaos-turbo.ydk'} download>Download Chaos Turbo .ydk</a>{onLoadDeck&&<button className="secondary" onClick={()=>onLoadDeck(structuredClone(CHAOS_TURBO))}>Open Chaos Turbo in Deck Builder</button>}<div><label>Your deck <select value={playerDeck} onChange={e=>setPlayerDeck(e.target.value)}><option value="current">Current Deck Builder deck: {deck.name}</option><option value="chaos">Chaos Turbo · supported prototype</option></select></label><label>Opponent deck <select value={opponentDeck} onChange={e=>setOpponentDeck(e.target.value)}><option value="chaos">Chaos Turbo · supported prototype</option><option value="current">Current Deck Builder deck: {deck.name}</option></select></label></div><p role="status">{coverage.supported&&opponentCoverage.supported?(preferences.mode==='manual'?'Full manual play selected.':'Both decks support guided effects.'):'This entire match will use full manual play. One or both decks contain unverified cards, an Extra Deck, or an invalid main-deck size. You move cards, draw, and adjust LP yourself.'}</p>{[...coverage.unsupported,...opponentCoverage.unsupported].length>0&&<details><summary>Cards requiring manual play</summary><p>{[...new Set([...coverage.unsupported,...opponentCoverage.unsupported])].join(', ')}</p></details>}</section><label style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}><input type="checkbox" checked={fixedSeed} onChange={e=>setFixedSeed(e.target.checked)}/>Use a fixed seed for replay testing</label>{fixedSeed&&<div className="input-row"><label htmlFor="duel-seed">Shuffle seed</label><input id="duel-seed" type="number" value={seed} onChange={e=>setSeed(Number(e.target.value))}/></div>}<div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="primary" disabled={selectedDeck.main.length<6||selectedOpponent.main.length<6||coverage.missing.length>0||opponentCoverage.missing.length>0||catalog.length===0} onClick={start}>Start GOAT duel</button><button className="secondary" onClick={onOpenPreferences}>Preferences: {preferences.mode}</button>{duel&&!showDuel&&<button className="primary" onClick={()=>setShowDuel(true)}>Return to duel</button>}</div>{error&&!showDuel&&<p role="alert" className="error">{error}</p>}
 {coinSeed!==null&&createPortal(<OpeningCoinDialog key={coinSeed} seed={coinSeed} onBegin={beginAfterToss} onExit={exitFinished}/>,document.body)}
 {duel&&showDuel&&createPortal(<><DuelField key={id} state={duel} catalog={catalog} actions={actions} onAttackAll={attackAll} attackAllRunning={Boolean(attackQueue)} onStopAttacks={()=>setAttackQueue(null)} onAction={a=>a.type==='DECLARE_ATTACK'?perform(a):choose(a)} onManual={manual} manualMode={fullManual} onSkipPhase={skipTo} onNextPhase={nextPhase} onResolve={resolve} onUndo={undo} onVerify={verify} onExit={()=>{setShowDuel(false);setDialog(null);}} notice={notice}/>{(duel.winner!==null||duel.drawnGame)&&coinSeed===null&&<DuelEndedDialog state={duel} onAgain={start} onExit={exitFinished}/>} {error&&<div className="dt-room-error" role="alert">{error}<button onClick={()=>setError('')}>Dismiss</button></div>}{reveal&&<div className="dt-room-modal-backdrop"><div className="dt-room-modal dt-battle-reveal" onKeyDown={e=>{if(e.key==='Tab')e.preventDefault();e.stopPropagation();}} role="dialog" aria-modal="true" aria-label="Battle reveal"><h2>Face-down monster revealed</h2>{reveal.image&&<img src={reveal.image} alt={reveal.name}/>}<h3>{reveal.name}</h3><p>{reveal.atk} ATK / {reveal.def} DEF</p><p>{reveal.desc}</p><button autoFocus className="dt-modal-primary" onClick={()=>setAcknowledgedReveal(duel.events.length)}>Continue battle</button></div></div>}{dialog&&<div className="dt-room-modal-backdrop"><div className="dt-room-modal" role="dialog" aria-modal="true" aria-label="Confirm duel action"><h2>Confirm action</h2><p>{dialog.description}</p><div><button className="dt-modal-primary" onClick={()=>perform(dialog)}>Confirm</button><button onClick={()=>setDialog(null)}>Cancel</button></div></div></div>}</>,document.body)}</div>;
}
