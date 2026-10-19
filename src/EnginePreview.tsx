import PublicCardReveal from './PublicCardReveal';
import {chooseChaosTurbo} from './ai/chaosTurbo';
import {goatPlayerView,hasDecision} from './ai/policy';
import {useDuelAudio} from './audio/useDuelAudio';
import SupportedDeckSetup from './SupportedDeckSetup';
import {REASONING_GATE,CHAOS_TURBO,GOAT_CONTROL,assessDeck} from './supportedDecks';
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

export default function EnginePreview({initialAI=false,deck,catalog,preferences,onOpenPreferences,onLoadDeck}:{initialAI?:boolean;deck:Deck;catalog:Card[];preferences:DuelPreferences;onOpenPreferences:()=>void;onLoadDeck?:(deck:Deck)=>void}){
 const [opponentMode,setOpponentMode]=useState<'local'|'ai'>(initialAI?'ai':'local'),[sessionAi,setSessionAi]=useState(false),[aiNote,setAiNote]=useState('');
 const [playerDeck,setPlayerDeck]=useState(initialAI?'chaos':'current'),[opponentDeck,setOpponentDeck]=useState('chaos');
 const selectedDeck=playerDeck==='reasoning'?REASONING_GATE:playerDeck==='chaos'?CHAOS_TURBO:playerDeck==='goat'?GOAT_CONTROL:deck,selectedOpponent=opponentMode==='ai'?CHAOS_TURBO:opponentDeck==='reasoning'?REASONING_GATE:opponentDeck==='chaos'?CHAOS_TURBO:opponentDeck==='goat'?GOAT_CONTROL:deck;
 const coverage=assessDeck(selectedDeck,catalog),opponentCoverage=assessDeck(selectedOpponent,catalog);
 const service=useMemo(()=>new GameService(),[]),suppressAuto=useRef(false);
 const [id,setId]=useState<string|null>(null),[duel,setDuel]=useState<DuelState|null>(null);
 const [acknowledgedReveal,setAcknowledgedReveal]=useState(0);
 const [attackQueue,setAttackQueue]=useState<{turn:number;seat:0|1;ids:string[]}|null>(null);
 const [coinSeed,setCoinSeed]=useState<number|null>(null);
 const [fixedSeed,setFixedSeed]=useState(false),[seed,setSeed]=useState(20261014);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[dialog,setDialog]=useState<LegalAction|null>(null),[showDuel,setShowDuel]=useState(false);
 useDuelAudio(showDuel?duel:null,sessionAi?0:undefined,catalog);
 useEffect(()=>{if(!showDuel&&coinSeed===null)return;const prior=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=prior;};},[showDuel,coinSeed]);
 const sessionActions=(sessionId:string)=>[...service.getLegalActions(sessionId,0),...service.getLegalActions(sessionId,1)];
 const allActions=id&&duel?sessionActions(id):[];
 const actions=sessionAi?allActions.filter(a=>a.seat===0):allActions;
 const aiThinking=Boolean(sessionAi&&duel&&hasDecision(duel,1,allActions.filter(a=>a.seat===1)));
 const playerView=useMemo(()=>duel&&sessionAi?goatPlayerView(duel,0,catalog):duel,[duel,sessionAi,catalog]);
 const fullManual=id?service.isManual(id):preferences.mode==='manual';
 const reveal=duel&&duel.events[duel.events.length-1]?.type==='BATTLE_FLIP'&&acknowledgedReveal!==duel.events.length&&duel.pendingAttack?.targetId?catalog.find(c=>c.id===duel.cards[duel.pendingAttack!.targetId!].cardId):undefined;
 const aiReveal=sessionAi&&duel?duel.events.slice(acknowledgedReveal).find(e=>e.seat===1&&e.revealedCardIds?.length):undefined;
 const commit=(work:()=>DuelState,fromAi=false)=>{suppressAuto.current=false;try{setDuel(work());setError('');setDialog(null);setNotice('');}catch(e){suppressAuto.current=fromAi;setError((fromAi?'AI paused after an error. Exit and restart the duel. ':'')+(e instanceof Error?e.message:'Unable to perform action'));setDialog(null);if(id)setDuel(service.getState(id));}};
 const manual=(action:TabletopAction)=>{if(id&&!sessionAi)commit(()=>service.dispatchManual(id,action));};
 const start=()=>{if(opponentMode==='ai'&&(preferences.mode==='manual'||!coverage.supported)){setError('Chaos Turbo AI requires a supported deck and guided preferences.');return;}setDialog(null);setError('');setCoinSeed(fixedSeed?seed:freshDuelSeed());};
 const exitFinished=()=>{if(id)service.close(id);setId(null);setDuel(null);setSessionAi(false);setAiNote('');setCoinSeed(null);setShowDuel(false);setDialog(null);setError('');setNotice('');};
 const beginAfterToss=()=>{if(coinSeed===null)return;try{const {firstSeat}=openingCoin(coinSeed);const next=service.createGoatSession([selectedDeck,selectedOpponent],catalog,coinSeed,firstSeat,preferences.mode==='manual'?'manual':'auto');if(id)service.close(id);suppressAuto.current=false;setAcknowledgedReveal(0);setId(next);setSessionAi(opponentMode==='ai');setAiNote('');setDuel(service.getState(next));setCoinSeed(null);setError('');setNotice('');setDialog(null);setShowDuel(true);}catch(e){setCoinSeed(null);setError(e instanceof Error?e.message:'Unable to start duel');}};
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
 const choose=(a:LegalAction)=>{if(a.type==='ADVANCE'){nextPhase();return;}if(preferences.confirmActions&&!a.type.startsWith('ACTIVATE_')&&!['DRAW_PHASE','PASS_CHAIN','RESOLVE_CHAIN','PASS_ATTACK_RESPONSE','PASS_SUMMON_RESPONSE','PASS_FREE_RESPONSE','ADVANCE_DAMAGE_STEP','CHOOSE_DISCARD','CHOOSE_RANDOM_DISCARD','COMPLETE_DUSTSHOOT','COMPLETE_DIE_ROLL','DECLINE_TRIGGER','DECLINE_PENDING_TRIGGER','TRIGGER_SEARCH','ACTIVATE_TRIGGER'].includes(a.type))setDialog(a);else perform(a);};
 const skipTo=(phase:Phase)=>{if(id)commit(()=>service.advancePhase(id,phase));};
 const nextPhase=()=>{if(id)commit(()=>service.advancePhase(id,'NEXT'));};
 const resolve=()=>{if(id)commit(()=>service.resolveEffect(id));};
 // Deal animations run first; every later Draw Phase draws once without a separate deck click.
 useEffect(()=>{
  if(fullManual||!id||!duel||!showDuel||coinSeed!==null||reveal||aiReveal||suppressAuto.current||(duel.winner!==null||duel.drawnGame))return;
  const aiDecision=sessionAi?chooseChaosTurbo(duel,allActions,1,catalog):undefined;
  const automatic=aiDecision?.action??(duel.pendingRoll?actions.find(a=>a.type==='COMPLETE_DIE_ROLL'):duel.pendingDraw?actions.find(a=>a.type==='DRAW_PHASE'):unopposedResponse(actions)??actions.find(a=>a.type==='ADVANCE_DAMAGE_STEP'));
  if(!automatic)return;
  const timer=window.setTimeout(()=>{
   if(suppressAuto.current)return;
   const fresh=sessionActions(id).find(a=>JSON.stringify(a)===JSON.stringify(automatic));if(fresh){if(aiDecision)setAiNote(aiDecision.reason);commit(()=>service.dispatch(id,fresh),Boolean(aiDecision));}
  },aiDecision?(duel.events.length===1?1400:650):duel.pendingRoll?(window.matchMedia('(prefers-reduced-motion: reduce)').matches?100:DIE_ROLL_DURATION):duel.events.length===1?1400:shouldAutoResolve(duel,actions)?250:400);
  return()=>window.clearTimeout(timer);
 },[id,duel,showDuel,coinSeed,reveal,acknowledgedReveal,preferences.mode,sessionAi]);
 const undo=()=>{setAttackQueue(null);if(!id)return;try{const count=service.getHistory(id).actions.length;if(count){const rewound=service.rewind(id,count-1);suppressAuto.current=!rewound.pendingRoll;setAcknowledgedReveal(0);setDuel(rewound);setNotice(rewound.pendingRoll?'Replaying the same die result after Undo.':'Rewound one action. Automatic progression paused until your next action.');}}catch(e){setError(e instanceof Error?e.message:String(e));}};
 const verify=()=>{if(!id)return;const r=service.verifyReplay(id);setNotice(r.matches?`Replay verified (${r.actionCount} actions).${r.rulesVerified?'':' Includes manual tabletop actions.'}`:`Replay mismatch: ${r.errors.join('; ')}`);};
 return <div className="panel dt-goat-arena"><h3>GOAT Duel Arena</h3><p className="muted">Fresh shuffles, automatic turn draws, and card effects with choices on the field. Play both seats locally, or practice against the Chaos Turbo AI prototype. It uses a resource-first strategy and only legal actions; it cannot inspect your hidden cards.</p><div className="dt-matchup-selectors"><label>Opponent control<select aria-label="Opponent control" value={opponentMode} onChange={e=>setOpponentMode(e.target.value as 'local'|'ai')}><option value="local">Local · control both players</option><option value="ai">Chaos Turbo AI · prototype</option></select></label></div>{opponentMode==='ai'&&<p className="muted">You are Player 1. The AI uses the Riclar91 Chaos Turbo preset; the coin flip still decides who starts. Single-game guided practice; AI sideboarding is not included.</p>}{opponentMode==='ai'&&<details className="panel"><summary>How this AI plays Chaos Turbo</summary><p>Build card advantage with Spy, Dekoichi and Faith. Thin with Thunder Dragon, use recoverable discards, then turn LIGHT/DARK resources into Chaos threats. The policy estimates unknown defenders and preserves responses when exchanges are poor. It is a practice prototype and can make tactical mistakes.</p><p><a href="https://www.goatformat.com/chaos-turbo.html" target="_blank" rel="noreferrer">Deck source and overview ↗</a> · <a href="https://www.goatformat.com/home/ghostrider15s-chaos-turbo-analysis" target="_blank" rel="noreferrer">Published strategy analysis ↗</a></p></details>}{opponentMode==='ai'&&(preferences.mode==='manual'||!coverage.supported)&&<p role="status">AI practice needs a supported player deck and guided preferences. Choose a supported preset below, or switch Preferences out of manual mode.</p>}<SupportedDeckSetup opponentLocked={opponentMode==='ai'} deck={deck} playerDeck={playerDeck} opponentDeck={opponentMode==='ai'?'chaos':opponentDeck} onPlayer={setPlayerDeck} onOpponent={setOpponentDeck} onLoadDeck={onLoadDeck} supported={coverage.supported&&opponentCoverage.supported} manual={preferences.mode==='manual'} unsupported={[...coverage.unsupported,...opponentCoverage.unsupported]}/><label style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}><input type="checkbox" checked={fixedSeed} onChange={e=>setFixedSeed(e.target.checked)}/>Use a fixed seed for replay testing</label>{fixedSeed&&<div className="input-row"><label htmlFor="duel-seed">Shuffle seed</label><input id="duel-seed" type="number" value={seed} onChange={e=>setSeed(Number(e.target.value))}/></div>}<div className="dt-setup-actions"><button className="primary" disabled={opponentMode==='ai'&&(preferences.mode==='manual'||!coverage.supported)||selectedDeck.main.length<6||selectedOpponent.main.length<6||coverage.missing.length>0||opponentCoverage.missing.length>0||catalog.length===0} onClick={start}>Start GOAT duel</button><button className="secondary" onClick={onOpenPreferences}>Preferences: {preferences.mode}</button>{duel&&!showDuel&&<button className="primary" onClick={()=>setShowDuel(true)}>Return to duel</button>}</div>{error&&!showDuel&&<p role="alert" className="error">{error}</p>}
 {coinSeed!==null&&createPortal(<OpeningCoinDialog key={coinSeed} seed={coinSeed} onBegin={beginAfterToss} onExit={exitFinished}/>,document.body)}
 {duel&&showDuel&&createPortal(<><DuelField key={id} fixedSeat={sessionAi?0:undefined} aiOpponent={sessionAi} state={playerView!} catalog={catalog} actions={actions} onAttackAll={attackAll} attackAllRunning={Boolean(attackQueue)} onStopAttacks={()=>setAttackQueue(null)} onAction={a=>a.type==='DECLARE_ATTACK'?perform(a):choose(a)} onManual={manual} manualMode={fullManual} onSkipPhase={skipTo} onNextPhase={nextPhase} onResolve={resolve} onUndo={undo} onVerify={verify} onExit={()=>{setShowDuel(false);setDialog(null);}} notice={[notice,sessionAi?(aiReveal?'Review the AI’s revealed cards.':aiThinking?'Chaos Turbo AI is thinking…':aiNote?`AI: ${aiNote}`:'You are Player 1 · Chaos Turbo AI is Player 2'):''].filter(Boolean).join(' · ')}/>{(duel.winner!==null||duel.drawnGame)&&coinSeed===null&&<DuelEndedDialog state={duel} onAgain={start} onExit={exitFinished}/>} {error&&<div className="dt-room-error" role="alert">{error}<button onClick={()=>setError('')}>Dismiss</button></div>}{aiReveal&&<PublicCardReveal title="Chaos Turbo AI · revealed cards" cards={(aiReveal.revealedCardIds??[]).map(id=>catalog.find(c=>c.id===id)).filter((c):c is Card=>!!c)} onContinue={()=>setAcknowledgedReveal(duel.events.length)}/>} {reveal&&<div className="dt-room-modal-backdrop"><div className="dt-room-modal dt-battle-reveal" onKeyDown={e=>{if(e.key==='Tab')e.preventDefault();e.stopPropagation();}} role="dialog" aria-modal="true" aria-label="Battle reveal"><h2>Face-down monster revealed</h2>{reveal.image&&<img src={reveal.image} alt={reveal.name}/>}<h3>{reveal.name}</h3><p>{reveal.atk} ATK / {reveal.def} DEF</p><p>{reveal.desc}</p><button autoFocus className="dt-modal-primary" onClick={()=>setAcknowledgedReveal(duel.events.length)}>Continue battle</button></div></div>}{dialog&&<div className="dt-room-modal-backdrop"><div className="dt-room-modal" role="dialog" aria-modal="true" aria-label="Confirm duel action"><h2>Confirm action</h2><p>{dialog.description}</p><div><button className="dt-modal-primary" onClick={()=>perform(dialog)}>Confirm</button><button onClick={()=>setDialog(null)}>Cancel</button></div></div></div>}</>,document.body)}</div>;
}
