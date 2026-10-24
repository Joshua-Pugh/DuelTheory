import {roomProfile,tableSources,type RoomCommand,type TableRoomState} from './model';
export type CompactTracker={id:string;label:string;field:'life'|'poison'|'counter'|'damage';key?:string;value:number;min:number;max:number;canAdd:boolean};
export function compactTrackers(state:TableRoomState,playerId:string,includeOwnSources=false):CompactTracker[]{
 const p=state.players.find(p=>p.id===playerId);if(!p)return [];
 const profile=roomProfile(state),result:CompactTracker[]=[{id:'life',label:profile.health.label,field:'life',value:p.life,min:-99999,max:99999,canAdd:true}];
 if(!state.profile)result.push({id:'poison',label:'Poison',field:'poison',value:p.poison,min:0,max:999,canAdd:true});
 const counters=[...new Set([...profile.counters.map(c=>c.label),...state.players.flatMap(x=>Object.keys(x.counters))])];
 for(const key of counters){if(!state.profile&&key==='Poison')continue;const own=Object.hasOwn(p.counters,key);result.push({id:JSON.stringify(['counter',key]),label:key,field:'counter',key,value:own?p.counters[key]:0,min:0,max:9999,canAdd:own||Object.keys(p.counters).length<8});}
 if(profile.sourceDamage.enabled)for(const source of tableSources(state).filter(source=>includeOwnSources||source.ownerId!==playerId))result.push({id:JSON.stringify(['damage',source.key]),label:`Damage · ${source.owner} · ${source.name}`,field:'damage',key:source.key,value:p.damage[source.key]||0,min:0,max:999,canAdd:true});
 return result;
}
export function trackerCommand(tracker:CompactTracker,delta:number,linkDamage:boolean):Extract<RoomCommand,{type:'adjust'}>{return {type:'adjust',field:tracker.field,delta,...(tracker.key?{key:tracker.key}:{}),...(tracker.field==='damage'?{loseLife:linkDamage}:{})};}
