import './duelControls.css';
export type PoolResource={id:string;label:string;icon:string;amount:number};
/** Three visible slots; all positive resource types remain available by scrolling. */
export default function ResourcePool({resources,label}:{resources:PoolResource[];label:string}){
 const active=resources.filter(r=>r.amount>0);
 return <div className="dt-resource-pool" aria-label={label}>{active.length?<div className="dt-pool-contents" tabIndex={active.length>3?0:undefined}>{active.map(r=><div key={r.id} className="dt-pool-resource" title={r.label}><img key={`${r.id}:${r.amount}`} src={r.icon} alt={r.label}/><output aria-label={`${label} ${r.label} essence`}>{r.amount}</output></div>)}</div>:<span className="dt-pool-empty">Empty</span>}{active.length>3&&<small>↕ {active.length} types</small>}</div>;
}
