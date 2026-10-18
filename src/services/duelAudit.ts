import type {DuelState,Seat} from '../engine/model';

/** Invariant checks for explicit zones and card ownership; safe to run after each action. */
export function auditDuelState(s:DuelState):string[]{
 const errors:string[]=[];const located=new Map<string,string>();
 const register=(id:string,location:string,owner:Seat,controller?:Seat,zone?:number)=>{
  const card=s.cards[id];
  if(!card){errors.push(`${location}: missing instance ${id}`);return;}
  const prior=located.get(id);if(prior)errors.push(`${id} appears in both ${prior} and ${location}`);
  located.set(id,location);
  if(card.location!==location.split(':')[0])errors.push(`${id} location mismatch: ${card.location} vs ${location}`);
  if(card.owner!==owner && (location.startsWith('deck:')||location.startsWith('hand:')||location.startsWith('graveyard:')||location.startsWith('banished:')||location.startsWith('extra:')))errors.push(`${id} owner mismatch`);
  if(controller!==undefined&&card.controller!==controller)errors.push(`${id} controller mismatch`);
  if(zone!==undefined&&card.zone!==zone)errors.push(`${id} zone mismatch`);
 };
 for(const seat of [0,1] as const){
  const p=s.players[seat];
  for(const place of ['deck','hand','graveyard','banished','extra'] as const)for(const id of p[place]||[])register(id,`${place}:${seat}`,seat);
  for(const kind of ['monster','spell'] as const){
   const zones=p.zones[kind];if(zones.length!==5)errors.push(`P${seat+1} ${kind} zones length ${zones.length}`);
   zones.forEach((id,zone)=>{if(id!==null)register(id,`${kind}:${seat}:${zone}`,seat,seat,zone);});
  }
  if(!Number.isFinite(p.lp)||p.lp<0)errors.push(`P${seat+1} has invalid LP ${p.lp}`);
 }
 for(const id of Object.keys(s.cards))if(!located.has(id)&&!s.cards[id].tokenGone)errors.push(`${id} is missing from all locations`);
 return errors;
}
