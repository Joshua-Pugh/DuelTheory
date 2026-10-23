import type {LegalAction,Seat} from './engine/model';
type Response={id:string;name:string;targetHint?:string;options:LegalAction[]};
export default function EffectDecision({effectDetails,attackDetails,player,viewer,name,required=false,optional=false,summon=false,attack=false,endTurn=false,breaker=false,responses=[],onUse,onSkip,onPass,onRespond,onView}:{effectDetails?:string;attackDetails?:string;player:Seat;viewer:Seat;name:string;required?:boolean;optional?:boolean;summon?:boolean;attack?:boolean;endTurn?:boolean;breaker?:boolean;responses?:Response[];onUse:()=>void;onSkip?:()=>void;onPass:()=>void;onRespond:(response:Response)=>void;onView:()=>void}){
 const response=!required&&!optional;
 const compact=response&&!summon&&!attack;
 return <div className={`dt-effect-prompt${player!==viewer?' opponent':''}${compact?' dt-response-strip':''}`} role={compact?'region':'dialog'} aria-label={compact?'Response opportunity':'Effect decision'}>
  <small>PLAYER {player+1}{required?' · REQUIRED EFFECT':''}</small>
  <strong>{required?`Resolve ${name}’s required effect`:optional?`Use ${name}’s effect?`:endTurn?'Respond before turn ends':summon?'Respond to the summon?':attack?'Respond to the attack?':`Respond to ${name}?`}</strong>
  {effectDetails&&<p className="dt-effect-details">{effectDetails}</p>}
  {attackDetails&&<p className="dt-attack-details">{attackDetails}</p>}
  <p>{required?(breaker?'Breaker must gain its Spell Counter when its summon effect resolves.':'This effect is mandatory in guided play. Choose any required targets to continue.'):optional?'Use the effect, or skip it without activating.':endTurn?'Your opponent is ending their turn. Activate a legal response, or pass. The turn stays in the End Phase while effects resolve.':summon?'Activate a legal response below, or pass this summon window. Passing closes your opportunity to use Torrential Tribute for this summon.':'Activate a legal response, or continue without responding. The activated effect still resolves.'}</p>
  {response&&player===viewer&&responses.length>0&&<div className="dt-response-cards">{responses.map(r=><button key={r.id} onClick={()=>onRespond(r)}>Activate {r.name}{r.targetHint&&` · ${r.targetHint}`}</button>)}</div>}
  <div>{response?<>{player!==viewer&&<button className="dt-gold-button" onClick={onView}>{endTurn?'Respond before turn ends':'View your response cards'}</button>}<button onClick={onPass}>{endTurn?'Pass · allow turn to end':'No response · continue'}</button></>:<><button className="dt-gold-button" onClick={onUse}>{required?'Resolve required effect':'Yes · use effect'}</button>{optional&&onSkip&&<button onClick={onSkip}>No · skip effect</button>}</>}</div>
 </div>;
}
