import {RESOURCES,type ResourceCost} from './ashenPresentation';
export default function CostSymbols({cost,label='Cost'}:{cost?:ResourceCost;label?:string}){
 if(!cost)return null;
 const entries=RESOURCES.flatMap(resource=>{const count=cost[resource]??0;return count>0?[{resource,count}]:[];});
 if(!entries.length)return <span className="ashen-cost-free" aria-label={`${label}: 0`}>0</span>;
 return <span className="ashen-costs" role="img" aria-label={`${label}: ${entries.map(e=>`${e.count} ${e.resource}`).join(', ')}`}>{entries.map(({resource,count})=><span className="ashen-cost-token" key={resource}>{count>1&&<b>{count}</b>}<img src={`/ashen/costs/${resource}.png`} alt=""/></span>)}</span>;
}
