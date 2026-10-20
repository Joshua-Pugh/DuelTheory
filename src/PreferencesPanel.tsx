import DuelAudioControls from './audio/DuelAudioControls';
import type {DuelPreferences,DuelMode} from './preferences';
import {DEFAULT_PREFERENCES} from './preferences';
export default function PreferencesPanel({value,onChange}:{value:DuelPreferences;onChange:(next:DuelPreferences)=>void}){
 const patch=(next:Partial<DuelPreferences>)=>onChange({...value,...next});
 const modes:{id:DuelMode;name:string;detail:string}[]=[
  {id:'guided',name:'Guided',detail:'Learn from rules-assisted prompts and contextual explanations.'},
  {id:'competitive',name:'Competitive',detail:'Keep rules enforcement without the extra teaching prompts.'},
  {id:'manual',name:'Manual sandbox',detail:'Move cards yourself with logged overrides, counters and dice. Rules-assisted actions remain available on request.'},
 ];
 return <section className="preferences-page"><div className="page-heading"><span className="eyebrow">PLAY YOUR WAY</span><h1>Preferences</h1><p>All settings are stored in this browser. No account or server required.</p></div><div className="panel preferences-panel"><h2>Default duel experience</h2><div className="mode-grid">{modes.map(mode=><button key={mode.id} type="button" className={'mode-choice '+(value.mode===mode.id?'selected':'')} aria-pressed={value.mode===mode.id} onClick={()=>patch({mode:mode.id})}><strong>{mode.name}</strong><span>{mode.detail}</span></button>)}</div><h2>Duel audio</h2><DuelAudioControls/><h2>Assistance &amp; presentation</h2><div className="preference-options">{([
  ['aiLearning','Allow AI learning preview','Record decisions in AI practice on this device for review and feedback. Off by default. Nothing is uploaded; this preview does not train or change the AI automatically.'],
  ['showExplanations','Explain legal actions','Show explanations grounded in known action types and current game context.'],
  ['showLegalTargetHints','Highlight target choices','Describe valid targets supplied by the rules engine.'],
  ['confirmActions','Confirm actions','Ask before applying a rules-enforced action.'],
  ['showEventTimeline','Show action history','Display a running record of resolved engine events.'],
 ] as const).map(([key,label,detail])=><label key={key} className="preference-option"><input type="checkbox" checked={value[key]} onChange={e=>patch({[key]:e.target.checked})}/><span><strong>{label}</strong><small>{detail}</small></span></label>)}</div><button className="secondary" onClick={()=>onChange({...DEFAULT_PREFERENCES})}>Restore defaults</button><p className="muted">Guided and Competitive share legality checks. Manual pauses automatic draws and progression; use the marked rules-assisted actions when wanted, or tabletop moves to resolve effects yourself. Overrides are logged as possibly illegal and results are not rules-verified.</p></div></section>;
}
