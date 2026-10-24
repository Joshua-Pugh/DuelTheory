import './duelControls.css';
export type PhaseStep={id:string;label:string;title:string;active?:boolean;disabled?:boolean;onSelect:()=>void};
/** Presentation is shared; each game supplies its own legal transitions. */
export default function PhaseSelector({steps,next,className=''}:{steps:PhaseStep[];next?:{label:string;disabled:boolean;onSelect:()=>void};className?:string}){
 return <div className={`dt-phase-selector ${className}`} role="group" aria-label="Phase selector">{steps.map(step=><button key={step.id} data-phase={step.id} title={step.title} aria-current={step.active?'step':undefined} className={step.active?'active':''} disabled={step.disabled} onClick={step.onSelect}>{step.label}</button>)}{next&&<button className="dt-field-next" disabled={next.disabled} onClick={next.onSelect}>{next.label}</button>}</div>;
}
